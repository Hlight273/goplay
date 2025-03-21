<template>
  <div>

    <!-- 动态面包屑 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item @click="handleBackHome" :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item v-if="!showSearchResults">推荐歌单</el-breadcrumb-item>
      <el-breadcrumb-item v-else>搜索："{{ searchKeyword }}"</el-breadcrumb-item>
    </el-breadcrumb>
    
     <!-- 搜索框 -->
     <div class="search-bar">
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

    <div class="home-container">
      <div v-show="!showSearchResults" class="hide_scroll_child">
         <!-- 轮播图 -->
        <el-carousel height="40vh">
          <el-carousel-item v-for="(item, index) in banners" :key="index">
            <img :src="item" class="carousel-img" />
          </el-carousel-item>
        </el-carousel>

        <!-- 推荐歌单 -->
        <div class="recommend-container">
          <h2>推荐歌单</h2>
          <div class="recommend-list">
            <div v-for="(playlistInfo, index) in recommendedPlaylistInfos" :key="index" >
              <PlaylistBlock :playlist-info="playlistInfo" :my-userinfo="myUserinfo"/>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-show="showSearchResults" class="search-results">
        <div v-loading="searchLoading" class="result-list hide_scroll_child">
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


   
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted} from 'vue'
import { userInfo } from '@/api/user';
import { User } from '@/interface/user';
import { ResultCode } from '@/util/webConst';
import { Playlist } from '@/interface/playlist';
import { GoPlayer } from '@/util/XgPlayer';
import PlaylistBlock from '@/components/playlistBlock.vue'
import { getRecommendPlaylists } from '@/api/recommend';

const myUserinfo = ref<User.UserInfo>({...User.UserInfo_InitData});

const userId = Number(localStorage.getItem("userid"));
const recommendedPlaylistInfos = ref<Playlist.PlaylistInfo[]>([]);

const banners = ref([
  "https://via.placeholder.com/800x300?text=Banner+1",
  "https://via.placeholder.com/800x300?text=Banner+2",
  "https://via.placeholder.com/800x300?text=Banner+3",
]);

onMounted(() => {
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
          break;
        default:
          break;
      }
    });
})

import { Search } from '@element-plus/icons-vue' // 引入图标
import { useRouter } from 'vue-router'
import { searchPlaylists } from '@/api/playlist';

const router = useRouter()
const searchKeyword = ref('')


// 新增状态
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

const handleBackHome = (e: MouseEvent) => {
  e.preventDefault()
  showSearchResults.value = false
  searchKeyword.value = ''
  searchResults.value = []
}

</script>

<style scoped>
.home-container {
  width: calc(100% - 46px);
  height: 77vh;
  background-color: #f5f5f5;
  padding: 2vh;
  overflow: hidden;
  margin-top: 1vh;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommend-container {
  margin-top: 5vh;
}

.recommend-list {
  display: flex;
  gap: 2vh;
  overflow-x: auto;
  padding: 2vh 0;
}


.search-bar {
  margin-top: 1vh;
}
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

</style>