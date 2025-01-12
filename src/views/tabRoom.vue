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
        <el-tab-pane label="聊天" :name="RoomStatus.CHAT" add-icon>
          <template #label><span class="custom-tabs-label"><el-icon><ChatLineRound/></el-icon></span></template>
        </el-tab-pane>
      </el-tabs>
    </div>
   
    <!-- 播放器面板 -->
    <div class="line musicPanel" v-show="currentRoomState==RoomStatus.MUSIC">
      <div class="musicZone">
      
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

    

    <div class="line send">
      <el-input v-model="textToSend" placeholder="聊天对话..." @keyup.enter="sayInRoom()"/>
      <el-button class="btn_join" type="primary" @click="sayInRoom()" 
        color="#7365ff" :icon="Promotion"/>
    </div>

  </div>

</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted} from 'vue'
import { ArrowLeft, Promotion} from '@element-plus/icons-vue'
import {roomCreate,isUserInRoom,roomJoin,roomExit,roomMember,roomOwnerTransPrivilege,roomMemberPrivilege} from '@/api/room'
import {userRoomInfo, getPrivilegeName, HasOwnerPower, HasRoomAdminPower} from '@/api/user'

import useCurrentInstance from "@/hooks/useCurrentInstance";
import { Room } from '@/interface/room'
import { Privilege, User } from '@/interface/user'
import { WebSocketService } from '@/util/webSocketService';
import { websocketRoot } from '@/util/webConst';
import { Client, IMessage } from '@stomp/stompjs';
import { TabsPaneContext } from 'element-plus';
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
const roomUserList = ref<User.UserInfo[]>()
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
}
const currentPageState = ref(PageStatus.WAIT_FOR_ROOM)
const currentRoomState = ref(RoomStatus.MUSIC)
const setPageState = (pageState:PageStatus, _roomData?:Room.Room)=>{
  currentPageState.value = pageState
  switch (currentPageState.value) {
    case PageStatus.IN_ROOM: //进入房间
      if(_roomData){
        roomData.value = _roomData;
        roomCode_join.value = _roomData.roomCode;
        updateRoomUserInfo();//进入房间 刷新用户信息  
        subscribeWebsocket()//开启WebSocket
      }
      break;
    case PageStatus.WAIT_FOR_ROOM:
      roomCode_join.value = '';
      break;
    default:
      break;
  }
}
const setRoomState = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}

//生命周期
onMounted(() => {
  //进入页面 检测用户房间信息，有房间就进入房间页面
  userRoomInfo(userId).then(
    (res)=>{   
      switch (res.code) {
        case 20000://加入过房间，并开启ws订阅
          globalProperties.$message.success(res.message)
          setPageState(PageStatus.IN_ROOM, res.oData)
          break;
        case 20002://没加入过房间
          globalProperties.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
})
onUnmounted(()=>{
  if(wsService!==null){
    wsService.disconnect();
    wsService = null;
  }
})

//开启ws，订阅端点
let wsService:WebSocketService| null = null;
const subscribeWebsocket = () => {
  wsService = new WebSocketService(websocketRoot);
  wsService.subscribe(`/topic/${roomData.value?.id}/receive`,receive_Msg_InRoom)
  wsService.subscribe(`/topic/${roomData.value?.id}/userInfoList`,receive_UserInfoList_InRoom)
  wsService.connect();
}

//websocket推送方法
//发送消息
const sayInRoom = () => {
  if(textToSend.value == ""||textToSend.value==undefined) {
    globalProperties.$message.closeAll()
    globalProperties.$message.info("请输入聊天内容！");
    return
  }
  wsService?.sendMessage(`/app/${roomData.value?.id}/${userId}/say`, textToSend.value);
  textToSend.value = "";
};
//订阅
//订阅 房间内消息更新 /topic/房间id/receive
const receive_Msg_InRoom = (msg:IMessage)=>{
  let roomMsg = JSON.parse(msg.body) as Room.RoomMsg
  msgList.value?.push(roomMsg)
}
//订阅 用户列表更新 /topic/房间id/userInfoList
const receive_UserInfoList_InRoom =  (msg:IMessage)=>{
  let _userInfoList = JSON.parse(msg.body) as User.UserInfo[]
  updateUserInfoList(_userInfoList)
}


//http方法
const createNewRoom = ()=>{
  roomCreate({userId: userId}).then(
    (res)=>{   
      switch (res.code) {
        case 20000:
          globalProperties.$message.success(res.message)
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
          globalProperties.$message.success(res.message)
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
          globalProperties.$message.success(res.message)
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

//本地页面
const copyRoomCode = async () => {
  if(roomData.value==undefined) return
  await navigator.clipboard.writeText(roomData.value.roomCode);
  globalProperties.$message.closeAll()
  globalProperties.$message.info("房间代码已复制")
}

const updateUserInfoList = (_userInfoList:User.UserInfo[]) => {
  userInfoList.value = _userInfoList
  let myinfo = getMyUserInfoInList(userInfoList.value)
  
  
  if(myinfo!=undefined||myinfo!=null) 
    myUserInfo.value = myinfo
}

const getMyUserInfoInList = (userInfoList:User.UserInfo[]):User.UserInfo|undefined => {
  return userInfoList?.find(userinfo => userinfo.id === userId);
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
  /* width: 20vw !important; */
  width: 180px !important;
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
.content .line.send {
  align-items: center;
  position: fixed;
  width: calc(100vw - 91px);
  bottom: 2vh;
  background-color: white;
  box-shadow: 0px 0px 0.2vh .1vh rgb(196 196 196 / 20%);
  box-sizing: border-box;
  padding: 1vh 2vw;
  border-radius: 10vh;
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