<template>
  <div class="storage-box-container">
    <div class="storage-header">
      <div class="toggle-list-btn" @click="toggleList">
        <div class="toggle-icon" :class="{ 'active': showList }">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
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
      <!-- 左侧歌曲列表 -->
      <div class="side-list-container" :class="{ 'show': showList }">
        <div class="side-list-header">
          <h3>我的收藏</h3>
        </div>
        <div v-if="filteredStoredShares.length === 0" class="empty-container">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="#666" d="M19,20H5V9H19M16,2V4H8V2H6V4H5A2,2 0 0,0 3,6V20A2,2 0 0,0 5,22H19A2,2 0 0,0 21,20V6A2,2 0 0,0 19,4H18V2M10.88,13H7.27L10.19,15.11L9.08,18.56L12,16.43L14.92,18.56L13.8,15.12L16.72,13H13.12L12,9.56L10.88,13Z" />
            </svg>
          </div>
          <div class="empty-text">暂无已保存的分享</div>
        </div>
        <div v-else class="side-music-list" ref="musicList">
          <div v-for="share in paginatedShares" 
              :key="share.shareTime"
              class="side-music-item"
              :class="{ active: currentShare?.shareTime === share.shareTime }"
              @click="selectShare(share)">
            <img :src="getSongCover(songDetails[share.songId])" alt="封面" class="side-item-cover">
            <div class="side-item-info">
              <span class="side-item-name">{{ songDetails[share.songId]?.songInfo?.songName || '未知歌曲' }}</span>
              <span class="side-item-artist">{{ songDetails[share.songId]?.songInfo?.songArtist || '未知艺术家' }}</span>
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

      <!-- 3D卡片展示区 -->
      <div class="card-showcase" :class="{ 'shifted': showList }">
        <div v-if="currentShare && songDetails[currentShare.songId]" class="card-container">
          <Suspense>
            <template #default>
              <MusicCard3D
              ref="cardRef"
                :share="currentShare"
                :song-details="songDetails[currentShare.songId]"
                :active="true"
                @play="playSong(songDetails[currentShare.songId])"
                @add-to-playlist="addToPlaylist(songDetails[currentShare.songId])"
                @handle-share="(share: any, store: any) => $emit('handle-share', share, store)"
              />
            </template>
            <template #fallback>
              <div class="loading-container">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
            </template>
          </Suspense>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent,nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {  Search, Close } from '@element-plus/icons-vue';
import { useCommonStore } from '@/store/commonStore';
import { Song } from '@/interface/song';
import { Share } from '@/interface/share';
import { GoPlayer } from '@/util/XgPlayer';

//MusicCard3D 的引用
const cardRef = ref<InstanceType<typeof MusicCard3D> | null>(null);

const MusicCard3D = defineAsyncComponent(() => 
  import('./MusicCard3D.vue')
);

const props = defineProps<{
  shares: Share.MusicShareMessage[],
  songDetails: Record<number, Song.SongContent>
}>();
defineEmits(['handle-share']);

const commonStore = useCommonStore();
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const showList = ref(false); // 控制左侧列表的显示状态

// 切换列表显示
const toggleList = () => {
  showList.value = !showList.value;
};

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
const selectShare = async (share: Share.MusicShareMessage) => {
  // 如果选择的是同一个分享，不执行动画
  if (currentShare.value?.shareTime === share.shareTime) return;
  
  currentShare.value = share;
  // 在移动设备上，选择后自动隐藏列表
  if (window.innerWidth <= 768) {
    showList.value = false;
  }
  
  // 等待下一个 tick，确保 MusicCard3D 组件已更新
  await nextTick();
  // 触发卡片旋转动画
  if (cardRef.value) {
    await cardRef.value.spinCard();
  }
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
  background-color: #131313;
  background-image: url('@/assets/imgs/card_lobby.png');
  background-size: inherit;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
}
/* 添加一个遮罩层，使背景不会太抢眼 */
.storage-box-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(26, 26, 26, 0.5);
  pointer-events: none;
  z-index: 0;
}

/* 确保内容在遮罩层之上 */
.storage-header, .storage-content {
  position: relative;
  z-index: 1;
}

.storage-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-list-btn {
  width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(145deg, #2a2a2a, #222222);
    display: flex
;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-right: 15px;
    border: 2px solid rgb(108 77 77 / 30%);
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5), -2px -2px 5px rgba(60, 60, 60, 0.1), inset 0 0 5px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
}

.toggle-list-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transform: skewX(-20deg);
  transition: all 0.6s ease;
}

.toggle-list-btn:hover {
  transform: translateY(-2px);
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.6),
              -2px -2px 8px rgba(60, 60, 60, 0.2),
              inset 0 0 5px rgba(0, 0, 0, 0.5);
  border-color: rgba(156, 79, 79, 0.6);
}

.toggle-list-btn:hover::before {
  left: 100%;
  transition: all 0.6s ease;
}

.toggle-list-btn:active {
  transform: translateY(1px);
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6),
              -1px -1px 3px rgba(60, 60, 60, 0.2),
              inset 0 0 8px rgba(0, 0, 0, 0.7);
}

.toggle-icon {
  width: 16px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.toggle-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #866e6e, #695757);
  border-radius: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.toggle-icon.active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.toggle-icon.active span:nth-child(2) {
  opacity: 0;
}

.toggle-icon.active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
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
  /* width: 50vw; */
}

.search-box {
  position: relative;
  width: 250px;
}

.search-input {
  /* width: 100%; */
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

.storage-content {
  display: flex;
  position: relative;
  height: calc(100% - 64px);
}

/* 左侧列表样式 */
.side-list-container {
  position: absolute;
  left: -330px;
  width: 307px;
  height: 100%;
  background: rgba(32, 32, 32, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 15px;
  box-sizing: border-box;
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  z-index: 10;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 5px rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 114, 114, 0.3);

  /* background-image: url('@/assets/imgs/card_bag_lobby.png');
  background-size: inherit;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed; */
  /* position: relative; */
}

.side-list-container.show {
  transform: translateX(332px);
}

.side-list-header {
  display: none;
}

.side-list-header::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 25%;
  width: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ff7272, transparent);
}

.side-list-header h3 {
  color: #ff7272;
  margin: 0;
  font-size: 20px;
  font-family: "STKaiti", "楷体", serif;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  position: relative;
  display: inline-block;
}

.side-list-header h3::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(255, 114, 114, 0.5);
}

.side-music-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 15px;
}

.side-music-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
  margin-bottom: 15px;
}

.side-music-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: rgba(34, 34, 34, 0.7);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid rgba(51, 51, 51, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  position: relative;
  max-width: 120px;
}

.side-music-item:hover {
  transform: translateY(-5px);
  border-color: var(--go-dark-border);
  box-shadow: 0 8px 16px rgba(255, 71, 89, 0.3);
}

.side-music-item.active {
  border-color: #ff7272;
  background: rgba(47, 47, 47, 0.8);
  box-shadow: 0 0 15px rgba(255, 71, 89, 0.5);
}

.side-music-item.active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #ff7272;
  border-radius: 10px;
  animation: pulse 1.5s infinite;
  pointer-events: none;
}

.side-item-cover {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 8px;
}

.side-item-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  overflow: hidden;
}

.side-item-name {
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  width: 100%;
}

.side-item-artist {
  font-size: 10px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  width: 100%;
}

/* 卡片展示区样式 */
.card-showcase {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 450px;
  transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  margin-left: 0;
}

.card-showcase.shifted {
  transform: translateX(140px);
}

.card-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 分页控件样式 */
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

/* 美化滚动条 */
.storage-box-container::-webkit-scrollbar,
.side-list-container::-webkit-scrollbar {
  width: 6px;
}

.storage-box-container::-webkit-scrollbar-track,
.side-list-container::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 3px;
}

.storage-box-container::-webkit-scrollbar-thumb,
.side-list-container::-webkit-scrollbar-thumb {
  background: var(--go-dark-border);
  border-radius: 3px;
}

.storage-box-container::-webkit-scrollbar-thumb:hover,
.side-list-container::-webkit-scrollbar-thumb:hover {
  background: #ff7272;
}



/* 添加动画效果 */
.side-music-item {
  animation: slideIn 0.3s ease-out;
}
/* 响应式布局 */
@media (max-width: 768px) {
  .side-list-container {
    width: 161px;
    left: -230px;
    background: rgba(32, 32, 32, 0.9);
  }
  
  .side-list-container.show {
    transform: translateX(220px);
  }
  
  .card-showcase.shifted {
    transform: translateX(100px);
  }
  
  .search-box {
    width: calc(100vw - 115px);
  }
  
  .storage-header {
    flex-direction: row;
    align-items: center;
  }

  .card-canvas {
    width: 83% !important;
    height: 83% !important;
  }
  
  /* 移动端列表项样式调整 */
  .side-music-list {
    grid-template-columns: 1fr;
  }
  
  .side-item-cover {
    width: 60px;
    height: 60px;
  }
  
  .side-item-name {
    font-size: 12px;
  }
  
  .side-item-artist {
    font-size: 10px;
  }
  
  .side-music-item {
    padding: 8px 2px;
        scale: 0.95;
  }
  
  .side-list-header h3 {
    font-size: 16px;
  }
  
  .side-list-header {
    margin-bottom: 15px;
    padding-bottom: 10px;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 添加玻璃质感的光泽效果 */
.side-list-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 20%,
    rgba(255, 255, 255, 0) 50%
  );
  pointer-events: none;
  border-radius: 10px;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.03);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 自定义空状态样式 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  padding: 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 15px;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.empty-text {
  color: #666;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 添加加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: var(--go-dark-border);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>