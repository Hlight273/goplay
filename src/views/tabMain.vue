<template>
  <div class="main-container">
    <!-- 现有的欢迎信息 -->
    <div class="welcome-section">
     
      <!-- 动态面包屑 -->
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item @click="handleBackHome" :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="!showSearchResults">推荐歌单</el-breadcrumb-item>
        <el-breadcrumb-item v-else>搜索："{{ searchKeyword }}"</el-breadcrumb-item>
      </el-breadcrumb>

      <!-- 搜索框 -->
      <div class="search-bar" v-if="token!=null">
        <el-input 
          v-model="searchKeyword"
          placeholder="搜索歌单"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch"/>
          </template>
        </el-input>
      </div>

       <!-- 欢迎卡片 -->
      <WelcomeCard />

      <div class="home-container white_backpanel">
        <div v-show="!showSearchResults" class="hide_scroll_child">
          <!-- 推荐歌单 -->
          <div class="recommend-container">
            <h2>站长推荐</h2>
            <div v-if="adminRecommendLoading" class="loading-container">
              <FancyLoader :percentage="adminLoadingProgress" text="加载推荐中..." />
            </div>
            <div v-else class="recommend-list">
              <div v-for="(playlistInfo, index) in recommendedPlaylistInfos" :key="index" >
                <PlaylistBlock :playlist-info="playlistInfo" :my-userinfo="myUserinfo"/>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-show="showSearchResults" class="search-results">
          <div v-loading="searchLoading" class="result-list">
            <div v-if="!(searchResults.length === 0 && !searchLoading)" v-for="playlist in searchResults" :key="playlist.playlist.id">
              <PlaylistBlock :playlist-info="playlist" :my-userinfo="myUserinfo"/>
            </div>
            <div v-if="searchResults.length === 0 && !searchLoading" class="no-result">
              暂无搜索结果
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加推荐区域 -->
    <div class="recommend-section">
      <div class="left-section">
        <h2 class="section-title">
          为你推荐
          <el-tooltip content="点击刷新推荐" placement="right">
            <el-icon class="refresh-icon" @click="refreshRecommends"><Refresh /></el-icon>
          </el-tooltip>
          <span class="update-time">{{ lastUpdateTime }}</span>
        </h2>
        <div v-if="autoRecommendLoading" class="loading-container">
          <FancyLoader :percentage="autoLoadingProgress" text="加载个性化推荐中..." />
        </div>
        <div v-else class="playlist-grid">
          <PlaylistBlock
            v-for="playlist in recommendPlaylists"
            :my-userinfo="myUserinfo"
            :key="playlist.playlist.id"
            :playlist-info="playlist"
          />
        </div>
      </div>
      
      <div class="right-section">
        <h2 class="section-title">
          热门歌曲
          <el-tooltip content="实时热门歌曲" placement="right">
            <el-icon class="hot-icon"><Star /></el-icon>
          </el-tooltip>
        </h2>
        <div v-if="hotSongsLoading" class="loading-container">
          <FancyLoader :percentage="hotLoadingProgress" text="加载热门歌曲中..." />
        </div>
        <div v-else>
          <HotSongList :songs="state.hotSongs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PlaylistBlock from '@/components/playlistBlock.vue'
import HotSongList from '@/components/hotSongList.vue'
import WelcomeCard from '@/components/welcomeCard.vue'
import FancyLoader from '@/components/FancyLoader.vue'
import { getRecommendPlaylists, getHotSongs, getRecommendAutoPlaylists } from '@/api/recommend'
import { Song } from '@/interface/song'
import { Playlist } from '@/interface/playlist'
import { ResultCode } from '@/util/webConst'
import { userInfo } from '@/api/user'
import { User } from '@/interface/user'
import { Refresh, Star, Trophy, MagicStick, Moon } from '@element-plus/icons-vue'

const myUserinfo = ref<User.UserInfo>({...User.UserInfo_InitData});

// 添加加载状态变量
const adminRecommendLoading = ref(true);
const autoRecommendLoading = ref(true);
const hotSongsLoading = ref(true);

// 添加加载进度变量
const adminLoadingProgress = ref(0);
const autoLoadingProgress = ref(0);
const hotLoadingProgress = ref(0);

// 模拟加载进度的函数
const simulateProgress = (progressRef: any, callback?: Function) => {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 10) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      progressRef.value = progress;
      if (callback) callback();
    } else {
      progressRef.value = progress;
    }
  }, 200);
};

const userId = Number(localStorage.getItem("userid"));
const recommendedPlaylistInfos = ref<Playlist.PlaylistInfo[]>([]);

const banners = ref([
  require("@/assets/imgs/banner/banner1.png"), // 推荐歌单
  require("@/assets/imgs/banner/banner2.png"), // 新歌首发
  require("@/assets/imgs/banner/banner3.png"), // 热门歌曲
]);

const token = localStorage.getItem("token");

const router = useRouter()
const state = reactive({
  hotSongs: [] as Song.SongContent[]
})
const recommendPlaylists = ref<Playlist.PlaylistInfo[]>([])

onMounted(async () => {
  // 开始模拟加载进度
  simulateProgress(adminLoadingProgress);
  simulateProgress(autoLoadingProgress);
  simulateProgress(hotLoadingProgress);

  userInfo(userId).then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:          
          myUserinfo.value = res.oData;
          break;
        default:
          break;
      }
    });

  getRecommendPlaylists().then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:          
          recommendedPlaylistInfos.value = res.oData;
          adminRecommendLoading.value = false;
          adminLoadingProgress.value = 100;
          break;
        default:
          break;
      }
    });

  try {
    const [playlistsRes, songsRes] = await Promise.all([
      getRecommendAutoPlaylists(),
      getHotSongs()
    ])
    
    if (playlistsRes.code === ResultCode.SUCCESS) {
      recommendPlaylists.value = playlistsRes.oData || []
      autoRecommendLoading.value = false;
      autoLoadingProgress.value = 100;
    }
    
    if (songsRes.code === ResultCode.SUCCESS) {
      state.hotSongs = songsRes.oData || []
      hotSongsLoading.value = false;
      hotLoadingProgress.value = 100;
    }
  } catch (error) {
    console.error('获取推荐数据失败:', error)
    state.hotSongs = []
    recommendPlaylists.value = []
    // 即使出错也要关闭加载状态
    adminRecommendLoading.value = false;
    autoRecommendLoading.value = false;
    hotSongsLoading.value = false;
    adminLoadingProgress.value = 100;
    autoLoadingProgress.value = 100;
    hotLoadingProgress.value = 100;
  }
})

// 刷新推荐
const lastUpdateTime = ref('刚刚更新')
const refreshRecommends = async () => {
  // 重新开始加载
  autoRecommendLoading.value = true;
  hotSongsLoading.value = true;
  autoLoadingProgress.value = 0;
  hotLoadingProgress.value = 0;
  
  // 模拟加载进度
  simulateProgress(autoLoadingProgress);
  simulateProgress(hotLoadingProgress);
  
  try {
    const [playlistsRes, songsRes] = await Promise.all([
      getRecommendAutoPlaylists(),
      getHotSongs()
    ])
    
    if (playlistsRes.code === ResultCode.SUCCESS) {
      recommendPlaylists.value = playlistsRes.oData || []
      autoRecommendLoading.value = false;
      autoLoadingProgress.value = 100;
    }
    
    if (songsRes.code === ResultCode.SUCCESS) {
      state.hotSongs = songsRes.oData || []
      hotSongsLoading.value = false;
      hotLoadingProgress.value = 100;
    }

    // 更新刷新时间
    const now = new Date()
    lastUpdateTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} 更新`
  } catch (error) {
    console.error('刷新推荐数据失败:', error)
    autoRecommendLoading.value = false;
    hotSongsLoading.value = false;
    autoLoadingProgress.value = 100;
    hotLoadingProgress.value = 100;
  }
}

//搜索
import { Search } from '@element-plus/icons-vue' // 引入图标
import { searchPlaylists } from '@/api/playlist';
const searchKeyword = ref('')
const showSearchResults = ref(false)
const searchResults = ref<Playlist.PlaylistInfo[]>([])
const searchLoading = ref(false)
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    showSearchResults.value = false
    return
  }

  try {
    searchLoading.value = true
    showSearchResults.value = true
    searchResults.value = [];
    searchPlaylists(keyword, 1, 20).then(
      (res)=>{   
        switch (res.code) {
          case ResultCode.SUCCESS:          
            searchResults.value = res.oData
            break;
          default:
            break;
      }
    });
    // const res = await searchPlaylists(keyword) // 实际调用搜索接口
    // searchResults.value = res.oData
  } finally {
    searchLoading.value = false
  }
}

//面包屑
const handleBackHome = (e: MouseEvent) => {
  e.preventDefault()
  showSearchResults.value = false
  searchKeyword.value = ''
  searchResults.value = []
}

</script>

<style scoped>
/* 主容器样式 */
.main-container {
  padding: 20px;
  overflow-y: scroll;
  height: 83vh;
}

/* 欢迎区域样式 */
.home-container {
  width: calc(100% - 46px);
  padding: 1vh 1.6vh;
  overflow: hidden;
  margin-top: 1vh;
  background: #ffffff;
}

.search-bar {
  margin-top: 1vh;
}

/* 搜索结果区域 */
.search-results {
  height: 73vh;
  overflow: hidden;
}

.result-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1vh;
  height: 73vh;
  justify-content: center;
}

.no-result {
  text-align: center;
  color: #666;
  font-size: 1.6vh;
  padding: 50px 0;
  width: 100%;
}

/* 轮播图样式 */
.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 推荐区域布局 */
.recommend-section {
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin-top: 20px;
  overflow: hidden;
}

.left-section {
  flex: 1;
}

.right-section {
  width: 300px;
}

/* 站长推荐区域 */
.recommend-container {
  padding: 3px;
}

.recommend-list {
  gap: 20px;
  height: 23vh;
  overflow-x: scroll;
  display: flex;
}

.recommend-item {
  animation: slideIn 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  flex: 0 0 auto;
  width: calc(33.33% - 14px);
}

/* 歌单网格布局 */
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  margin-top: 15px;
  justify-content: center;
  justify-items: stretch;
}

.playlist-grid > div {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.playlist-grid > div:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 标题样式 */
h2 {
  position: relative;
  margin-bottom: 25px;
  font-size: 18px;
  font-weight: 600;
  color: #655d75;
  padding-left: 15px;
  display: flex;
  align-items: center;
}

h2::before {
  content: '';
  position: absolute;
  left: 0;
  width: 4px;
  height: 20px;
  background: var(--el-color-primary);
  border-radius: 2px;
}

h2::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, var(--el-border-color) 0%, transparent 100%);
  margin-left: 15px;
}

.section-title {
  position: relative;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
  color: #655d75;
  padding-left: 15px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.section-title:hover {
  transform: translateX(5px);
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  width: 4px;
  height: 18px;
  background: var(--el-color-primary);
  border-radius: 2px;
  transition: height 0.3s ease;
}

.section-title:hover::before {
  height: 24px;
}

/* 图标样式 */
.refresh-icon {
  margin-left: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.refresh-icon:hover {
  transform: rotate(180deg);
  color: var(--el-color-primary);
}

.hot-icon {
  margin-left: 10px;
  font-size: 16px;
  color: #ff9800;
  animation: pulse 2s infinite;
}

.update-time {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
}

/* 管理员推荐样式 */
.admin-recommend-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--el-border-color-light);
}

.crown-icon {
  color: var(--el-color-primary);
  font-size: 24px;
  animation: float 3s ease-in-out infinite;
}

.recommend-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-left: 10px;
  font-weight: normal;
}

/* 加载状态的样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
}

/* 动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

/* 移动端适配 - 平板 */
@media screen and (max-width: 768px) {
  .main-container {
    padding: 10px;
    height: 80vh;
  }
  
  .recommend-section {
    flex-direction: column;
    gap: 15px;
  }
  
  .right-section {
    width: 100%;
  }
  
  .playlist-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 10px;
  }
  
  .recommend-list {
    height: auto;
    max-height: 40vh;
    padding-bottom: 10px;
  }
  
  h2, .section-title {
    font-size: 16px;
    margin-bottom: 15px;
  }
  
  .update-time {
    font-size: 10px;
  }
  
  .search-bar {
    margin-bottom: 10px;
  }
  
  .home-container {
    width: calc(100% - 20px);
    padding: 10px;
  }
  
  .result-list {
    height: auto;
    max-height: 65vh;
  }
}

/* 移动端适配 - 手机 */
@media screen and (max-width: 480px) {
  .playlist-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .main-container {
    padding: 8px;
  }
  
  h2::after {
    display: none; /* 移除小屏幕上的装饰线 */
  }
  
  .section-title:hover {
    transform: none; /* 移除小屏幕上的悬停效果 */
  }
}
</style>