<template>
  <div>
    <PortalButton 
      @click="handleClick"
      :is-active="isOpen"
    />
    <div v-if="pendingCount > 0" class="notification-badge">
      {{ pendingCount > 99 ? '99+' : pendingCount }}
    </div>

    <!-- 通知组件 -->
    <div class="share-notification" v-if="showNotification && latestShare" :class="{ 'show': showNotification }">
      <div class="notification-content">
        <div class="notification-header">
          <el-avatar :src="latestShare.senderAvatar" class="sender-avatar"></el-avatar>
          <div class="notification-title">
            <span class="sender-name">{{ latestShare.senderName || '用户' + latestShare.senderId }}</span>
            <span>向你分享了一首歌</span>
          </div>
          <el-button class="close-notification" circle @click="closeNotification">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="notification-body">
          <div class="song-info" v-if="songDetails[latestShare.songId]">
            <img :src="getSongCover(songDetails[latestShare.songId])" alt="封面" class="song-cover">
            <div class="song-text">
              <div class="song-name">{{ songDetails[latestShare.songId].songInfo.songName }}</div>
              <div class="song-artist">{{ songDetails[latestShare.songId].songInfo.songArtist }}</div>
            </div>
          </div>
          <div v-else class="loading-song">
            <el-skeleton :rows="2" animated />
          </div>
          <div class="share-message" v-if="latestShare.contentText">
            {{ latestShare.contentText }}
          </div>
        </div>
        <div class="notification-actions">
          <el-button type="primary" @click="handleShare(latestShare, true)">保存到我的仓库</el-button>
          <el-button @click="handleShare(latestShare, false)">丢弃</el-button>
        </div>
      </div>
    </div>

    <div class="fullscreen-share-box" :class="{ 
      'drop-in': isOpen, 
      'pull-up': !isOpen && wasOpen 
    }" v-show="isOpen || wasOpen">
      <div class="portal-header">
        <h2>回忆仓库</h2>
      </div>
      <div class="tabs-container">
        <div class="tabs-header">
          <div 
            v-for="tab in tabs" 
            :key="tab.name"
            class="tab-item"
            :class="{ 'active': activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            {{ tab.label }}
            <div class="tab-indicator"></div>
          </div>
        </div>
        <div class="tabs-content">
          <div v-show="activeTab === 'pending'" class="tab-pane">
            <MusicShareBox 
              class="fullscreen-content"
              :shares="receivedShares"
              :song-details="songDetails"
              @handle-share="handleShare"
              @update:pending-count="updatePendingCount"
            />
          </div>
          <div v-show="activeTab === 'stored'" class="tab-pane">
            <MusicStorageBox 
              class="fullscreen-content" 
              :shares="receivedShares"
              :song-details="songDetails"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import PortalButton from './PortalButton.vue';
import MusicShareBox from './MusicShareBox.vue';
import MusicStorageBox from './MusicStorageBox.vue';
import { WebSocketService } from '@/util/webSocketService';
import { IMessage } from '@stomp/stompjs';
import { ResultCode, websocketRoot } from '@/util/webConst';
import { Share } from '@/interface/share';
import { Song } from '@/interface/song';
import { getMyShares, handleShareDecision } from '@/api/share';
import { getSongContent } from '@/api/song';

const isOpen = ref(false);
const wasOpen = ref(false);
const activeTab = ref('pending');
const pendingCount = ref(0);
const userId = Number(localStorage.getItem("userid"));
let wsService: WebSocketService | null = null;

const receivedShares = ref<Share.MusicShareMessage[]>([]);
const songDetails = reactive<Record<number, Song.SongContent>>({});

// 通知相关
const showNotification = ref(false);
const latestShare = ref<Share.MusicShareMessage | null>(null);
const notificationTimer = ref<number | null>(null);

const tabs = [
  { name: 'pending', label: '待处理分享' },
  { name: 'stored', label: '我的仓库' }
];

const handleClick = () => {
  if (!isOpen.value) {
    wasOpen.value = true;
  }
  isOpen.value = !isOpen.value;
};

const updatePendingCount = () => {
  pendingCount.value = receivedShares.value.filter(share => share.curStatus === 'PENDING').length;
};

// 获取歌曲详情
const fetchSongDetail = async (songId: number) => {
  try {
    if (!songDetails[songId]) {
      const res = await getSongContent(songId);
      if (res.code === ResultCode.SUCCESS && res.oData) {
        songDetails[songId] = res.oData;
      }
    }
  } catch (error) {
    console.error(`获取歌曲 ${songId} 详情失败`, error);
  }
};

// 获取分享列表
const fetchShares = async () => {
  try {
    const res = await getMyShares();
    if (res.code === ResultCode.SUCCESS && res.oData) {
      receivedShares.value = res.oData;
      // 获取每首歌的详情
      receivedShares.value.forEach(share => {
        fetchSongDetail(share.songId);
      });
    }
  } catch (error) {
    console.error('获取分享列表失败', error);
    ElMessage.error('获取分享列表失败');
  }
};

// 处理分享
const handleShare = async (share: Share.MusicShareMessage, store: boolean) => {
  try {
    const res = await handleShareDecision(share.shareId, store);
    
    if (res.code === ResultCode.SUCCESS) {
      ElMessage.success(store ? '已保存到我的仓库' : '已丢弃');
      // 找到并更新分享状态
      const shareIndex = receivedShares.value.findIndex(s => s.shareId === share.shareId);
      if (shareIndex !== -1) {
        receivedShares.value[shareIndex].curStatus = store ? 'STORED' : 'DROPPED';
      }
      // 更新待处理数量
      updatePendingCount();
      
      // 如果是处理的通知中的分享，关闭通知
      if (latestShare.value && latestShare.value.shareId === share.shareId) {
        closeNotification();
      }
    } else {
      ElMessage.error(res.message || '操作失败');
    }
  } catch (error) {
    console.error('处理分享失败', error);
    ElMessage.error('处理分享失败');
  }
};

// 获取歌曲封面
const getSongCover = (song: Song.SongContent) => {
  return song.coverBase64 
    ? `data:image/png;base64,${song.coverBase64}` 
    : require('@/assets/icons/default_album.png');
};

// 关闭通知
const closeNotification = () => {
  showNotification.value = false;
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value);
    notificationTimer.value = null;
  }
};

// 接收分享消息
const receive_ShareMusic = (msg: IMessage) => {
  console.log("收到分享消息", msg.body);
  
  const shareMessage = JSON.parse(msg.body) as Share.MusicShareMessage;
  // 设置初始状态为 PENDING
  shareMessage.curStatus = 'PENDING';
  
  // 检查是否已存在相同的分享
  const existingShare = receivedShares.value.find(s => s.shareId === shareMessage.shareId);
  if (!existingShare) {
    receivedShares.value = [shareMessage, ...receivedShares.value];
    fetchSongDetail(shareMessage.songId);
    // 更新待处理数量
    updatePendingCount();
  }
  
  // 显示通知
  latestShare.value = shareMessage;
  showNotification.value = true;
  
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value);
  }
  notificationTimer.value = window.setTimeout(() => {
    showNotification.value = false;
    notificationTimer.value = null;
  }, 5000);
};

// 连接WebSocket
const connectWebSocket = () => {
  wsService = new WebSocketService(websocketRoot, userId, 0, false, true);
  wsService.subscribe(`/user/${userId}/queue/share/music`, receive_ShareMusic);
  wsService.connect();
};

// 断开WebSocket连接
const disconnectWebSocket = () => {
  if (wsService !== null) {
    wsService.disconnect();
    wsService = null;
  }
};

onMounted(() => {
  fetchShares();
  connectWebSocket();
});

onUnmounted(() => {
  disconnectWebSocket();
  if (notificationTimer.value) {
    clearTimeout(notificationTimer.value);
  }
});
</script>

<style scoped>
.fullscreen-share-box {
  position: fixed;
  top: -100vh;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(18, 18, 18, 0.98);
  box-sizing: border-box;
  
  border-radius: 1vh;
  overflow: hidden;
  z-index: 665;
  display: flex;
  flex-direction: column;
  height: calc(94.9vh - 50px);
  margin-top: 4.9vh;
}

.drop-in {
  animation: dropIn 0.5s cubic-bezier(0.21, 0.94, 0.22, 0.95) forwards,
             bounce 0.4s cubic-bezier(0.14, 1.11, 0.49, 1.36) 0.1s;
}

.pull-up {
  animation: pullUp 0.3s cubic-bezier(0.03, -0.23, 0.53, -0.34) forwards;
}

@keyframes dropIn {
  0% { top: -100vh; transform: translateY(0); }
  100% { top: 0; transform: translateY(0); }
}

@keyframes bounce {
  0% { transform: translateY(0); }
  25% { transform: translateY(10vh); }
  50% { transform: translateY(0); }
  75% { transform: translateY(3vh); }
  100% { transform: translateY(0); }
}

@keyframes pullUp {
  0% { top: 0; }
  100% { top: -100vh; }
}

.portal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: linear-gradient(266deg, #6b2d9d, #d45988);
    border-bottom: 1px solid #ba3939;
    box-shadow: 0px -1vh 0.6vh 0px rgba(24, 9, 20, 0.71) inset;
    border: .2vh solid #9e637e;
  }

.portal-header h2 {
  margin: 0;
    color: #ffc3e0;
    font-size: 2vh;
    text-shadow: 0 0 5px rgb(209 103 255 / 80%);
    margin-bottom: -.8vh;
    position: relative;
    top: -0.8vh;
    box-sizing: border-box;
    padding: .2vh 1vh;
}

.notification-badge {
  position: fixed;
  right: calc(2vw + 5px);
  bottom: calc(60px + 10px);
  min-width: 16px;
  height: 17px;
  border-radius: 19px;
  background-color: #ff4759;
  color: white;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  box-sizing: border-box;
  font-weight: bold;
  border: 1px solid #ff7272;
  z-index: 10000;
  box-shadow: 0 0 10px rgba(255, 71, 89, 0.3);
}

.tabs-header {
  display: flex;
  padding: 0 20px;
  /* border-bottom: 1px solid var(--go-dark-border); */
  background: linear-gradient(90deg, #1a1a1a, #2a2a2a);
  justify-content: center;
}

.tab-item {
  position: relative;
  padding: 8px 15px;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  user-select: none;
}

.tab-item:hover {
  color: #ff7272;
}

.tab-item.active {
  color: #ff7272;
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #ff7272;
  transform: scaleX(0);
  transition: transform 0.3s ease;
  transform-origin: center;
}

.tab-item.active .tab-indicator {
  transform: scaleX(1);
}

.tabs-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-pane {
  height: 100%;
  transition: opacity 0.3s ease;
}

.tabs-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1a1a1a;
}

.fullscreen-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.share-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  background: #1a1a1a;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 71, 89, 0.2);
  z-index: 9999;
  transform: translateY(-150%);
  transition: transform 0.3s ease-out;
  border: 1px solid var(--go-dark-border);
}

.share-notification.show {
  transform: translateY(0);
}

.notification-content {
  padding: 15px;
}

.notification-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.sender-avatar {
  margin-right: 10px;
  border: 1px solid var(--go-dark-border);
}

.notification-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  color: #fff;
}

.sender-name {
  font-weight: bold;
  font-size: 14px;
  color: var(--go-dark-border);
}

.notification-body {
  margin: 15px 0;
}

.notification-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.song-info {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #333;
}

.song-cover {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  margin-right: 10px;
  object-fit: cover;
  border: 1px solid var(--go-dark-border);
}

.song-text {
  flex: 1;
  color: #fff;
}

.song-name {
  font-weight: bold;
  font-size: 14px;
  color: #ff7272;
}

.song-artist {
  font-size: 12px;
  color: #999;
}

.share-message {
  font-size: 14px;
  color: #ccc;
  margin-top: 10px;
  word-break: break-word;
}

.loading-song {
  padding: 10px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .share-notification {
    width: 90%;
    left: 5%;
    right: 5%;
  }
}

/* 美化滚动条 */
.fullscreen-content::-webkit-scrollbar {
  width: 8px;
}

.fullscreen-content::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 4px;
}

.fullscreen-content::-webkit-scrollbar-thumb {
  background: var(--go-dark-border);
  border-radius: 4px;
}

.fullscreen-content::-webkit-scrollbar-thumb:hover {
  background: #ff7272;
}
</style>