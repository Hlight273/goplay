<template>
    <div v-show="userPageOn" class="userPage">
      <div class="content">
        <el-icon class="close_btn" @click="commonStore.closeUserPage()"><el-icon><CircleCloseFilled /></el-icon></el-icon>
        <div class="info">
          <img :src="targetUserInfo.avatarUrl" alt="avator" class="avator">
          <span class="nickname stroke">{{ targetUserInfo.nickname }}</span>
          <span class="userId">#{{ targetUserInfo.id }}</span>
        </div>
        <div class="recommend-container">
          <h2 class="title">歌单列表</h2>
          <div class="recommend-list hide_scroll_child">
            <div v-for="(playlistInfo, index) in myPlaylistInfos" :key="index" style="position: relative;">
              <PlaylistBlock :playlist-info="playlistInfo" :my-userinfo="targetUserInfo"/>
            </div>
          </div>
        </div>
      
      </div>
    </div>
</template>

<script lang="ts" setup>
import { userPlaylistInfo } from "@/api/user";
import { Playlist } from "@/interface/playlist";
import { useCommonStore } from "@/store/commonStore";
import { ResultCode } from "@/util/webConst";
import { storeToRefs } from "pinia";
import { onMounted, reactive, watch } from "vue";
import PlaylistBlock from '@/components/playlistBlock.vue'
const commonStore = useCommonStore();
const { userPageOn, targetUserInfo } = storeToRefs(commonStore);
const myPlaylistInfos = reactive<Playlist.PlaylistInfo[]>([]);

watch(
  () => userPageOn.value,
  (newVal, oldVal) => {
    if(oldVal==undefined)return;
    if (newVal==true) {//每次进入用户主页 都要重新拉一遍用户列表
      userPlaylistInfo(targetUserInfo.value.id).then(
      (res)=>{   
        switch (res.code) {
          case ResultCode.SUCCESS:
            console.log("拉取歌单",res.oData);
            myPlaylistInfos.length = 0;
            Object.assign(myPlaylistInfos,res.oData);
            console.log("用户主页歌单更新",myPlaylistInfos);
            break;
          case ResultCode.EMPTY:          
            break;
          default:
            break;
        }
      });
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.userPage {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1900;
    top: 0;
    opacity: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}
.userPage .content{
  position: relative;
  margin-top: -3vh;
    width: 95%;
    height: 90%;
    display: flex;
    align-items: center;
    flex-direction: column;
    background-color: #f5f5f6;
    border-radius: 1vh;
    border: .3vh solid #c2bde8;
    box-shadow: 0px -.7vh .3vh 0px rgb(128 125 155 / 61%) inset;
}
.userPage .content .info {
  display: flex
;
    /* margin: 1vh; */
    height: 12vh;
    width: 100%;
    background-color: #a9c2ff;
    border-radius: 1vh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: .3vh solid #cfbfef;
    box-shadow: 0px -.7vh .3vh 0px rgb(155 140 167 / 61%) inset;
}
.userPage .content .info .avator {
  width: 6vh;
    height: 6vh;
    border-radius: 10vh;
    box-shadow: 0px 0px .4vh .1vh rgba(0, 0, 0, 0.2);
}
.userPage .content .info .nickname {
  margin-top: 0.4vh;
  font-size: 2vh;
  color: white;
} 

.userPage .content .close_btn {
  position: absolute;
    top: 1vh;
    right: 1vh;
  font-size: 2.2vh;
  color: #9da3d0;
    cursor: pointer;
}

.userPage .content .info .userId {
  height: 2vh;
    line-height: 2vh;
    position: absolute;
    right: 1.2vh;
    top: 9vh;
    font-size: 2vh;
    color: #d5ceef;
    font-family: Segoe UI Black;
    font-weight: bold;
}
.recommend-container {
  margin-top: 1vh;
  width: 90%;
    display: flex
;
    flex-wrap: wrap;
    flex-direction: column;
    background: #e7e8ed;
    border-radius: 1vh;
    padding: 2vh;
    border: .1vh solid #cfbfef;
    box-shadow: 0px -.7vh .3vh 0px rgb(155 140 167 / 61%) inset;
    overflow: hidden;
}
.recommend-container .title {
  margin-bottom: -0.6vh;
  font-size: 2vh;
  color: #846887;
}
.recommend-list {
  display: flex;
    gap: 2vh;
    padding: 2vh 0;
    flex-direction: row;
    flex-wrap: wrap;
    overflow: hidden;
    height: 60vh;
    justify-content: space-evenly;
}
</style>