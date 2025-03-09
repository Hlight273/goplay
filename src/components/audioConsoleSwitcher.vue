<template>
  <button v-show="roomStore.myUserHasRoom() && !isDarkCDMode" @click="toggleGoplayerMode" class="toggle-btn">
    <el-icon v-show="isRoomMode"><HomeFilled /></el-icon>
    <el-icon v-show="!isRoomMode"><Service /></el-icon>
  </button>

  <button v-show="!isRoomMode" class="toggle-btn" @click="dissolveOn=!dissolveOn;isDarkCDMode=!isDarkCDMode" :style="roomStore.myUserHasRoom()&&!isDarkCDMode?'bottom: 13vh;':''">
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
const { dissolveOn } = storeToRefs(commonStore);

const isDarkCDMode = ref(false);


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
    position: absolute;
    bottom: 7vh;
    right: 1vh;
  width: 4.4vh;
  height: 4.4vh;
  border-radius: 50%;
  border: none;
  background-color: #ffffff; /* 绿色，表示开启 */
  color: rgb(0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease-in-out, transform 0.2s;
  box-shadow: 0px .4vh .6vh rgba(0, 0, 0, 0.2);
  cursor: pointer;
  border: .3vh solid #aca6c7;
    background-color: #3c393c;
    color: white;
    z-index: 0;
    font-size: 1.4vh;
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
</style>