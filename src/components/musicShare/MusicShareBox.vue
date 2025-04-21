<template>
  <div class="music-share-container" :class="$attrs.class">
      <div class="share-box-container">
        <div class="share-list">
          <el-empty v-if="pendingShares.length === 0" description="暂无待处理的分享"></el-empty>
          <div v-else class="share-items">
            <div v-for="share in pendingShares" :key="share.shareTime" class="share-item">
              <div class="share-item-header">
                <el-avatar :src="share.senderAvatar" @click="openUserProfile(share.senderId)" class="clickable-avatar"></el-avatar>
                <div class="share-info">
                  <span class="sender-name">{{ share.senderName || '用户' + share.senderId }}</span>
                  <span class="share-time">{{ formatDate(share.shareTime) }}</span>
                </div>
              </div>
              <div class="share-content">
                <div class="song-info" @click="playSong(songDetails[share.songId])">
                  <div v-if="songDetails[share.songId]" class="song-detail">
                    <img :src="getSongCover(songDetails[share.songId])" alt="封面" class="song-cover">
                    <div class="song-text">
                      <div class="song-name">{{ songDetails[share.songId].songInfo.songName }}</div>
                      <div class="song-artist">{{ songDetails[share.songId].songInfo.songArtist }}</div>
                    </div>
                    <div class="song-actions">
                      <el-button link type="primary" class="play-btn">
                        <el-icon><VideoPlay /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  <div v-else class="loading-song">
                    <el-skeleton :rows="2" animated />
                  </div>
                </div>
                <div v-if="share.contentText" class="share-message">
                  {{ share.contentText }}
                </div>
              </div>
              <div class="share-actions">
                <el-button class="black_oil_btn" type="primary" @click="$emit('handle-share', share, true)">保存到我的仓库</el-button>
                <el-button class="red_oil_btn" @click="$emit('handle-share', share, false)">丢弃</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, watch } from 'vue';
  import { ElMessage } from 'element-plus';
  import { VideoPlay } from '@element-plus/icons-vue';
  import { useCommonStore } from '@/store/commonStore';
  import { Share } from '@/interface/share';
  import { Song } from '@/interface/song';
  import { GoPlayer } from '@/util/XgPlayer';
  import { formatDate } from '@/util/commonUtil';
  
  defineOptions({
    inheritAttrs: false
  });
  
  const props = defineProps<{
    shares: Share.MusicShareMessage[],
    songDetails: Record<number, Song.SongContent>
  }>();
  
  const emit = defineEmits(['handle-share', 'update:pending-count']);
  
  const commonStore = useCommonStore();
  
  // 过滤出待处理的分享
  const pendingShares = computed(() => {
    const pending = props.shares.filter(share => share.curStatus === 'PENDING');
    return pending;
  });
  
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
  
  watch(() => props.shares, () => {
    const pendingCount = props.shares.filter(share => share.curStatus === 'PENDING').length;
    emit('update:pending-count', pendingCount);
  }, { immediate: true, deep: true });
  </script>

<style scoped>
.music-share-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #1a1a1a;
}

.share-box-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.share-list {
  flex: 1;
    overflow-y: auto;
    padding: 0 15px;
    display: flex
;
    justify-content: center;
    margin-bottom: 15vh;
}

.share-items {
  display: flex;
  flex-direction: column;
    gap: 8px;
    width: 80%;
    max-width: 600px;
}

.share-item {
  border-radius: 6px;
  transition: all 0.3s;
  background-color: #2a2a2a;
  border: 1px solid #333;
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  margin: 10px;
}

 /* .share-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--go-dark-border), transparent);
  opacity: 0;
  transition: opacity 0.3s;
} 

.share-item:hover {
   transform: translateY(-1px); 
  box-shadow: 0 0 1px 2px rgba(255, 99, 115, 0.685);
   border-color: #292929;
   background-color: #2f2f2f;  
}

.share-item:hover::before {
  opacity: 1;
} */

.share-item-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid #333;
}

.clickable-avatar {
  cursor: pointer;
  margin-right: 8px;
  border: 1px solid var(--go-dark-border);
  transition: transform 0.3s;
  width: 32px !important;
  height: 32px !important;
}

.clickable-avatar:hover {
  transform: scale(1.1);
}

.share-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sender-name {
  font-weight: bold;
  font-size: 13px;
  color: var(--go-dark-border);
}

.share-time {
  font-size: 11px;
  color: #666;
}

.share-content {
  margin: 6px 0;
  padding: 0 2px;
}

.song-info {
  cursor: pointer;
  background-color: #222;
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 6px;
  border: 1px solid #333;
  transition: border-color 0.3s;
}

.song-info:hover {
  border-color: var(--go-dark-border);
}

.song-detail {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 8px;
  object-fit: cover;
  border: 1px solid var(--go-dark-border);
  transition: transform 0.3s;
}

/* .song-cover:hover {
  transform: scale(1.05);
} */

.song-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.song-name {
  font-weight: bold;
  font-size: 13px;
  color: var(--go-dark-border);
  line-height: 1.2;
}

.song-artist {
  font-size: 11px;
  color: #999;
  line-height: 1.2;
}

.song-actions {
  display: flex;
  gap: 4px;
}

.song-actions :deep(.el-button) {
  padding: 6px;
}

.song-actions :deep(.el-button .el-icon) {
  font-size: 16px;
}

.share-message {
  font-size: 12px;
  color: #ccc;
  margin-top: 6px;
  word-break: break-word;
  padding: 6px;
  background-color: #222;
  border-radius: 4px;
  border-left: 2px solid var(--go-dark-border);
  line-height: 1.3;
}

.loading-song {
  padding: 6px;
}

.share-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #333;
}

.share-actions :deep(.el-button) {
  padding: 6px 12px;
  font-size: 12px;
}


/* 美化滚动条 */
.share-list::-webkit-scrollbar {
  width: 6px;
}

.share-list::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 3px;
}

.share-list::-webkit-scrollbar-thumb {
  background: var(--go-dark-border);
  border-radius: 3px;
}

.share-list::-webkit-scrollbar-thumb:hover {
  background: #ff7272;
}

/* 添加动画效果 */
.share-item {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.play-btn {
  color: var(--go-dark-border);

}
</style>