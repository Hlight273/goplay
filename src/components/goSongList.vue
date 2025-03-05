<template>
    <ul class="songUl">
        <li :class="[
            'songLi', 
            selectedIndex == i ? 'select' : '', 
            HasRoomAdminPower(myUserInfo) ? 'admin' : ''
          ]"
          v-for="(songContent, i) in songContentList" 
          @click="(event:any) =>selectSong(event,i)">
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
        <AudioUploader :user-id="myUserInfo.id" :playlist-id="playlistId" :room-code="roomCode" :is-room-playlist="isRoomPlaylist"/>
    </li>
</template>

<script setup lang="ts"> 
import { onMounted, onUnmounted, ref } from 'vue'
import { Song } from '@/interface/song';
import { formatDuration, formatBytes, isNothing } from '@/util/commonUtil'

import { eventBus, MEventTypes } from '@/util/eventBus';
import { Events } from 'xgplayer';

import { User } from '@/interface/user';
import { HasRoomAdminPower} from '@/api/user'
import { getSongFile } from '@/api/song';
import { roomSongRemove } from '@/api/room';
import { ResultCode, websocketRoot } from '@/util/webConst';
import { PlayerData } from '@/interface/playerData';

import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

import AudioUploader from '@/components/audioUploader.vue'

import { useRoomStore } from "@/store/roomStore";
import { storeToRefs } from "pinia";
import { WebSocketService } from '@/util/webSocketService';
import { IMessage } from '@stomp/stompjs';
import { GoPlayer } from '@/util/XgPlayer';
const roomStore = useRoomStore();
const { roomCode,roomData } = storeToRefs(roomStore);

const userId = Number(localStorage.getItem("userid"))

interface Props {
  songContentList: Song.SongContent[];
  myUserInfo: User.UserInfo;
  playlistId: number;
  isRoomPlaylist: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  songContentList: undefined,
  myUserInfo: () => ({ id: 1, username: 'defaultUser', avatarUrl: '', level: 1 }),
  playlistId: -1,
  isRoomPlaylist: false,
});


const selectedIndex = ref<number>(-1)

onMounted(() => {
    eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged);
});

onUnmounted(() => {
    eventBus.off(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged);
});

const handleModeChanged = (val: boolean) => {
  if (val) { // 房间模式
    console.log("<<<<<<<<<<<<<<<<<<<<<<<进入房间模式");
    subscribeWebsocket(); // 开启WebSocket
    roomPlayerEventReg();  // 监听播放器就绪事件
  } else { // 单人模式
    console.log("<<<<<<<<<<<<<<<<<<<<<<<进入单人模式");
    if (wsService !== null) { // 卸载WebSocket
      wsService.disconnect();
      wsService = null;
    }
    roomPlayerEventUnreg();  // 清除播放器事件监听
  }
};

//开启ws，订阅端点
let wsService:WebSocketService| null = null;
const subscribeWebsocket = () => {
  wsService = new WebSocketService(websocketRoot, userId, roomData.value.id);
  wsService.subscribe(`/topic/${roomData.value?.id}/playerData`,receive_PlayerData_InRoom)
  wsService.connect();
}
//播放器状态更改(需要管理员权限)
const broadcast_playerStatusChangeInRoom = (playerData:PlayerData) => {
  if(playerData == null||playerData==undefined) 
    return
  if(!HasRoomAdminPower(props.myUserInfo))
    return
  //console.log("send_pdata:",playerData);
  wsService?.sendMessage(`/app/${roomData.value?.id}/${userId}/change/playerStatus`, JSON.stringify(playerData));
}
//订阅 播放器状态更新 /topic/房间id/playerData  (需要排除广播到自己)
const receive_PlayerData_InRoom = (msg:IMessage)=>{
  //console.log("上锁上锁上锁上锁上锁上锁上锁");
  let _playerData = JSON.parse(msg.body) as PlayerData
  
  //排除自己发的
  if(_playerData.srcUserId == userId)
    return
  globalProperties?.$GoPlayer.b_lock();//上锁。
  console.log("🎵播放器状态更新👉");
  selectedIndex.value = _playerData.index;
  globalProperties?.$GoPlayer.syncPlayerData(_playerData);
}


//其他播放器回调事件统一注册、卸载
const roomPlayerEventReg = () => {
  //console.log(globalProperties?.$GoPlayer.player);
  
  //播放
  globalProperties?.$GoPlayer.player4room?.on(Events.PLAY, () => {
    if(globalProperties?.$GoPlayer.is_b_locked()){
      //console.log("播放被拦截，锁已解开");
      globalProperties?.$GoPlayer.b_unlock()
      return
    }
    selectedIndex.value = globalProperties?.$GoPlayer.player4room?.plugins.music.index;
    let _playerData:PlayerData = {
      index: globalProperties?.$GoPlayer.player4room?.plugins.music.index,
      url: "",
      curTime: globalProperties?.$GoPlayer.player4room?.currentTime,
      paused: false,
      srcUserId : userId,
      isExternal:true,
    };
    //console.log("-<<<(((房间内广播_播放)))>>>---");
    broadcast_playerStatusChangeInRoom(_playerData);
  });
  //暂停
  globalProperties?.$GoPlayer.player4room?.on(Events.PAUSE, () => {
    if(globalProperties?.$GoPlayer.is_b_locked()){
      //console.log("暂停被拦截，锁已解开");
      globalProperties?.$GoPlayer.b_unlock()
      return
    }
    if(!GoPlayer.isRoomMode())return;
    let _playerData:PlayerData = {
      index: globalProperties?.$GoPlayer.player4room?.plugins.music.index,
      url: "",
      curTime: globalProperties?.$GoPlayer.player4room?.currentTime,
      paused: true,
      srcUserId : userId,
      isExternal:true,
    };
    //console.log("-<<<(((房间内广播_暂停)))>>>---");
    broadcast_playerStatusChangeInRoom(_playerData);
  });
  //时间调整
  globalProperties?.$GoPlayer.player4room?.on(Events.SEEKED, () => {
    if(globalProperties?.$GoPlayer.is_b_locked()){
      //console.log("调时间被拦截，锁已解开");
      globalProperties?.$GoPlayer.b_unlock()
      return
    }
    let _playerData:PlayerData = {
      index: globalProperties?.$GoPlayer.player4room?.plugins.music.index,
      url: "",
      curTime: globalProperties?.$GoPlayer.player4room?.currentTime,
      paused: false,
      srcUserId : userId,
      isExternal:true,
    };
    //console.log("-<<<(((房间内广播_调时间)))>>>---");
    broadcast_playerStatusChangeInRoom(_playerData);
  });

}
const roomPlayerEventUnreg = () => {
  globalProperties?.$GoPlayer.player4room?.off(Events.PLAY, broadcast_playerStatusChangeInRoom)
  globalProperties?.$GoPlayer.player4room?.off(Events.PAUSE, broadcast_playerStatusChangeInRoom)
  globalProperties?.$GoPlayer.player4room?.off(Events.LOAD_START, broadcast_playerStatusChangeInRoom)
  globalProperties?.$GoPlayer.player4room?.off(Events.SEEKED, broadcast_playerStatusChangeInRoom)
}

//播放列表点击事件
const selectSong = (event: MouseEvent, i:number):void=>{
  event.stopPropagation();//防止事件向下传递
  console.log(props.isRoomPlaylist);

  if(props.isRoomPlaylist && !GoPlayer.isRoomMode()){//播放器单人模式禁止操作房间 反之
    globalProperties?.$message.closeAll();
    globalProperties?.$message.info("请先切换到房间模式！");
    return;
  }else if(!props.isRoomPlaylist && GoPlayer.isRoomMode()){
    globalProperties?.$message.closeAll();
    globalProperties?.$message.info("请先切换到单人模式！");
    return;
  }

  if(i==selectedIndex.value) return;//前端先检查 该歌曲是否已选中 && (房间歌单)用户是否有管理员房间权限
  if(props.isRoomPlaylist && !HasRoomAdminPower(props.myUserInfo)) return;

  selectedIndex.value = i;
  
  if(props.isRoomPlaylist){
    globalProperties?.$GoPlayer.setPlayer4RoomIndex(i);
  }else{
    globalProperties?.$GoPlayer.setPlayer4localIndex(i);
  }
  
}

const removeSong = (songId:number) => {
  if(songId==undefined || songId<0 || songId == null) return "";
  if(!props.isRoomPlaylist){//没有房间号走这个逻辑，是个人歌单则创建者可以删除 是公共歌单则只有负责人以上可以删除
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