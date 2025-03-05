<template>
  <div>
    <div class="home-container">
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
          <div v-for="(playlistInfo, index) in recommendedPlaylists" :key="index" class="playlist-item" @click="selectPlaylist(playlistInfo)">
            <img :src='(playlistInfo.playlist.cover_url!=null)?
              ("data:image/png;base64," + playlistInfo.playlist.cover_url):
              require("@/assets/icons/default_album.png")' class="playlist-cover" />
            <p>{{ playlistInfo.playlist.title }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 歌单详情弹出层 -->
    <div v-if="selectedPlaylistInfo.playlist.id>=0" class="playlist-overlay" >
      <div class="playlist-content">
        <el-icon class="close_btn" @click="closePlaylist"><CloseBold/></el-icon>
        <h3>{{ selectedPlaylistInfo.playlist.title }}</h3>
        <GoSongList 
          :my-user-info="myUserinfo" 
          :song-content-list="selectedPlaylistInfo.songContentList"/>
        <!-- <ul>
          <li v-for="(song, index) in selectedPlaylistInfo.songContentList" :key="index">{{ song }}</li>
        </ul> -->
      </div>
    </div>

  </div>
   
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted} from 'vue'

import useCurrentInstance from "@/hooks/useCurrentInstance";
import { userInfo } from '@/api/user';
import { User } from '@/interface/user';
import { ResultCode } from '@/util/webConst';
import { getPlaylistInfo } from '@/api/playlist';
import { Playlist } from '@/interface/Playlist';
import GoSongList from '@/components/goSongList.vue'
const { globalProperties } = useCurrentInstance();

const myUserinfo = ref<User.UserInfo>({
  id: 0,
  username: '',
  avatarUrl: '',
  level:0
});

const userId = Number(localStorage.getItem("userid"));
const recommendPlaylistIds = [3,4,5]
const recommendedPlaylists = ref<Playlist.PlaylistInfo[]>([]);

const banners = ref([
  "https://via.placeholder.com/800x300?text=Banner+1",
  "https://via.placeholder.com/800x300?text=Banner+2",
  "https://via.placeholder.com/800x300?text=Banner+3",
]);

const playlistInfoInitData:Playlist.PlaylistInfo = {
  playlist: {
    id: -1,
    user_id: 0,
    title: '',
    description: '',
    cover_url: null,
    added_at: '',
    update_at: '',
    is_active: 0,
    is_public: 0
  },
  songContentList: []
}
const selectedPlaylistInfo = reactive<Playlist.PlaylistInfo>({...playlistInfoInitData});
const selectPlaylist = (playlistInfo:Playlist.PlaylistInfo) => {
  Object.assign(selectedPlaylistInfo, playlistInfo);
};
const closePlaylist = ()=>{
  Object.assign(selectedPlaylistInfo, playlistInfoInitData);
}


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
    },(err)=>{

    });

    recommendPlaylistIds.forEach(index => {
      getPlaylistInfo(index).then(
      (res)=>{   
        switch (res.code) {
          case ResultCode.SUCCESS:{
            recommendedPlaylists.value?.push(res.oData);
            break;
          }
          default:
            break;
        }
      },(err)=>{

      });
      
    });
    
})

</script>

<style scoped>
.home-container {
  width: calc(100% - 46px);
  height: 84vh;
  background-color: #f5f5f5;
  padding: 2vh;
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

.playlist-item {
  text-align: center;
  cursor: pointer;
}

.playlist-cover {
  width: 20vh;
  height: 20vh;
  border-radius: 5px;
  transition: transform 0.3s ease-in-out;
}

.playlist-cover:hover {
  transform: scale(1.05);
}

.playlist-overlay {
  z-index: 100;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.playlist-content {
  position: relative;
  padding: 0 1vh;
    padding-top: 1vh;
    padding-bottom: 1.6vh;
    width: 90%;
    max-height: 64vh;
    background-color: #f5f5f6;
    border-radius: 1vh;
    border: .1vh solid #e7e7e7;
    box-shadow: 0px -.7vh .2vh 0px rgb(128 125 155 / 20%) inset;
    overflow: hidden;
}
.playlist-content .close_btn {
  cursor: pointer;
    color: var(--el-color-primary);
    font-size: 3vh;
    position: absolute;
    top: 1vh;
    right: 1vh;
}
</style>