<template>
    <div v-show="userPageOn" class="userPage">
      <div class="content">

        <img :src="targetUserInfo.avatarUrl" alt="avator" class="avator">
        {{ targetUserInfo.nickname }}
        <span class="userId">#{{ targetUserInfo.id }}</span>
        <button class="close" @click="commonStore.closeUserPage()"><el-icon><CircleCloseFilled /></el-icon></button>
      
        <div class="recommend-container">
          <h2>我的歌单</h2>
          <div class="recommend-list">
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
            console.log(res.oData);
            
            Object.assign(myPlaylistInfos,res.oData);
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
  margin-top: -3vh;
    width: 95%;
    height: 90%;
    display: flex;
    align-items: center;
    flex-direction: column;
    overflow-y: auto;
    background-color: #f5f5f6;
    border-radius: 1vh;
    border: .3vh solid #7f7aa9;
    box-shadow: 0px -.7vh .3vh 0px rgb(128 125 155 / 61%) inset;
}
.userPage .content .close {

}

.userPage .content .userId {
  height: 2vh;
    line-height: 2vh;
    position: absolute;
    right: 1.2vh;
    bottom: 1vh;
    font-size: 2vh;
    color: #d5ceef;
    font-family: Segoe UI Black;
    font-weight: bold;
}
</style>