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
    <transition name="fade">
      <div class="share-notification" v-if="showNotification && latestShare">
        <div class="notification-header">
          <span>新的音乐分享</span>
          <el-icon class="close-icon" @click.stop="closeNotification"><Close /></el-icon>
        </div>

        <div class="notification-content">
          <div class="notification-sender">
            <el-avatar :src="latestShare.senderAvatar" class="sender-avatar"></el-avatar>
            <div class="sender-info">
              <span class="sender-name">{{ latestShare.senderName || '用户' + latestShare.senderId }}</span>
              <span class="share-time">刚刚</span>
            </div>
          </div>
          
          <div class="song-container">
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
          </div>
          
          <div class="share-message" v-if="latestShare.contentText">
            {{ latestShare.contentText }}
          </div>
          
          <div class="notification-actions">
            <el-button class="black_oil_btn" @click="handleShare(latestShare, true)">
              <el-icon><Check /></el-icon> 保存
            </el-button>
            <el-button class="black_oil_btn" @click="handleShare(latestShare, false)">
              <el-icon><Close /></el-icon> 丢弃
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <div class="fullscreen-share-box" :class="{ 
      'drop-in': isOpen, 
      'pull-up': !isOpen && wasOpen 
    }" v-show="isOpen || wasOpen">
      <div class="portal-header">
        <h2>MEMORY - STORAGE</h2>
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
              @handle-share="handleShare"
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
import { Close, Check } from '@element-plus/icons-vue';
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
    if (!share || typeof share.shareId === 'undefined') {
      console.error('无效的分享信息', share);
      ElMessage.error('处理分享失败：无效的分享信息');
      return;
    }

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
  justify-content: center;
  align-items: center;
  padding: 4px 2px;
  background: linear-gradient(260deg, #461a26, #14153c);
  border-bottom: 1px solid #ba3939;
  box-shadow: 0px -1vh 0.6vh 0px rgba(24, 9, 20, 0.71) inset;
  border: 0.1vh solid #7c3a58;
  border-radius: 2vh 2vh 0 0;
  background-size: 400% 400%;
  animation: moveGradient 3s ease infinite;
}

@keyframes moveGradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.portal-header h2 {
  margin: 0;
  color: #b583ae;
  font-size: 1.5vh;
  text-shadow: 0 0 5px rgb(209 103 255 / 80%);
  margin-bottom: -.8vh;
  position: relative;
  top: -0.5vh;
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
  box-shadow: 0px -1.5vh 0.4vh 0px rgb(24 9 20 / 71%) inset;
  padding-bottom: .5vh;
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
  background: linear-gradient(90deg, #1a1a1a, #2a2a2a);
  justify-content: center;
  box-shadow: 0px -0.8vh 0.8vh 0px rgb(12 8 11 / 71%) inset;
  padding: 8px 32px;
  border-radius: 80px 80px 10px 10px;
  border: 2px solid #302e30;
  line-height: 10px;
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
}

.tab-item.active .tab-indicator {
  transform: scaleX(1);
  background-color: #ff7272;
  transition: transform 0.3s ease;
  transform-origin: center;
  border: 1px solid #6b1b3c;
  border-radius: 0 0 10px 10px;
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
  border: 4px solid #313131;
  box-sizing: border-box;
  margin-left: -1px;
  border-radius: 10px;
}

.fullscreen-content {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  overflow: hidden;
}

/* 新的通知样式 */
.share-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  background-color: rgba(30, 30, 30, 0.85);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  overflow: hidden;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: rgba(50, 50, 50, 0.5);
  color: white;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.close-icon {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s;
}

.close-icon:hover {
  color: #fff;
}

.notification-content {
  padding: 15px;
  color: #fff;
}

.notification-sender {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.sender-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sender-info {
  display: flex;
  flex-direction: column;
}

.sender-name {
  font-weight: bold;
  font-size: 14px;
  color: #a5a5ff;
}

.share-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.song-container {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin: 10px 0;
  border: 0.2vh solid #555760;
}

.song-info {
  display: flex;
  align-items: center;
  padding: 10px;
}

.song-cover {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  margin-right: 10px;
  object-fit: cover;
}

.song-text {
  flex: 1;
}

.song-name {
  font-weight: bold;
  font-size: 14px;
  color: #fff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.share-message {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 10px;
  margin: 10px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.notification-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.notification-actions .el-button {
  padding: 6px 15px;
  display: flex;
  align-items: center;
}

.notification-actions .el-icon {
  margin-right: 5px;
}

.loading-song {
  padding: 15px;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .share-notification {
    width: calc(100% - 40px);
    right: 20px;
  }
}

@media screen and (max-width: 480px) {
  .share-notification {
    width: calc(100% - 20px);
    right: 10px;
  }
  
  .notification-header {
    padding: 8px 12px;
  }
  
  .notification-content {
    padding: 10px;
  }
  
  .song-name {
    font-size: 13px;
  }
  
  .song-artist {
    font-size: 11px;
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