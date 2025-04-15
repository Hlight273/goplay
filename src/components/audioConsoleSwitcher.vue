<template>
  <button class="link_btn" v-show="roomStore.myUserHasRoom() && !isDarkCDMode" 
         @click="toggleGoplayerMode"
         :class="{'room-mode': isRoomMode}"
         :title="isRoomMode ? '点击切换到单人模式' : '点击切换到房间模式'">
    <el-icon><HomeFilled /></el-icon>
    <span class="mode-text">{{ isRoomMode ? '房间模式中' : '单人模式中' }}</span>
  </button>

  <button class="playlist_btn" v-show="!isRoomMode" @click="togglePlaylist">
    <el-icon><List /></el-icon>
    <span class="mode-text">当前歌单</span>
  </button>

  <button class="toggle-btn" :class="{'btn-down': isDarkCDMode}" v-show="!isRoomMode" @click="dissolveOn=!dissolveOn;isDarkCDMode=!isDarkCDMode">
    <el-icon v-show="!isDarkCDMode"><CaretTop /></el-icon>
    <el-icon v-show="isDarkCDMode"><CaretBottom /></el-icon>
  </button>
</template>

<script lang="ts" setup>
import { GoPlayer } from '@/util/XgPlayer';

import { useRoomStore } from "@/store/roomStore";
import { storeToRefs } from "pinia";
const roomStore = useRoomStore();
const { roomCode,isRoomMode } = storeToRefs(roomStore);

import { useCommonStore } from "@/store/commonStore";
import { ref } from 'vue';

const commonStore = useCommonStore();
const { dissolveOn, curPlaylistOn } = storeToRefs(commonStore);

const isDarkCDMode = ref(false);


const togglePlaylist = () => {
  curPlaylistOn.value = !curPlaylistOn.value;
}

const toggleGoplayerMode = ()=>{
    console.log("isroommode",isRoomMode.value,"roomcode",roomCode.value);
    
    if(!roomStore.myUserHasRoom()) {
        console.log("没有房间");
        
        GoPlayer.quitRoomMode();
        return;
    }
       
    if (isRoomMode.value) {
        GoPlayer.quitRoomMode();
    } else {
        GoPlayer.enterRoomMode();
    }
}
</script>

<style>
.toggle-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  z-index: 0;
  bottom: 52px;
  right: calc(50% - 8.5vh);
  width: 16vh;
  height: 2.4vh;
  transition: all 0.3s ease-in-out;
  background: #302f36;
  color: white;
  font-size: 1.4vh;
  border: .3vh solid #be4242;
  border-bottom: none;
  border-top-left-radius: 150px 100px;
  border-top-right-radius: 150px 100px;
}
.toggle-btn:not(.btn-down):hover {
  transform: translateY(-0.8vh) scale(1.2);
  bottom: 44px;
}

.toggle-btn:not(.btn-down):active {
  transform: translateY(-0.3vh) scale(0.95);
}

.toggle-btn.btn-down:hover {
  transform: translateY(0.5vh) scale(1.1);
}

.toggle-btn.btn-down:active {
  transform: translateY(0.3vh) scale(0.95);
}

.toggle-btn[roomCode="true"] {
  background-color: #000000;
}


.toggle-btn:hover {
  transform: scale(1.1);
}

.toggle-btn:active {
  transform: scale(0.95);
}

.toggle-btn[roomCode="true"] {
  background-color: #000000; /* 红色，表示退出 */
}

.link_btn {
  height: 3.2vh;
    position: fixed;
    top: 4.9vh;
    right: calc(3% - 0px);
    min-width: 100px;
    padding: 0 1vh;
    transition: all 0.3s ease-in-out;
    box-shadow: 0px -0.2vh 0.1vh rgb(69 76 221 / 62%) inset;
    cursor: pointer;
    background-color: #262626;
    color: white;
    line-height: 3.8vh;
    display: flex
;
    align-items: center;
    border: none;
    border-radius: 0 0 2.4vh 2.4vh;
    justify-content: space-evenly;
    border: 3px solid #6a666c;
    border-top: none;
}

/* 曲线 */
.link_btn::before {
  content: '';
    position: absolute;
    top: -14px;
    left: 0;
    right: 0;
    height: 15px;
    background-color: #262626;
    transition: all 0.3s ease-in-out;
    clip-path: path('M 0 15 C 35 15, 35 8, 50 8 C 65 8, 65 15, 100 15 L 100 15 L 0 15');
}

.link_btn:hover {
    transform: translateY(-0.2vh);
    background-color: #4a4a4a;
    border: 3px solid #525252;
    border-top: none;
}

.link_btn.room-mode {
  background:linear-gradient(90deg, #be4242, #ff5757, #be42af, #8960a4, #c67285, #be4242);
    background-size: 200% auto;
    animation: roomModeFlow 3s linear infinite;
    border: 3px solid #ffbaba;
    border-top: none;
    box-shadow: 0px -0.2vh 0.1vh rgb(231 186 217 / 62%) inset;
}

.link_btn.room-mode::before,
.link_btn.room-mode::after {
    background:linear-gradient(90deg, #be4242, #ff5757, #be42af, #8960a4, #c67285, #be4242);
    background-size: 200% auto;
    animation: roomModeFlow 3s linear infinite;
    box-shadow: 0px 0.7vh 0.3vh rgb(28 84 66 / 74%) inset;
}

.link_btn .mode-text {
    font-size: 1.2vh;
    white-space: nowrap;
}

.link_btn .el-icon {
    font-size: 1.4vh;
}

.playlist_btn {
    height: 2.4vh;
    position: fixed;
    bottom: 49px;
    right: 80px;
    min-width: 100px;
    padding: 0 1vh;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    background: #302f36;
    color: white;
    line-height: 2.8vh;
    display: flex;
    align-items: center;
    border: none;
    justify-content: space-evenly;
    border: .3vh solid #be4242;
    border-bottom: none;
    border-top-left-radius: 100px;
    border-top-right-radius: 100px;
    z-index: 1001;
}

.playlist_btn:hover {
    transform: scale(1.01);
    background-color: #4a4a4a;
    border: 3px solid rgb(255, 55, 55);
    border-bottom: none;
}

.playlist_btn .mode-text {
    font-size: 1.2vh;
    white-space: nowrap;
}

.playlist_btn .el-icon {
    font-size: 1.4vh;
}

@media  screen and (max-width: 480px) {
  .playlist_btn {
    right: 27px;
    min-width: 45px;
  }
  .playlist_btn .mode-text{
    display: none;
  }
}
</style>