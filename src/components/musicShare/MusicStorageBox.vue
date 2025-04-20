<template>
  <div class="storage-box-container">
    <div class="storage-header">
      <div class="header-actions">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索歌曲或分享者"
            class="search-input"
          />
          <el-icon class="search-icon"><Search /></el-icon>
          <el-icon v-if="searchQuery" class="clear-icon" @click="searchQuery = ''">
            <Close />
          </el-icon>
        </div>
      </div>
    </div>

    <div class="storage-content">
      <!-- 3D卡片展示区 -->
      <div class="card-showcase" v-if="currentShare && songDetails[currentShare.songId]">
        <MusicCard3D
          :share="currentShare"
          :song-details="songDetails[currentShare.songId]"
          :active="true"
          @play="playSong(songDetails[currentShare.songId])"
          @add-to-playlist="addToPlaylist(songDetails[currentShare.songId])"
        />
      </div>

      <!-- 底部歌曲列表 -->
      <div class="music-list-container">
        <el-empty v-if="filteredStoredShares.length === 0" description="暂无已保存的分享"></el-empty>
        <div v-else class="music-list" ref="musicList">
          <div v-for="share in paginatedShares" 
              :key="share.shareTime"
              class="music-item"
              :class="{ active: currentShare?.shareTime === share.shareTime }"
              @click="selectShare(share)">
            <img :src="getSongCover(songDetails[share.songId])" alt="封面" class="item-cover">
            <div class="item-info">
              <span class="item-name">{{ songDetails[share.songId]?.songInfo?.songName || '未知歌曲' }}</span>
              <span class="item-artist">{{ songDetails[share.songId]?.songInfo?.songArtist || '未知艺术家' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div class="pagination-container" v-if="filteredStoredShares.length > pageSize">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="filteredStoredShares.length"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { VideoPlay, Plus, Search, Close } from '@element-plus/icons-vue';
import { useCommonStore } from '@/store/commonStore';
import { Song } from '@/interface/song';
import { Share } from '@/interface/share';
import { GoPlayer } from '@/util/XgPlayer';
import { formatDate } from '@/util/commonUtil';
import MusicCard3D from './MusicCard3D.vue';

const props = defineProps<{
  shares: Share.MusicShareMessage[],
  songDetails: Record<number, Song.SongContent>
}>();

const commonStore = useCommonStore();
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// 过滤出已保存的分享
const storedShares = computed(() => {
  return props.shares.filter(share => share.curStatus === 'STORED');
});

// 过滤搜索结果
const filteredStoredShares = computed(() => {
  if (!searchQuery.value) return storedShares.value;
  
  const query = searchQuery.value.toLowerCase();
  return storedShares.value.filter(share => {
    const songDetail = props.songDetails[share.songId];
    if (!songDetail) return false;
    
    return (
      songDetail.songInfo.songName.toLowerCase().includes(query) ||
      songDetail.songInfo.songArtist.toLowerCase().includes(query) ||
      share.senderName.toLowerCase().includes(query) ||
      (share.contentText && share.contentText.toLowerCase().includes(query))
    );
  });
});

// 分页后的数据
const paginatedShares = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  return filteredStoredShares.value.slice(startIndex, startIndex + pageSize.value);
});

// 处理页码变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
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

// 添加到播放列表
const addToPlaylist = (songContent: Song.SongContent) => {
  if (GoPlayer.isRoomMode()) {
    ElMessage.info("请先切换到单人模式！");
    return;
  }
  GoPlayer.getInstance().loadPlaylist4local([songContent]);
  GoPlayer.getInstance().setPlayer4localIndex(0);
  ElMessage.success('已添加到播放列表');
};

// 获取歌曲封面
const getSongCover = (song: Song.SongContent | undefined) => {
  if (!song) return require('@/assets/icons/default_album.png');
  return song.coverBase64 
    ? `data:image/png;base64,${song.coverBase64}` 
    : require('@/assets/icons/default_album.png');
};

// 打开用户资料
const openUserProfile = (userId: number) => {
  commonStore.openUserPage(userId);
};
// 添加当前选中的分享
const currentShare = ref<Share.MusicShareMessage | null>(null);

// 选择分享
const selectShare = (share: Share.MusicShareMessage) => {
  currentShare.value = share;
};

// 初始化时选择第一个分享
watch(paginatedShares, (shares) => {
  if (shares.length > 0 && !currentShare.value) {
    currentShare.value = shares[0];
  }
}, { immediate: true });
// 当搜索条件变化时，重置页码
watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>
  
<style scoped>
.storage-box-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  background-color: #1a1a1a;
}

.storage-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.storage-header h2 {
  margin: 0;
  color: var(--go-dark-border);
  font-size: 1.5rem;
  text-shadow: 0 0 5px rgba(255, 71, 89, 0.5);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-box {
  position: relative;
  width: 250px;
}

.search-input {
  width: 100%;
  height: 25px;
  padding: 0 35px;
  border: 1px solid #333;
  border-radius: 18px;
  background-color: #2a2a2a;
  color: #fff;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--go-dark-border);
  box-shadow: 0 0 5px rgba(255, 71, 89, 0.3);
}

.search-input::placeholder {
  color: #666;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
}

.clear-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  cursor: pointer;
  transition: color 0.3s ease;
}

.clear-icon:hover {
  color: var(--go-dark-border);
}

@media (max-width: 768px) {
  .search-box {
    width: calc(100vw - 115px);
  }
}

.storage-list {
  margin-top: 20px;
}

.storage-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.storage-item {
  border-radius: 8px;
  transition: all 0.3s;
  background-color: #2a2a2a;
  border: 1px solid #333;
}

.storage-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 71, 89, 0.2);
  border-color: var(--go-dark-border);
}

.storage-item-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.clickable-avatar {
  cursor: pointer;
  margin-right: 10px;
  border: 1px solid var(--go-dark-border);
}

.share-info {
  display: flex;
  flex-direction: column;
}

.sender-name {
  font-weight: bold;
  font-size: 14px;
  color: var(--go-dark-border);
}

.share-time {
  font-size: 12px;
  color: #666;
}

.storage-content {
  margin: 15px 0;
}

.song-info {
  background-color: #222;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #333;
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
  object-fit: cover;
  border: 1px solid var(--go-dark-border);
}

.song-text {
  flex: 1;
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

.song-actions {
  display: flex;
  gap: 5px;
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.pagination-container :deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: var(--go-dark-border);
}

.pagination-container :deep(.el-pagination.is-background .el-pager li) {
  background-color: #2a2a2a;
  color: #fff;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .storage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .search-input {
    width: 100%;
  }
  
  .song-detail {
    flex-wrap: wrap;
  }
  
  .song-actions {
    margin-top: 10px;
    width: 100%;
    justify-content: flex-end;
  }
}

/* 添加动画效果 */
.storage-item {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 美化滚动条 */
.storage-box-container::-webkit-scrollbar {
  width: 8px;
}

.storage-box-container::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 4px;
}

.storage-box-container::-webkit-scrollbar-thumb {
  background: var(--go-dark-border);
  border-radius: 4px;
}

.storage-box-container::-webkit-scrollbar-thumb:hover {
  background: #ff7272;
}
.storage-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100% - 80px);
}

.card-showcase {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 450px;
}

.music-list-container {
  height: 120px;
  background: #2a2a2a;
  border-radius: 10px;
  padding: 10px;
}

.music-list {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding: 5px;
  height: 100%;
}

.music-item {
  flex: 0 0 200px;
  background: #222;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #333;
}

.music-item:hover {
  transform: translateY(-2px);
  border-color: var(--go-dark-border);
}

.music-item.active {
  border-color: var(--go-dark-border);
  background: #2f2f2f;
  box-shadow: 0 0 10px rgba(255, 71, 89, 0.2);
}

.item-cover {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  overflow: hidden;
}

.item-name {
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 美化水平滚动条 */
.music-list::-webkit-scrollbar {
  height: 6px;
}

.music-list::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 3px;
}

.music-list::-webkit-scrollbar-thumb {
  background: var(--go-dark-border);
  border-radius: 3px;
}

.music-list::-webkit-scrollbar-thumb:hover {
  background: #ff7272;
}
</style>