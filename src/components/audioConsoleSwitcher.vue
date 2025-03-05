<template>
  <button @click="toggleGoplayerMode" class="toggle-btn">
    <el-icon v-show="isRoomMode"><HomeFilled /></el-icon>
    <el-icon v-show="!isRoomMode"><Service /></el-icon>
  </button>
</template>

<script lang="ts" setup>
import { eventBus, MEventTypes } from '@/util/eventBus';
import { GoPlayer } from '@/util/XgPlayer';
import { onMounted, onUnmounted, ref } from 'vue';

import { useRoomStore } from "@/store/roomStore";
import { storeToRefs } from "pinia";
import { isNothing } from '@/util/commonUtil';
const roomStore = useRoomStore();
const { roomCode } = storeToRefs(roomStore);

    const isRoomMode = ref(false);

    const toggleGoplayerMode = ()=>{
        if(isNothing(roomCode.value)) 
            GoPlayer.quitRoomMode();
        if (isRoomMode.value) {
            GoPlayer.quitRoomMode();
        } else {
            GoPlayer.enterRoomMode();
        }
    }

    onMounted(() => {
        eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, (val:boolean) => { 
            isRoomMode.value = val;
        });
    });

    onUnmounted(() => {
        eventBus.off(MEventTypes.GOPLAYER_MODE_CHANGED);
    });
    
</script>

<style>
.toggle-btn {
    position: absolute;
    bottom: 7vh;
    right: 1vh;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: #ffffff; /* 绿色，表示开启 */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease-in-out, transform 0.2s;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
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