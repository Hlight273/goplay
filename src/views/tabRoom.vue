<template>

  <!-- 加入房间页 -->
  <div class="content" v-show="currentPageState==PageStatus.WAIT_FOR_ROOM">
    <div class="line">
        <el-button type="primary" @click="createNewRoom()" color="#7365ff">创建房间</el-button>
    </div>
    <div class="line">
        <el-input v-model="roomCode_join" placeholder="房间代码"/>
        <el-button class="btn_join" type="primary" @click="joinNewRoom()" color="#7365ff">
            加入房间<el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
    </div>
  </div>

  <!-- 房间内页 -->
  <div class="content"  v-show="currentPageState==PageStatus.IN_ROOM">
    <div class="line top">
      <el-button class="btn_join" type="primary" @click="exitRoom()" color="#7365ff" :icon="ArrowLeft">
        离开房间
      </el-button>
      <div class="roomInfo" v-show="roomData">
        <span>{{ roomData?.roomName }}</span>
        <span>
          <el-icon><Avatar /></el-icon>
          {{ roomData?.currentUsers }}/{{ roomData?.maxUsers }}
        </span>
        
      </div>
      <div class="roomCode" v-show="roomData">
        <el-icon @click="copyRoomCode()"><CopyDocument color="#434343"/></el-icon>
        <span>{{ roomData?.roomCode }}</span>
      </div>
    </div>

    <div class="line userlist">
      <div v-if="userInfoList" v-for="userinfo in userInfoList">
        <el-dropdown placement="bottom" :hide-on-click="false" trigger="click" class="userDropdown">
          <div class="userDisplay_mini">
            <el-icon class="permissionIcon" v-show="userinfo.privilege==1"><Avatar color="#ffa46f" /></el-icon>
            <el-icon class="permissionIcon" v-show="userinfo.privilege==2"><Avatar color="#3fc271" /></el-icon>
            <img :src="userinfo.avatarUrl" alt="avator" class="avator">
            <span>{{ userinfo.id==userId?'我':userinfo.username }}</span>
          </div>
          <template #dropdown>
            <div class="playerInfoPanel">
              <div class="info">
                <img :src="userinfo.avatarUrl" alt="avator" class="avator">
                <div class="infoRight">
                  <span class="userName">{{ userinfo.username }}</span>
                  <span class="userPri">权限：{{getPrivilegeName(userinfo)}}</span>
                  <span class="userId">#{{ userinfo.id }}</span>
                </div>
              </div>
              <div class="btns">
                <el-button v-show="userinfo.id!=userId && HasOwnerPower(myUserInfo)"
                 @click="roomOwnerTransPrivilege(roomData.roomCode, userId, userinfo.id)"
                 color="#7365ff">移交房主</el-button>
                
                <el-button v-show="userinfo.id!=userId && HasOwnerPower(myUserInfo) && !HasRoomAdminPower(userinfo)"
                 @click="roomMemberPrivilege(roomData.roomCode, userinfo.id, Privilege.Enum.管理员, userId)"
                 color="#7365ff">设为管理员</el-button>

                <el-button v-show="userinfo.id!=userId && HasOwnerPower(myUserInfo) && HasRoomAdminPower(userinfo)"
                 @click="roomMemberPrivilege(roomData.roomCode, userinfo.id, Privilege.Enum.成员, userId)"
                 color="#7365ff">移除权限</el-button>

                <el-button color="#7365ff">查看主页</el-button>

              </div>
            </div>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 房间内：聊天面板和播放器面板 -->
    <div class="tabBox">
      <el-tabs v-model="currentRoomState" type="card" class="room-tabs">
        <el-tab-pane label="音乐" :name="RoomStatus.MUSIC" add-icon>
          <template #label><span class="custom-tabs-label"><el-icon><Headset/></el-icon></span></template>
        </el-tab-pane>
        <el-tab-pane label="歌单" :name="RoomStatus.LIST" add-icon>
          <template #label><span class="custom-tabs-label"><el-icon><List /></el-icon></span></template>
        </el-tab-pane>
        <el-tab-pane label="聊天" :name="RoomStatus.CHAT" add-icon>
          <template #label><span class="custom-tabs-label"><el-icon><ChatLineRound/></el-icon></span></template>
        </el-tab-pane>
      </el-tabs>
    </div>
   
    <!-- 播放器面板 -->
    <div class="line musicPanel" v-show="currentRoomState==RoomStatus.MUSIC">
      <div class="musicZone">
        <img src="" alt="" class="cd">
      </div>
    </div>

    <!-- 音乐列表面板 -->
    <div class="line listPanel" v-show="currentRoomState==RoomStatus.LIST">
      <div class="listZone">

          <ul class="songUl">
            <li :class="[
                  'songLi', 
                  selectedIndex == i ? 'select' : '', 
                  HasRoomAdminPower(myUserInfo) ? 'admin' : ''
              ]"
              v-for="(songContent, i) in songContentList" @click="(event) => selectSong(event,songContent,i)">
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
              <AudioUploader :user-id="userId" :room-code="roomData.roomCode"/>
          </li>
      </div>
      
    </div>

    <!-- 聊天面板 -->
    <div class="line chatPanel" v-show="currentRoomState==RoomStatus.CHAT">
      <div class="chatZone">
        <div :class="msg.userInfo.id==userId?'msgbox me':'msgbox'" v-for="msg in msgList">
          <img :src="msg.userInfo.avatarUrl" alt="avator" class="avator">
          <div class="side">
            <div :class="msg.userInfo.id==userId?'name me':'name'"> {{ msg.userInfo.username }}</div>
            <div class="msg">{{ msg.msg }}</div>
          </div>
        </div>
      </div>
    </div>

    <!--底部通用 播放器-->
    <div class="musicPlayer">
      
    </div>
    <!--底部通用 聊天输入框-->
    <div class="line send">
      <el-input v-model="textToSend" placeholder="聊天对话..." @keyup.enter="broadcast_sayInRoom()"/>
      <el-button class="btn_join" type="primary" @click="broadcast_sayInRoom()" 
        color="#7365ff" :icon="Promotion"/>
    </div>

    

  </div>

</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted} from 'vue'
import { ArrowLeft, Promotion} from '@element-plus/icons-vue'
import { roomCreate,isUserInRoom,roomJoin,roomExit,roomMember,roomOwnerTransPrivilege,roomMemberPrivilege,roomSongContentList, roomSongRemove} from '@/api/room'
import { userRoomInfo, getPrivilegeName, HasOwnerPower, HasRoomAdminPower} from '@/api/user'
import { getSongBlob, getSongFile } from '@/api/song'
import { formatDuration, formatBytes, copyToClipboard } from '@/util/commonUtil'

import useCurrentInstance from "@/hooks/useCurrentInstance";
import { Room } from '@/interface/room'
import { Privilege, User } from '@/interface/user'
import { WebSocketService } from '@/util/webSocketService';
import { websocketRoot } from '@/util/webConst';
import { Client, IMessage } from '@stomp/stompjs';
import { TabsPaneContext } from 'element-plus';
import { Song } from '@/interface/song';
import {downloadWithAxios} from '@/util/request'
import { PlayerData } from '@/interface/playerData'
import AudioUploader from '@/components/audioUploader.vue'
import { Events } from 'xgplayer'
import { eventBus,MEventTypes } from '@/util/eventBus'


const { globalProperties } = useCurrentInstance();

//room、user's data
const userId = Number(localStorage.getItem("userid"))
const myUserInfo = ref<User.UserInfo>({
  id: 0,
  username: '',
  avatarUrl: ''
})
const roomCode_join = ref('');
const roomData = ref<Room.Room>({
  id: 0,
  roomName: '',
  ownerId: 0,
  maxUsers: 0,
  currentUsers: 0,
  roomCode: '',
  createdAt: '',
  isActive: 0
})
const userInfoList = ref<User.UserInfo[]>()
const songContentList = reactive<Song.SongContent[]>([])
const selectedIndex = ref<number>(-1)
const textToSend = ref<string>()
const msgList = ref<Room.RoomMsg[]>([])

//页面当前状态
enum PageStatus {
  WAIT_FOR_ROOM = 0,
  IN_ROOM = 1,
}
enum RoomStatus {
  CHAT = 0,
  MUSIC = 1,
  LIST = 2,
}
const currentPageState = ref(PageStatus.WAIT_FOR_ROOM)
const currentRoomState = ref(RoomStatus.MUSIC)
//进入页面调用
//进入页面需要初始化 用户信息、歌单信息、开启ws连接、注册播放器监听
const setPageState = (pageState:PageStatus, _roomData?:Room.Room)=>{
  currentPageState.value = pageState
  switch (currentPageState.value) {
    case PageStatus.IN_ROOM: //进入房间
      if(_roomData){
        roomData.value = _roomData;
        roomCode_join.value = _roomData.roomCode;
        updateRoomUserInfo();//进入房间 刷新用户信息  
        updateSongContentInfo();//进入房间 刷新歌单信息  
        subscribeWebsocket()//开启WebSocket
        roomPlayerEventReg();  //监听播放器就绪事件
      }
      break;
    case PageStatus.WAIT_FOR_ROOM:
      roomCode_join.value = '';
      roomPlayerEventUnreg();  //清除播放器事件监听
      break;
    default:
      break;
  }
}

//生命周期
onMounted(() => {
  //进入页面 检测用户房间信息，有房间就进入房间页面
  userRoomInfo(userId).then(
    (res)=>{   
      switch (res.code) {
        case 20000://加入房间 用户信息、歌单信息、开启ws连接、注册播放器监听
          globalProperties?.$message.success(res.message)
          setPageState(PageStatus.IN_ROOM, res.oData)
          break;
        case 20002://没加入过房间
          globalProperties?.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
})
onUnmounted(()=>{
  if(wsService!==null){ //卸载WebSocket
    wsService.disconnect();
    wsService = null;
  }
  roomPlayerEventUnreg(); //清除播放器事件监听
})

//开启ws，订阅端点
let wsService:WebSocketService| null = null;
const subscribeWebsocket = () => {
  wsService = new WebSocketService(websocketRoot, userId, roomData.value.id);
  wsService.subscribe(`/topic/${roomData.value?.id}/receive`,receive_Msg_InRoom)
  wsService.subscribe(`/topic/${roomData.value?.id}/userInfoList`,receive_UserInfoList_InRoom)
  wsService.subscribe(`/topic/${roomData.value?.id}/songContentList`,receive_SongContentList_InRoom)
  wsService.subscribe(`/topic/${roomData.value?.id}/playerData`,receive_PlayerData_InRoom)
  //wsService.subscribe(`/user/${userId}/queue/${roomData.value?.id}/playerData`,receive_PlayerData_InRoom)
  wsService.connect();
}

//websocket消息转发方法
//发送消息
const broadcast_sayInRoom = () => {
  if(textToSend.value == ""||textToSend.value==undefined) {
    globalProperties?.$message.closeAll()
    globalProperties?.$message.info("请输入聊天内容！");
    return
  }
  console.log("-<<<(((房间内广播_用户发言)))>>>---");
  wsService?.sendMessage(`/app/${roomData.value?.id}/${userId}/say`, textToSend.value);
  textToSend.value = "";
}
//播放器状态更改(需要管理员权限)
const broadcast_playerStatusChangeInRoom = (playerData:PlayerData) => {
  if(playerData == null||playerData==undefined) 
    return
  if(!HasRoomAdminPower(myUserInfo.value))
    return
  console.log("send_pdata:",playerData);
  wsService?.sendMessage(`/app/${roomData.value?.id}/${userId}/change/playerStatus`, JSON.stringify(playerData));
}
//订阅
//订阅 房间内消息更新 /topic/房间id/receive
const receive_Msg_InRoom = (msg:IMessage)=>{
  let roomMsg = JSON.parse(msg.body) as Room.RoomMsg
  msgList.value?.push(roomMsg)
}
//订阅 用户列表更新 /topic/房间id/userInfoList
const receive_UserInfoList_InRoom = (msg:IMessage)=>{
  let _userInfoList = JSON.parse(msg.body) as User.UserInfo[]
  updateUserInfoList(_userInfoList)
}
//订阅 歌曲列表更新 /topic/房间id/songContentList
const receive_SongContentList_InRoom = (msg:IMessage)=>{
  let _songContentList = JSON.parse(msg.body) as Song.SongContent[]
  updateSongContentList(_songContentList)
}
//订阅 播放器状态更新 /topic/房间id/playerData  (需要排除广播到自己)
const receive_PlayerData_InRoom = (msg:IMessage)=>{
  
  console.log("上锁上锁上锁上锁上锁上锁上锁");
  
  //console.log(msg);
  
  let _playerData = JSON.parse(msg.body) as PlayerData
  
  //排除自己发的
  if(_playerData.srcUserId == userId)
    return
  globalProperties?.$GoPlayer.b_lock();//上锁。
  console.log("🎵播放器状态更新👉");
  updateMyPlayerData(_playerData);
}


//http方法
const createNewRoom = ()=>{
  roomCreate({userId: userId}).then(
    (res)=>{   
      switch (res.code) {
        case 20000:
          globalProperties?.$message.success(res.message)
          setPageState(PageStatus.IN_ROOM, res.oData)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const joinNewRoom = ()=>{
  if(roomCode_join.value==undefined||roomCode_join.value=="")
    return
  roomJoin(roomCode_join.value, {userId: userId}).then((res)=>{   
      switch (res.code) {
        case 20000:
          globalProperties?.$message.success(res.message)
          setPageState(PageStatus.IN_ROOM, res.oData)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const exitRoom = ()=>{
  if(roomCode_join.value==undefined) return
  roomExit(roomCode_join.value, userId).then(
    (res)=>{   
      switch (res.code) {
        case 20000:
          globalProperties?.$message.success(res.message)
          setPageState(PageStatus.WAIT_FOR_ROOM)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const updateRoomUserInfo = () => {
  if(roomCode_join.value==undefined) return
  roomMember(roomCode_join.value).then(
      (res)=>{   
      switch (res.code) {
        case 20000:
          updateUserInfoList(res.oData)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const updateSongContentInfo = () => {
  if(roomCode_join.value==undefined) return
  roomSongContentList(roomCode_join.value).then(
      (res)=>{   
      switch (res.code) {
        case 20000:
          updateSongContentList(res.oData)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const removeSong = (songId:number) => {
  if(songId==undefined || songId<0 || songId == null) return ""
  roomSongRemove(roomCode_join.value, songId, {userId: userId}).then(
      (res)=>{   
      switch (res.code) {
        case 20000:
          globalProperties?.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const downloadSong = (songUrl:string) => {
  if(songUrl==undefined || songUrl=="" || songUrl == null) return ""
  getSongFile(songUrl)
}

//本地页面
const copyRoomCode = async () => {
  if(roomData.value==undefined) return
  //await navigator.clipboard.writeText(roomData.value.roomCode);
  copyToClipboard(roomData.value.roomCode);
  globalProperties?.$message.closeAll()
  globalProperties?.$message.info("房间代码已复制")
}
//更新用户列表用它
const updateUserInfoList = (_userInfoList:User.UserInfo[]) => {
  userInfoList.value = _userInfoList
  let myinfo = getMyUserInfoInList(userInfoList.value)
  if(myinfo!=undefined||myinfo!=null) 
    myUserInfo.value = myinfo
}
//更新歌曲列表用它
const updateSongContentList = (_songContentList:Song.SongContent[]) => {
  //console.log("songContent为",_songContentList);
  songContentList.length = 0
  for (const key in _songContentList) {
    songContentList[key] = _songContentList[key];
    // getSongBlob(songContentList[key].songUrl).then(
    // (res)=>{
    //   if(res)
      
    // },(err)=>{

    // });
  }
  globalProperties?.$GoPlayer.syncPlayList(_songContentList)
}
//在生命周期调用
const getMyUserInfoInList = (userInfoList:User.UserInfo[]):User.UserInfo|undefined => {
  return userInfoList?.find(userinfo => userinfo.id === userId);
}


//播放器相关 
//播放列表点击事件
const selectSong = (event: MouseEvent, songContent:Song.SongContent, i:number):void=>{
  event.stopPropagation();//防止事件向下传递
  //前端先检查 该歌曲是否已选中 && 浏览器用户是否有管理员房间权限
  if(i==selectedIndex.value) return;
  if(!HasRoomAdminPower(myUserInfo.value)) return;
  //根据方法构造歌曲状态
  let playerData:PlayerData = {
    index: i,
    url: "",
    curTime: 0,
    paused: false,
    srcUserId : userId,
    isExternal:false,
  };
  console.log("pdata:",playerData);
  
  //websocket转发歌曲状态
  //broadcast_playerStatusChangeInRoom(playerData);
  //浏览器更新播放器
  updateMyPlayerData(playerData);
}
//其他播放器回调事件统一注册、卸载
const roomPlayerEventReg = () => {
  console.log(globalProperties?.$GoPlayer.player);
  
  //播放
  globalProperties?.$GoPlayer.player?.on(Events.PLAY, () => {
    if(globalProperties?.$GoPlayer.is_b_locked()){
      console.log("播放被拦截，锁已解开");
      globalProperties?.$GoPlayer.b_unlock()
      return
    }
    selectedIndex.value = globalProperties?.$GoPlayer.player?.plugins.music.index;
    let _playerData:PlayerData = {
      index: globalProperties?.$GoPlayer.player?.plugins.music.index,
      url: "",
      curTime: globalProperties?.$GoPlayer.player?.currentTime,
      paused: false,
      srcUserId : userId,
      isExternal:true,
    };
    console.log("-<<<(((房间内广播_播放)))>>>---");
    broadcast_playerStatusChangeInRoom(_playerData);
  });
  //暂停
  globalProperties?.$GoPlayer.player?.on(Events.PAUSE, () => {
    if(globalProperties?.$GoPlayer.is_b_locked()){
      console.log("暂停被拦截，锁已解开");
      globalProperties?.$GoPlayer.b_unlock()
      return
    }
    let _playerData:PlayerData = {
      index: globalProperties?.$GoPlayer.player?.plugins.music.index,
      url: "",
      curTime: globalProperties?.$GoPlayer.player?.currentTime,
      paused: true,
      srcUserId : userId,
      isExternal:true,
    };
    console.log("-<<<(((房间内广播_暂停)))>>>---");
    broadcast_playerStatusChangeInRoom(_playerData);
  });
  //开始播放
  // globalProperties?.$GoPlayer.player?.on(Events.LOAD_START, () => {
    // if(globalProperties?.$GoPlayer.is_b_locked()){
    //   globalProperties?.$GoPlayer.b_unlock()
    //   return
    // }
  //   let _playerData:PlayerData = {
  //     index: selectedIndex.value,
  //     url: "",
  //     curTime: globalProperties?.$GoPlayer.player?.currentTime,
  //     paused: globalProperties?.$GoPlayer.isPaused()? false:true
  //   };
  //   broadcast_playerStatusChangeInRoom(_playerData);
  // });
  //时间调整
  globalProperties?.$GoPlayer.player?.on(Events.SEEKED, () => {
    if(globalProperties?.$GoPlayer.is_b_locked()){
      console.log("调时间被拦截，锁已解开");
      globalProperties?.$GoPlayer.b_unlock()
      return
    }
    let _playerData:PlayerData = {
      index: globalProperties?.$GoPlayer.player?.plugins.music.index,
      url: "",
      curTime: globalProperties?.$GoPlayer.player?.currentTime,
      paused: false,
      srcUserId : userId,
      isExternal:true,
    };
    console.log("-<<<(((房间内广播_调时间)))>>>---");
    broadcast_playerStatusChangeInRoom(_playerData);
  });

}
const roomPlayerEventUnreg = () => {
  globalProperties?.$GoPlayer.player?.off(Events.PLAY, broadcast_playerStatusChangeInRoom)
  globalProperties?.$GoPlayer.player?.off(Events.PAUSE, broadcast_playerStatusChangeInRoom)
  globalProperties?.$GoPlayer.player?.off(Events.LOAD_START, broadcast_playerStatusChangeInRoom)
  globalProperties?.$GoPlayer.player?.off(Events.SEEKED, broadcast_playerStatusChangeInRoom)
}
//浏览器更新播放器状态
const updateMyPlayerData = (playerData:PlayerData):void=>{
  console.log(`浏览器加载第${playerData.index}首歌曲`);
  selectedIndex.value = playerData.index;
  globalProperties?.$GoPlayer.syncPlayerData(playerData);
}


</script>

<style scoped>
.content {
  margin-right: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: #434343;
  min-height: 88vh;
}
.content .line {
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 1vh 0;
  border-bottom: 1px solid #e9e9e9;
}
.content .line:nth-child(2) .btn_join {
  color: #fff;
  font-weight: 600;
  border-radius: 0 2vh 2vh 0;
}
.content .line:nth-child(2) .btn_join {
  border-radius: 0 2vh 2vh 0;
}
.content .line:nth-child(2) .el-input__wrapper{
  font-weight: bold;
  border-radius: 2vh 0 0 2vh;
}
.content .line:nth-child(2) .el-input__inner::placeholder{
  padding-left: 5px;
  font-weight: bold;
}

.content .line.top {
  justify-content: space-between;
  align-items: center;
  height: 3.5vh;
}
.content .line.userlist {
  justify-content: center;
  height: 7.5vh;
}
.content .tabBox {
  margin-left: 15px;
  margin-top: 1vh;
  height: 3vh;
  width: 100%;
  display: flex;
  align-items: flex-start;
  /* justify-content: center; */
}
.content .room-tabs /deep/ .el-tabs__item {
  color: #9790d5;
  display: flex;
  justify-content: space-around;
  font-size: 1.4vh;
  width: 20vw !important;
  /* width: 180px !important; */
  height: 3vh;
  padding: 0 !important;
  align-items: center;
  border-radius: 2vh 2vh .2vh .2vh;
}
.content .room-tabs /deep/ .el-tabs__item.is-active{
  color: #9790d5;
  display: flex;
  border: 0.01vh solid #fbedff;
  box-shadow: 0px -.7vh .2vh 0px rgb(101 95 156 / 30%) inset;
  align-items: flex-start;
  padding-top: .4vh !important;
  background-color: #f5f5f6;
} 
.content .room-tabs /deep/ .el-tabs__item:hover{
  color: #9790d5;
  font-weight: bold;
  transition: var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier), padding var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
}
.content .room-tabs > .el-tabs__content {
  padding: 3.2vh 3.2vw;
  font-size: 3.2vh;
  font-weight: 600;
}
.content .line.chatPanel {
  /* flex: 1; */
  height: 60vh;
  padding: 0;
}
.content .line.musicPanel {
  /* flex: 1; */
  height: 60vh;
  padding: 0;
}
.content .line.listPanel {
  /* flex: 1; */
  height: 60vh;
  padding: 0;
}
.content .line.send {
  align-items: center;
  position: fixed;
  box-sizing: border-box;
  padding: 1vh 2vw;
  padding-bottom: 1.7vh;
  bottom: 60px;
  width: calc(100vw - 91px);
  height: 6vh;
  bottom: 60px;
  left: 46px;
  background-color: white;
  border: 1px solid #f6e6f5;
  border-radius: 10vh;
  box-shadow: 0px -.7vh .2vh 0px rgb(101 95 156 / 30%) inset;
}

.roomInfo {
  margin-top: -1vh;
  margin-left: .5vh;
  display: flex;
  align-items: center;
  flex-direction: column;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}
.roomInfo>span:nth-child(1){
  font-size: 2vh;
  color: #4e4e4e;
  font-weight: bold;
}
.roomInfo>span:nth-child(2){
  margin-top: .2vh;
  margin-left: -.4vh;
  font-size: 1.2vh;
  color: #9f9f9f;
  display: flex;
  align-items: center;
}

.roomCode {
  margin-right: .4vh;
  line-height: 1;
  display: flex;
  align-items: center;
  font-size: 1.3vh;
}
.roomCode>i{
  cursor: pointer;
  margin-right: .2vh;
}

/* 在线用户框 */
.userDisplay_mini {
  cursor: pointer;
  position: relative;
  padding: .6vh;
  margin: 0 .5vh;
  height: 6.5vh;
  width: 6.5vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-radius: .5vh;
  /* border: 1px #e9e9e9 solid;
  background-color: #fdfdfd; */
  border: 0.01vh solid #fbedff;
  box-shadow: 0px -.7vh .2vh 0px rgb(101 95 156 / 30%) inset;
}
.userDisplay_mini>img{
  height: 4vh;
  width: 4vh;
  border-radius: 3vh;
  box-shadow: 0px 0px .4vh .1vh rgb(135 136 150 / 40%);
}
.userDisplay_mini>span{
  margin-top: .3vh;
  width: 8vh;
  line-height: 1.6vh;
  font-size: 1.1vh;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  text-align: center;
}
.permissionIcon {
  position: absolute;
  top: -.15vh;
  left: .2vh;
  padding: .1vh;
  font-size: 1.4vh;
  background-color: #ffffff;
  border-radius: 5vh;
  border: 1px #e9e9e9 solid;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.2);
}

/* 聊天面板 */
.chatZone {
  width: 100%;
  max-height: 64vh;
  overflow-y: auto;
  background-color: #f5f5f6;
  border-radius: 1vh;
  border: .1vh solid #e7e7e7;
  box-shadow: 0px -.7vh .2vh 0px rgb(128 125 155 / 20%) inset;
}
/* 发送的消息 */
.msgbox {
  margin: 1vh;
  display: flex;
  align-items: flex-start
}
.msgbox.me {
  flex-direction: row-reverse
}
.msgbox>.avator{
  margin-top: 0px;
  height: 3.2vh;
  width: 3.2vh;
  border-radius: 2.5vh;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, .3);
}
.msgbox .side {
  margin: 0 1vh;
  max-width: 87%;
}
.msgbox .side .name{
  margin: .2vh -.4vh;
  font-size: 1.2vh;
  color: gray;
}
.msgbox .side .name.me{
  display: flex;
  justify-content: flex-end;
}
.msgbox .side .msg{
  font-size: 1.4vh;
  background-color: #7365ff;
  color: white;
  padding: .8vh 1.4vh;
  border-radius: .8vh;
  word-wrap: break-word;
}

/* 音乐面板 */
.musicZone {
  width: 100%;
  max-height: 64vh;
  overflow-y: auto;
  background-color: #f5f5f6;
  border-radius: 1vh;
  border: .1vh solid #e7e7e7;
  box-shadow: 0px -.7vh .2vh 0px rgb(128 125 155 / 20%) inset;
}

/* 歌单面板 */
.listZone {
  padding: 0 1vh;
  padding-top: 1vh;
  width: 100%;
  max-height: 64vh;
  background-color: #f5f5f6;
  border-radius: 1vh;
  border: .1vh solid #e7e7e7;
  box-shadow: 0px -.7vh .2vh 0px rgb(128 125 155 / 20%) inset;
  overflow: hidden;
}
.listZone .listOutRange::-webkit-scrollbar{
  display: none;
}
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


/* 点头像的 用户弹出框 */
.playerInfoPanel {
  display: flex;
  flex-direction: column;
  border: .17vh solid #eae1ff;
  border-bottom: 1vh solid #abbccd;
  border-radius: 2vh;
  background-color: white;
  box-shadow: 1vh -5.4vh .7vh -5.7vh #511a3d inset;
  border-top: .1vh solid #eae5ff;
}
.playerInfoPanel .info {
  position: relative;
  display: flex;
  width: 20vh;
  height: 10vh;
  margin: 1vh;
  background-color: #dfdfdf;
  border-radius: 2vh;
  align-items: center;
}
.playerInfoPanel .info .avator{
  margin-left: .5vh;
  height: 6.2vh;
  width: 6.2vh;
  border-radius: 9.5vh;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, .3);
}
.playerInfoPanel .info .infoRight {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding-top: 1.5vh;
}
.playerInfoPanel .info .infoRight .userName {
  height: 2vh;
  line-height: 2vh;
  background-color: #7365ff;
  margin:.5vh;
  padding: 0 .5vh;
  border-radius: 5vh;
  color: white;
  font-size: 1.4vh;
  font-weight: bold;
}
.playerInfoPanel .info .infoRight .userPri {
  height: 2vh;
  line-height: 2vh;
  background-color: #5f626d;
  margin: -.2vh .5vh;
  padding: 0 .5vh;
  border-radius: 5vh;
  color: white;
  font-size: 1.4vh;
}
.playerInfoPanel .info .infoRight .userId {
  height: 2vh;
  line-height: 2vh;
  position: absolute;
  right: 1.2vh;
  bottom: 1vh;
  font-size: 2vh;
  color: #c6c6c6;
  font-family: Segoe UI Black;
  font-weight: bold;
}
.playerInfoPanel .btns {
  display: flex;
  height: 8vh;
  width: 22vh;
  flex-wrap: wrap;
}
.playerInfoPanel .btns>button {
  width: 9vh;
  height: 2.6vh;
  font-size: 1.3vh;
  line-height: 1.3vh;
  margin: 0vh .95vh;
  border: .2vh solid #aca6c7;
  background-color: #3c393c;
  font-family: 'NSimSun','Microsoft YaHei', sans-serif;
  font-weight: bold;
}
</style>

<style>
.el-button, .el-input__wrapper {
  box-sizing: border-box;
  color: #fff;
  font-weight: 600;
  border-radius: 4vh;
  font-size: 1.3vh;
  padding: .7vh 1.5vh;
  height: 3vh;
}
</style>