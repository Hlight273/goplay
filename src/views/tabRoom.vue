<template>

  <!-- 加入房间页 -->
  <div class="content" v-show="currentPageState==PageStatus.WAIT_FOR_ROOM">
    <div class="line">
        <el-button class="village_btn" type="primary" @click="createNewRoom()" color="#7365ff">创建房间</el-button>
    </div>
    <div class="line">
        <el-input v-model="roomCode_join" placeholder="房间代码"/>
        <el-button class="btn_join village_btn" type="primary" @click="joinNewRoom()" color="#7365ff">
            加入房间<el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
    </div>
    <div class="empty-tip">
      <el-icon><InfoFilled /></el-icon>
      <span>创建或加入房间，开启你的共享音乐之旅吧！</span>
    </div>
  </div>

  <!-- 房间内页 -->
  <div class="content"  v-show="currentPageState==PageStatus.IN_ROOM">
    <div class="line top">
      <el-button class="btn_join village_btn" type="primary" @click="exitRoom()" color="#7365ff" :icon="ArrowLeft">
        离开房间
      </el-button>
      <div class="roomInfo" v-show="roomData">
        <span>{{ roomData?.roomName }}</span>
        <!-- 正常显示用户数量 -->
        <span v-if="!showDisconnectionAlert || !roomStore.myUserHasRoom()">
          <el-icon><Avatar /></el-icon>
          {{ roomData?.currentUsers }}/{{ roomData?.maxUsers }}
        </span>
        <!-- 断开连接提示 -->
        <span v-else class="disconnection-alert">
          <el-icon><WarningFilled /></el-icon>
          已断开连接
          <el-button class="black_oil_btn" size="small" type="primary" @click="GoPlayer.enterRoomMode();showDisconnectionAlert = false;">重连</el-button>
        </span>         
      </div>
      <div class="roomCode" v-show="roomData">
        <el-icon @click="copyRoomCode()"><CopyDocument color="#434343"/></el-icon>
        <span>{{ roomData?.roomCode }}</span>
      </div>
    </div>

    <TabRoomUserList 
      :user-info-list="userInfoList" 
      :my-user-info="myUserInfo" 
      :room-code="roomData?.roomCode || ''"
    />

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
       <!-- 保存歌单 -->
       <el-button 
          v-if="HasOwnerPower(myUserInfo)"
          type="primary" 
          size="small" 
          @click="saveAsPlaylist"
          :disabled="songContentList.length === 0"
          class="save-playlist-btn"
        >
          <el-icon><FolderAdd /></el-icon>
          <span>保存为歌单</span>  
        </el-button>
    </div>
   
    <!-- 播放器面板 -->
    <div class="line musicPanel" v-show="currentRoomState==RoomStatus.MUSIC">
      <div class="musicZone">
        <audioCdPlayer></audioCdPlayer>
      </div>
    </div>

    <!-- 音乐列表面板 -->
    <div class="line listPanel" v-show="currentRoomState==RoomStatus.LIST">
      <div class="listZone">
          <GoSongList 
          :my-user-info="myUserInfo" 
          :playlist-info="{...Playlist.playlistInfo_InitData, songContentList:songContentList}"
          :is-room-playlist="true"/>
      </div>
      
    </div>

    <!-- 聊天面板 -->
    <div class="line chatPanel" v-show="currentRoomState==RoomStatus.CHAT">
      <div class="chatZone">
        <div :class="msg.userInfo.id==userId?'msgbox me':'msgbox'" v-for="msg in msgList">
          <img :src="msg.userInfo.avatarUrl" alt="avator" class="avator">
          <div class="side">
            <div :class="msg.userInfo.id==userId?'name me':'name'"> {{ msg.userInfo.nickname }}</div>
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
      <el-button class="village_btn" type="primary" @click="broadcast_sayInRoom()" 
        color="#7365ff" :icon="Promotion"/>
    </div>



  
</div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted} from 'vue'
import { ArrowLeft, Promotion, FolderAdd, InfoFilled, WarningFilled} from '@element-plus/icons-vue'
import { ElMessageBox, type DropdownInstance, ElMessage } from 'element-plus'

import { IMessage } from '@stomp/stompjs';

import { roomCreate,roomJoin,roomExit,roomMember,roomSongContentList, roomSongRemove, saveRoomSongsAsPlaylist} from '@/api/room'
import { userRoomInfo, getPrivilegeName, HasOwnerPower, HasRoomAdminPower} from '@/api/user'
import { Room } from '@/interface/room'
import { User } from '@/interface/user'
import { Song } from '@/interface/song';
import { PlayerData } from '@/interface/playerData'
import { WebSocketService } from '@/util/webSocketService';
import { ResultCode, websocketRoot } from '@/util/webConst';
import {  copyToClipboard } from '@/util/commonUtil'


import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

import AudioCdPlayer from '@/components/audioCdPlayer.vue'
import GoSongList from '@/components/goSongList.vue'
import TabRoomUserList from '@/components/tabRoomUserList.vue'



//room、user's data
const userId = Number(localStorage.getItem("userid"))
const myUserInfo = ref<User.UserInfo>({...User.UserInfo_InitData})
import { useRoomStore } from "@/store/roomStore";
import { storeToRefs } from "pinia";
import { GoPlayer } from '@/util/XgPlayer';
import { Playlist } from '@/interface/playlist';
const roomStore = useRoomStore();
const roomCode_join = ref('');
const { roomCode, roomData } = storeToRefs(roomStore);
import { eventBus, MEventTypes } from '@/util/eventBus';

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
// 添加断开连接提示状态
const showDisconnectionAlert = ref(false);

//进入页面调用
//进入页面需要初始化 用户信息、歌单信息、开启ws连接、注册播放器监听
const setPageState = (pageState:PageStatus, _roomData?:Room.Room)=>{
  currentPageState.value = pageState
  switch (currentPageState.value) {
    case PageStatus.IN_ROOM: //进入房间
      if(_roomData){
        roomStore.enterRoom(_roomData);
        updateRoomUserInfo();//进入房间 刷新用户信息  
        updateSongContentInfo();//进入房间 刷新歌单信息  
        subscribeWebsocket();//开启WebSocket
        
        GoPlayer.enterRoomMode();
      }
      break;
    case PageStatus.WAIT_FOR_ROOM:
      roomStore.leaveRoom();
      
      GoPlayer.quitRoomMode();
      break;
    default:
      break;
  }
}


//生命周期
onMounted(() => {
  //进入页面 检测用户房间信息，有房间就进入房间页面
  eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged);
  userRoomInfo(userId).then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS://加入房间 用户信息、歌单信息、开启ws连接、注册播放器监听
          globalProperties?.$message.success(res.message)
          setPageState(PageStatus.IN_ROOM, res.oData)
          break;
        case ResultCode.EMPTY://没加入过房间
          globalProperties?.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
})
onUnmounted(()=>{
  eventBus.off(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged);
  if(wsService!==null){ //卸载WebSocket
    wsService.disconnect();
    wsService = null;
  }
  // roomPlayerEventUnreg(); //清除播放器事件监听
})
const handleModeChanged = (val: boolean) => {
  if (val) {
      if (wsService === null) {
        subscribeWebsocket();
      }
      showDisconnectionAlert.value = false;// 连接时隐藏提示
    } else {
      if (wsService !== null) {
        wsService.disconnect();
        wsService = null;
      }
       showDisconnectionAlert.value = true; // 断开连接时显示提示
    }
  }

let wsService:WebSocketService| null = null;
const subscribeWebsocket = () => {
  wsService = new WebSocketService(websocketRoot, userId, roomData.value.id, true);
  wsService.subscribe(`/topic/${roomData.value?.id}/receive`,receive_Msg_InRoom)
  wsService.subscribe(`/topic/${roomData.value?.id}/userInfoList`,receive_UserInfoList_InRoom)
  wsService.subscribe(`/topic/${roomData.value?.id}/songContentList`,receive_SongContentList_InRoom)
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



//http方法
const createNewRoom = ()=>{
  roomCreate({userId: userId}).then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:
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
        case ResultCode.SUCCESS:
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
  if(roomCode.value==undefined) return
  roomExit(roomCode.value, userId).then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:
          wsService?.disconnect();
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
  if(roomCode.value==undefined) return
  roomMember(roomCode.value).then(
      (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:
          updateUserInfoList(res.oData)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const updateSongContentInfo = () => {
  if(roomCode.value==undefined) return
  roomSongContentList(roomCode.value).then(
      (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:
          updateSongContentList(res.oData)
          break;
        default:
          break;
      }
    },(err)=>{

    });
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
  }
  globalProperties?.$GoPlayer.syncPlayList(_songContentList)
}
//在生命周期调用
const getMyUserInfoInList = (userInfoList:User.UserInfo[]):User.UserInfo|undefined => {
  return userInfoList?.find(userinfo => userinfo.id === userId);
}

// 添加保存歌单方法
const saveAsPlaylist = () => {
  if (!roomCode.value || songContentList.length === 0) return
  
  ElMessageBox.confirm(
    '是否将当前房间的歌曲保存为个人歌单？',
    '保存歌单',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    saveRoomSongsAsPlaylist(roomCode.value).then((res) => {
      if (res.code === ResultCode.SUCCESS) {
        ElMessage.success('歌单保存成功！')
      }
    })
  }).catch(() => {})
}


//播放器相关 
//播放列表点击事件

//浏览器更新播放器状态
const updateMyPlayerData = (playerData:PlayerData):void=>{
  console.log(`浏览器加载第${playerData.index}首歌曲`);
  selectedIndex.value = playerData.index;
  globalProperties?.$GoPlayer.syncPlayerData(playerData);
}


</script>

<style scoped>
/* 通用样式 */
.content {
  margin-right: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.content .line.top {
  justify-content: space-between;
  align-items: center;
  height: 3.5vh;
}

/* 房间信息 */
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

.roomInfo>span:nth-child(1) {
  font-size: 2vh;
  color: #4e4e4e;
  font-weight: bold;
}

.roomInfo>span:nth-child(2) {
  margin-top: .2vh;
  font-size: 1.2vh;
  color: #9f9f9f;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
}

.roomCode {
  margin-right: .4vh;
  line-height: 1;
  display: flex;
  align-items: center;
  font-size: 1.3vh;
}

.roomCode>i {
  cursor: pointer;
  margin-right: .2vh;
}

/* 面板区域 */
.tabBox {
  position: relative;
  margin-left: 15px;
  margin-top: 1vh;
  height: 3vh;
  width: 100%;
  display: flex;
  align-items: flex-start;
}

.content /deep/ .el-tabs--card>.el-tabs__header {
  height: 3.2vh;
}

.content .room-tabs /deep/ .el-tabs__item {
  color: #9790d5;
  display: flex;
  justify-content: space-around;
  font-size: 1.4vh;
  width: 20vw !important;
  height: 3vh;
  padding: 0 !important;
  align-items: center;
  border-radius: 2vh 2vh .2vh .2vh;
}

.content .room-tabs /deep/ .el-tabs__item.is-active {
  color: #9790d5;
  display: flex;
  border: 0.01vh solid #fbedff;
  box-shadow: 0px -.7vh .2vh 0px rgb(101 95 156 / 30%) inset;
  align-items: flex-start;
  padding-top: .4vh !important;
  background-color: #f5f5f6;
}

.content .room-tabs /deep/ .el-tabs__item:hover {
  color: #9790d5;
  font-weight: bold;
  transition: var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier), padding var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
}

/* 面板内容 */
.line.chatPanel,
.line.musicPanel,
.line.listPanel {
  height: 60vh;
  padding: 0;
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
  padding: 1vh 0;
}

/* 消息样式 */
.msgbox {
  margin: 1vh;
  display: flex;
  align-items: flex-start;
  transition: all 0.3s ease;
  animation: fadeIn 0.3s ease;
}

.msgbox.me {
  flex-direction: row-reverse;
}

.msgbox > .avator {
  margin-top: 0px;
  height: 3.2vh;
  width: 3.2vh;
  border-radius: 2.5vh;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, .3);
  border: 2px solid #ffffff;
}

.msgbox .side {
  margin: 0 1vh;
  max-width: 87%;
}

.msgbox .side .name {
  margin: .2vh -.4vh;
  font-size: 1.2vh;
  color: #666;
  font-weight: 500;
}

.msgbox .side .name.me {
  display: flex;
  justify-content: flex-end;
}

.msgbox .side .msg {
  font-size: 1.4vh;
  background-color: #7365ff;
  color: white;
  padding: .8vh 1.4vh;
  border-radius: .8vh;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  max-width: 100%;
}

.msgbox.me .side .msg {
  background-color: #9c90ff;
  border-top-right-radius: 0;
}

.msgbox:not(.me) .side .msg {
  background-color: #7365ff;
  border-top-left-radius: 0;
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

.listZone .listOutRange::-webkit-scrollbar {
  display: none;
}

/* 保存歌单按钮 */
.save-playlist-btn {
  right: .1vh;
  height: 2.4vh;
  width: 10vh;
  position: absolute;
  margin-right: 15px;
  padding: 0 1vh;
  font-size: 1.2vh;
  background-color: #7365ff;
  border-color: #7365ff;
  display: flex;
  align-items: center;
  gap: 0.3vh;
  border: 0.3vh solid #bbb1ff;
  box-shadow: 0px -1.7vh 0.2vh 0px rgb(136 73 112 / 44%) inset;
  align-items: flex-start;
  padding-top: 0.45vh !important;
  background-color: #b4b9ff;
  color: #ffffff;
  height: 2.6vh;
}

.save-playlist-btn:hover {
  background-color: #a79dff;
  border-color: #c6c0ff;
}

.save-playlist-btn:disabled {
  background-color: #c0c4cc;
  border-color: #c0c4cc;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .save-playlist-btn {
    width: auto;
    padding: 0 0.8vh;
  }
  .save-playlist-btn span {
    display: none;
  }
  .save-playlist-btn .el-icon {
    margin-right: 0;
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style>
/* 全局样式 */
.el-button, .el-input__wrapper {
  box-sizing: border-box;
  color: #fff;
  font-weight: 600;
  border-radius: 4vh;
  font-size: 1.3vh;
  padding: .7vh 1.5vh;
  height: 3vh;
}

/* 断开连接提示 */
.disconnection-alert {
  display: flex;
  align-items: center;
  color: #ff5722;
  font-weight: bold;
  animation: pulse 1.5s infinite;
  gap: 4px;
  width: 17vw;
  justify-content: center;
}

.disconnection-alert .el-icon {
  color: #ff5722;
}

.disconnection-alert .el-button {
  margin-left: 5px;
  padding: 2px 5px;
  height: auto;
  font-size: 1vh;
  line-height: normal;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}
</style>