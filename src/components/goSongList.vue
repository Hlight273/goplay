<template>
    <ul class="songUl">
        <li :class="[
            'songLi', 
            selectedIndex == i ? 'select' : '', 
            canDeleteSong(playlistInfo.playlist, myUserInfo) ? 'admin' : ''
          ]"
          v-for="(songContent, i) in playlistInfo.songContentList" 
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
              <!-- 添加下载完成的绿色点标识 -->
              <div v-if="downloadedSongs[songContent.songUrl]" class="download-indicator"></div>
            </span>
            <span class="delete" @click="removeSong(songContent.songInfo.id)">
            <el-icon><DeleteFilled /></el-icon>
            </span>
        </li>
    </ul>
    <li v-if="canShowUploader" class="songLi uploadSong">
        <AudioUploader :user-id="myUserInfo.id"
          :playlist-id="playlistInfo.playlist.id"
          :room-code="roomCode"
          :is-room-playlist="isRoomPlaylist"
          @upload-success="handleUploadSuccess"/>
    </li>
</template>

<script setup lang="ts"> 
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Song } from '@/interface/song';
import { formatDuration, formatBytes, isNothing } from '@/util/commonUtil'

import { eventBus, MEventTypes } from '@/util/eventBus';
import { Events } from 'xgplayer';

import { User } from '@/interface/user';
import { HasPlaylistPermission, HasRoomAdminPower} from '@/api/user'
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
import { Playlist } from '@/interface/playlist';
import { removeSongInPlaylist } from '@/api/playlist';
const roomStore = useRoomStore();
const { roomCode,roomData } = storeToRefs(roomStore);

const userId = Number(localStorage.getItem("userid"))

interface Props {
  myUserInfo: User.UserInfo;
  playlistInfo: Playlist.PlaylistInfo;
  isRoomPlaylist: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  myUserInfo: () => ({...User.UserInfo_InitData}),
  playlistInfo: ()=>({...Playlist.playlistInfo_InitData}),
  isRoomPlaylist: false,
});

const canShowUploader = computed(() => {
  if (props.isRoomPlaylist) {
    // 房间模式：只有管理员可以看到
    return HasRoomAdminPower(props.myUserInfo);
  } else {
    // 普通歌单模式：只有歌单创建者可以看到
    return props.playlistInfo.playlist.userId === props.myUserInfo.id;
  }
});


const selectedIndex = ref<number>(-1)
const downloadedSongs = ref<Record<string, boolean>>({});//需要记录当前下载歌曲

onMounted(() => {
    eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged);
    eventBus.on(MEventTypes.SONG_LOADING_PROGRESS, handleDownloadProgress);
});

onUnmounted(() => {
    eventBus.off(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged);
    eventBus.off(MEventTypes.SONG_LOADING_PROGRESS, handleDownloadProgress);
});

const handleDownloadProgress = ({ url, progress }: { url: string, progress: number }) => {
  if (progress === 100) {
    downloadedSongs.value[url] = true;
  }
};

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

const canDeleteSong = (playlist:Playlist.Playlist, userInfo:User.UserInfo):boolean=>{
  if(props.isRoomPlaylist)//房间内和其他的逻辑不通
    return HasRoomAdminPower(userInfo)
  else
    return HasPlaylistPermission(playlist, userInfo)
}

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
    removeSongInPlaylist(props.playlistInfo.playlist.id, songId).then(
      (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:
          globalProperties?.$message.success(res.message);
          props.playlistInfo.songContentList.forEach((songContent,i) => {
            if(songContent.songInfo.id==songId){
              props.playlistInfo.songContentList.splice(i,1);
              GoPlayer.getInstance().addSong_to_LocalPlaylist(songContent);
            }
          });
          break;
        default:
          break;
      }
    });
  }else{//在房间走这个逻辑
    roomSongRemove(roomCode.value, songId, {userId: props.myUserInfo.id}).then(
      (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:
          globalProperties?.$message.success(res.message);
          break;
        default:
          break;
      }
    });
  }
  
}

const downloadSong = (songUrl:string) => {
  if(songUrl==undefined || songUrl=="" || songUrl == null) return ""
  getSongFile(songUrl,0)
}

//上传回调
const handleUploadSuccess = (songContent:Song.SongContent)=>{
  if(!props.isRoomPlaylist)//普通歌单才需要回调
  {
    props.playlistInfo.songContentList.push(songContent);
    let l = GoPlayer.getInstance().addSong_to_LocalPlaylist(songContent);
    console.log("list ",l);
    
  }
   
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
  flex: 2.2 1 0%;
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

/* 添加下载完成指示器的样式 */
.download-indicator {
  display: inline-block;
  width: 0.8vh;
  height: 0.8vh;
  border-radius: 50%;
  background-color: #4CAF50;
  margin-left: 0.5vh;
  vertical-align: middle;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7), 0 0 0 0 rgba(76, 175, 80, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 0.2vh rgba(76, 175, 80, 0.4), 0 0 0 0.4vh rgba(76, 175, 80, 0.2);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0.4vh rgba(76, 175, 80, 0), 0 0 0 0.6vh rgba(76, 175, 80, 0);
    transform: scale(1);
  }
}

/* 添加移动端响应式样式 */
@media screen and (max-width: 768px) {
  .songUl {
    /* width: calc(100% + 1vh); */
    width: 100%;
    padding-right: 1vh;
  }

  .songLi {
    margin: .4vh .4vh;
    padding: 0.2vh 0;
  }

  .songLi img:nth-child(1) {
    margin: 0px 0.8vh 0 0.8vh;
    width: 3vh;
    height: 3vh;
  }

  /* 调整显示内容 */
  .songLi span:nth-child(2) {
    flex: 5 1 0%; /* 歌名占更多空间 */
  }
  
  .songLi span:nth-child(3),  /* 艺术家 */
  .songLi span:nth-child(4) { /* 专辑名 */
    display: none;
  }
  
  .songLi span:nth-child(5) { /* 时长 */
    flex: 1 1 0%;
  }
  
  .songLi span:nth-child(6) { /* 大小和下载按钮 */
    flex: 0.8 1 0%;
    padding-right: 1vh;
  }

  /* 隐藏文件大小，只保留下载图标 */
  .songLi span:nth-child(6) {
    font-size: 0; /* 隐藏文字 */
  }

  .songLi span:nth-child(6)>i {
    font-size: 1.8vh;
    padding: .2vh;
  }

  .songLi span.delete {
    flex: 0.6 1 0%;
    margin: 0 0.8vh;
  }

  .songLi span.delete i {
    height: 2vh;
    width: 1.6vh;
  }

  .download-indicator {
    width: 0.6vh;
    height: 0.6vh;
    margin-left: 0.2vh;
  }
}

@media screen and (max-width: 480px) {
  .songLi img:nth-child(1) {
    width: 2.6vh;
    height: 2.6vh;
    margin: 0px 0.6vh 0 0.6vh;
  }

  .songLi span {
    font-size: 1.1vh;
  }

  .songLi span:nth-child(6)>i {
    font-size: 1.6vh;
  }

  .songLi span.delete {
    margin: 0 0.6vh;
  }

  .songLi span.delete i {
    height: 1.8vh;
    width: 1.4vh;
  }
}
</style>