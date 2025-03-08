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
          <div v-for="(playlistInfo, index) in recommendedPlaylistInfos" :key="index" >
            <PlaylistBlock :playlist-info="playlistInfo" :my-userinfo="myUserinfo"/>
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
import { getPlaylistInfo } from '@/api/playlist';
import { Playlist } from '@/interface/playlist';
import { GoPlayer } from '@/util/XgPlayer';
import PlaylistBlock from '@/components/playlistBlock.vue'
import { getRecommendPlaylists } from '@/api/recommend';

const myUserinfo = ref<User.UserInfo>({...User.UserInfo_InitData});

const userId = Number(localStorage.getItem("userid"));
const recommendPlaylistIds:number[] = []
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


    // recommendPlaylistIds.forEach(index => {
    //   getPlaylistInfo(index).then(
    //   (res)=>{   
    //     switch (res.code) {
    //       case ResultCode.SUCCESS:{
    //         recommendedPlaylistInfos.value?.push(res.oData);
    //         break;
    //       }
    //       default:
    //         break;
    //     }
    //   },(err)=>{

    //   });
      
    // });
    
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


</style>