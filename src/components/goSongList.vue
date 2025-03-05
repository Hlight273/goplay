<template>
    <ul class="songUl">
        <li :class="[
                'songLi', 
                selectedIndex == i ? 'select' : '', 
                HasRoomAdminPower(myUserInfo) ? 'admin' : ''
            ]"
            v-for="(songContent, i) in songContentList" @click="(event) => selectSong(event,i)">
            <img :src='(songContent.coverBase64!=null)?
            ("data:image/png;base64," + songContent.coverBase64):
            require("@/assets/icons/default_album.png")' alt="">
            <span>{{ songContent.songInfo.songName }}</span>
            <span>{{ songContent.songInfo.songArtist }}</span>
            <span>{{ songContent.songInfo.songAlbum }}</span>
            <span>{{ formatDuration(songContent.songInfo.songDuration) }}</span>
            <span>
            <el-icon @click="downloadSong(songContent.songUrl)"><Download/></el-icon>
            {{ formatBytes(songContent.songInfo.songSize) }}
            </span>
            <span class="delete" @click="removeSong(songContent.songInfo.id)">
            <el-icon><DeleteFilled /></el-icon>
            </span>
        </li>
    </ul>
    <li class="songLi uploadSong">
        <AudioUploader :user-id="myUserInfo.id" :room-code="roomCode"/>
    </li>
</template>

<script setup lang="ts"> 
import { onMounted, onUnmounted, ref } from 'vue'
import { Song } from '@/interface/song';
import { formatDuration, formatBytes, isNothing } from '@/util/commonUtil'

import { User } from '@/interface/user';
import { HasRoomAdminPower} from '@/api/user'
import { getSongFile } from '@/api/song';
import { roomSongRemove } from '@/api/room';
import { ResultCode } from '@/util/webConst';
import { PlayerData } from '@/interface/playerData';

import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

import AudioUploader from '@/components/audioUploader.vue'

import { useRoomStore } from "@/store/roomStore";
import { storeToRefs } from "pinia";
import { eventBus, MEventTypes } from '@/util/eventBus';
const roomStore = useRoomStore();
const { roomCode } = storeToRefs(roomStore);

interface Props {
  songContentList: Song.SongContent[];
  myUserInfo: User.UserInfo;
}
const props = withDefaults(defineProps<Props>(), {
  songContentList: undefined,
  myUserInfo: () => ({ id: 1, username: 'defaultUser', avatarUrl: '', level: 1 }),
});

const isRoomPlaylist = ()=> props.myUserInfo.id != null //关于如何判别是否在房间 只要根据传入的userInfo是否含有房间号即可

const selectedIndex = ref<number>(-1)


const removeSong = (songId:number) => {
  if(songId==undefined || songId<0 || songId == null) return "";
  if(!isRoomPlaylist()){//没有房间号走这个逻辑，是个人歌单则创建者可以删除 是公共歌单则只有负责人以上可以删除
    return;
  }else{//在房间走这个逻辑
    roomSongRemove(roomCode.value, songId, {userId: props.myUserInfo.id}).then(
      (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:
          globalProperties?.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
  }
  
}

const downloadSong = (songUrl:string) => {
  if(songUrl==undefined || songUrl=="" || songUrl == null) return ""
  getSongFile(songUrl)
}

//播放列表点击事件
const selectSong = (event: MouseEvent, i:number):void=>{
  event.stopPropagation();//防止事件向下传递
  //前端先检查 该歌曲是否已选中 && 浏览器用户是否有管理员房间权限
  console.log("xx",i,selectedIndex.value,roomCode.value,!HasRoomAdminPower(props.myUserInfo));
  
  if(i==selectedIndex.value) return;
  if(!isRoomPlaylist() && !HasRoomAdminPower(props.myUserInfo)) return; //房间内才需要鉴权
  //根据方法构造歌曲状态
  let playerData:PlayerData = {
    index: i,
    url: "",
    curTime: 0,
    paused: false,
    srcUserId : props.myUserInfo.id,
    isExternal:false,
  };
  console.log("pdata:",playerData);
  
  //websocket转发歌曲状态
  //broadcast_playerStatusChangeInRoom(playerData);
  //浏览器更新播放器
  updateMyPlayerData(playerData);
}

//浏览器更新播放器状态
const updateMyPlayerData = (playerData:PlayerData):void=>{
  console.log(`浏览器加载第${playerData.index}首歌曲`);
  selectedIndex.value = playerData.index;
  globalProperties?.$GoPlayer.syncPlayerData(playerData);
}

onMounted(() => {
    eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, (val:boolean) => { 
        
    });
});

onUnmounted(() => {
    eventBus.off(MEventTypes.GOPLAYER_MODE_CHANGED);
});


</script>

<style scoped>
.songUl {
  position: relative;
  width: calc(100% + 1.6vh);
  overflow-y: scroll;
  max-height: 52vh;
  padding-right: 2vh;
}
.songLi {
  margin: .6vh .6vh;
  padding: 0.3vh 0;
  display: flex;
  align-items: center;
  background-color: #ededf1;
  border-radius: .6vh;
  box-shadow: 0px 0px 0.2vh .1vh rgb(91 98 116 / 20%);
  transition: all 0.5s ease-out;
}
.songLi .uploadSong {
  position: sticky;
  bottom: .4vh;
}
.songLi.admin:hover span.delete{
  flex: 1 1 0%;
}
.songLi.select {
  background-color: #fbfbfb;
}
.songLi span {
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.28vh;
  color: #474747;
}
.songLi img:nth-child(1) {
  margin: 0px 1.2vh 0 1vh;
  width: 3.5vh;
  height: 3.5vh;
  border-radius: .4vh;
}
.songLi span:nth-child(2) {
  flex: 8 1 0%;
}
.songLi span:nth-child(3) {
  flex: 3 1 0%;
}
.songLi span:nth-child(4) {
  flex: 3 1 0%;
}
.songLi span:nth-child(5) {
  flex: 1.5 1 0%;
}
.songLi span:nth-child(6) {
  /* margin-left: -3vh; */
  flex: 1.5 1 0%;
  padding-right: 2vh;
}
.songLi span:nth-child(6)>i {
  cursor: pointer;
  padding: .3vh;
  font-size: 2vh;
  color: #ab9bbb;
}
.songLi span.delete {
  flex: 0 1 0%;
  margin: 0 1vh;
  cursor: pointer;
  font-size: 1.6vh;
  color: #ffffff;
  border-radius: 2vh;
  background-color: #6f6f95;
  display: flex;
  /* align-items: center; */
  justify-content: center;
  transition: all 0.3s ease-out;
}
.songLi span.delete i {
  height: 2.4vh;
  width: 2vh;
}
.songLi span.delete:hover {
  background-color: #ffffff00;
  color: #474747;
}
</style>