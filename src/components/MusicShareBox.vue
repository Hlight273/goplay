<template>
    <div class="share-box-container">
      <div class="share-header">
        <h2>我的音乐分享</h2>
        <el-tabs v-model="activeTab" class="share-tabs">
          <el-tab-pane label="收到的分享" name="received">
            <div class="share-list">
              <el-empty v-if="receivedShares.length === 0" description="暂无收到的分享"></el-empty>
              <div v-else class="share-items">
                <el-card v-for="share in receivedShares" :key="share.shareTime" class="share-item">
                  <div class="share-item-header">
                    <el-avatar :src="share.senderAvatar" @click="openUserProfile(share.senderId)" class="clickable-avatar"></el-avatar>
                    <div class="share-info">
                      <span class="sender-name">{{ share.senderName || '用户' + share.senderId }}</span>
                      <span class="share-time">{{ formatDate(share.shareTime) }}</span>
                    </div>
                  </div>
                  <div class="share-content">
                    <div class="song-info">
                      <div v-if="songDetails[share.songId]" class="song-detail">
                        <img :src="getSongCover(songDetails[share.songId])" alt="封面" class="song-cover">
                        <div class="song-text">
                          <div class="song-name">{{ songDetails[share.songId].songInfo.songName }}</div>
                          <div class="song-artist">{{ songDetails[share.songId].songInfo.songArtist }}</div>
                        </div>
                        <el-button type="primary" size="small" circle @click="playSong(songDetails[share.songId])">
                          <el-icon><VideoPlay /></el-icon>
                        </el-button>
                      </div>
                      <div v-else class="loading-song">
                        <el-skeleton :rows="2" animated />
                      </div>
                    </div>
                    <div v-if="share.contentText" class="share-message">
                      {{ share.contentText }}
                    </div>
                  </div>
                  <div class="share-actions" v-if="share.curStatus === 'PENDING'">
                    <el-button type="primary" @click="handleShare(share, true)">保存到我的歌单</el-button>
                    <el-button @click="handleShare(share, false)">丢弃</el-button>
                  </div>
                  <div class="share-status" v-else>
                    <el-tag type="success" v-if="share.curStatus === 'STORED'">已保存</el-tag>
                    <el-tag type="info" v-else-if="share.curStatus === 'DROPPED'">已丢弃</el-tag>
                  </div>
                </el-card>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, reactive } from 'vue';
  import { ElMessage } from 'element-plus';
  import { VideoPlay } from '@element-plus/icons-vue';
  import { useCommonStore } from '@/store/commonStore';
  import { Song } from '@/interface/song';
  import { Share } from '@/interface/share';
  import { GoPlayer } from '@/util/XgPlayer';
  import { formatDate } from '@/util/commonUtil';
  import { WebSocketService } from '@/util/webSocketService';
  import { IMessage } from '@stomp/stompjs';
  import { ResultCode, websocketRoot } from '@/util/webConst';
  import { getMyShares, handleShareDecision } from '@/api/share';
  import { getSongContent } from '@/api/song';
  
  const commonStore = useCommonStore();
  const activeTab = ref('received');
  const receivedShares = ref<Share.MusicShareMessage[]>([]);
  const songDetails = reactive<Record<number, Song.SongContent>>({});
  const userId = Number(localStorage.getItem("userid"));
  let wsService: WebSocketService | null = null;
  
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
  
  // 获取歌曲详情
  const fetchSongDetail = async (songId: number) => {
    try {
      const res = await getSongContent(songId);
      if (res.code === ResultCode.SUCCESS && res.oData) {
        songDetails[songId] = res.oData;
      }
    } catch (error) {
      console.error(`获取歌曲 ${songId} 详情失败`, error);
    }
  };
  
  // 处理分享
  const handleShare = async (share: Share.MusicShareMessage, store: boolean) => {
    try {
      const res = await handleShareDecision(share.shareId, store);
      
      if (res.code === ResultCode.SUCCESS) {
        ElMessage.success(store ? '已保存到我的仓库' : '已丢弃');
        share.curStatus = store ? 'STORED' : 'DROPPED';
      } else {
        ElMessage.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error('处理分享失败', error);
      ElMessage.error('处理分享失败');
    }
  };
  
  // 播放歌曲
  const playSong = (songContent: Song.SongContent) => {
    if (GoPlayer.isRoomMode()) {
      ElMessage.info("请先切换到单人模式！");
      return;
    }
    GoPlayer.getInstance().loadPlaylist4local([songContent]);
    GoPlayer.getInstance().setPlayer4localIndex(0);
  };
  
  // 获取歌曲封面
  const getSongCover = (song: Song.SongContent) => {
    return song.coverBase64 
      ? `data:image/png;base64,${song.coverBase64}` 
      : require('@/assets/icons/default_album.png');
  };
  
  // 打开用户资料
  const openUserProfile = (userId: number) => {
    commonStore.openUserPage(userId);
  };
  
  // 接收分享消息
  const receive_ShareMusic = (msg: IMessage) => {
    console.log("收到分享消息", msg.body);
    
    const shareMessage = JSON.parse(msg.body) as Share.MusicShareMessage;
    ElMessage.info(`用户 ${shareMessage.senderName || shareMessage.senderId} 向你分享了一首歌`);
    receivedShares.value.unshift(shareMessage);
    fetchSongDetail(shareMessage.songId);
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
  });
  </script>
  
  <style scoped>
  .share-box-container {
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
  }
  
  .share-header {
    margin-bottom: 20px;
  }
  
  .share-header h2 {
    margin-bottom: 20px;
    color: #333;
  }
  
  .share-list {
    margin-top: 20px;
  }
  
  .share-items {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .share-item {
    border-radius: 8px;
    transition: all 0.3s;
  }
  
  .share-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
  
  .share-item-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .clickable-avatar {
    cursor: pointer;
    margin-right: 10px;
  }
  
  .share-info {
    display: flex;
    flex-direction: column;
  }
  
  .sender-name {
    font-weight: bold;
    font-size: 14px;
  }
  
  .share-time {
    font-size: 12px;
    color: #999;
  }
  
  .share-content {
    margin: 15px 0;
  }
  
  .song-info {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
  }
  
  .song-detail {
    display: flex;
    align-items: center;
  }
  
  .song-cover {
    width: 50px;
    height: 50px;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  .song-text {
    flex: 1;
  }
  
  .song-name {
    font-weight: bold;
    font-size: 14px;
  }
  
  .song-artist {
    font-size: 12px;
    color: #666;
  }
  
  .share-message {
    font-size: 14px;
    color: #333;
    margin-top: 10px;
  }
  
  .share-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
  }
  
  .share-status {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
  
  .loading-song {
    padding: 10px;
  }
  </style>