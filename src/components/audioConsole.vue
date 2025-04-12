<template>
    <div class="mse_outline">
        <div :class="['gradient-border',!isRoomMode?'redStyle':'']">
            <div id="mse_room" class="mse" v-show="isRoomMode"></div>
            <div id="mse_local" class="mse" v-show="!isRoomMode"></div>
            <AudioConsoleSwitcher/>
           
        </div>
    </div>

    <div v-show="locked" style="position: fixed; top: 44%; left: 47%;">
      <img :src="require('@/assets/icons/lock.png')" alt="">
    </div>

    
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, Ref } from 'vue'
import { GoPlayer } from '@/util/XgPlayer';
import AudioConsoleSwitcher from './audioConsoleSwitcher.vue';

import { useRoomStore } from "@/store/roomStore";
import { storeToRefs } from "pinia";
const roomStore = useRoomStore();
const { isRoomMode } = storeToRefs(roomStore);



const currentTime = ref(new Date().toLocaleTimeString());

let locked:Ref<any> = ref();

onMounted(()=>{
  //初始化播放器 绑定到home页面的mse上
  console.log("\n");
  console.log("🎵播放器已挂载🎵");
  GoPlayer.getInstance().registerPlayer4room("mse_room")
  GoPlayer.getInstance().registerPlayer4local("mse_local")

  locked = ref(GoPlayer.broadcast_lock)
  let timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString();
    //console.log(GoPlayer.broadcast_lock);
  }, 1);
}) 
onUnmounted(()=>{
  GoPlayer.getInstance().destroy();
})


</script>

<style scoped>
.mse {
  width: calc(100% - 0px) !important;
  position: fixed;
  bottom: 0vw;
  background: #a5a6c6c9;
  height: 50px;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  background: #302f36;
  box-shadow: 0px -1.3vh .2vh 0px rgb(0 0 0 / 42%) inset;
  position: relative; /* 相对定位，确保文字在前面 */
  z-index: 1; /* 确保文本在渐变边框上方 */
  text-align: center;
}
:deep(.mse .xgplayer-controls) {
  height: 0;
}
:deep(.mse .xg-pos){
  box-sizing: border-box;
  padding: 0px 22px;
}
:deep(.mse .xgplayer-progress-btn) {
  display: block;
  background: rgba(231, 232, 255, 0.304);
  border: .5px solid rgba(255, 94, 94, .056545);
  box-shadow: 0 0 1px #a09bcc62;
  width: 20px;
  height: 20px;
  border-radius: 30px;
  left: 0;
  top: 50%;
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  pointer-events: none;
}
:deep(.mse .xgplayer-error){
  display: none;
}



:deep(.mse .xgplayer-slider){
  background: #5e5e5e;
  border-radius: 10px;
  border: 0.01vh solid #c7c4d6;
  box-shadow: 0px -.7vh .2vh 0px rgb(42 42 42 / 76%) inset;
}


:deep(.mse .xgplayer-bar){
  left: 12px;
  bottom: 16px;
  height: 68px;
}
:deep(.mse .xgplayer-drag){
    /* bottom: 14px; */
  background: #ffd1d1;
  max-height: 66px;
  /* border: 0.01vh solid #000000; */
  box-shadow: 0px 0.3vh 0.4vh 0px rgb(255 0 111 / 82%);
}
:deep(.mse .xgplayer-drag:after){
  content: " ";
    display: inline-block;
    width: 6px;
    height: 4px;
    background: #f4f4f4;
    box-shadow: 0 0 5px #00000042;
    position: absolute;
    border-radius: 28%;
    left: -1px;
    top: -4px;
    /* box-shadow: 0px 0.3vh 0.4vh 0px rgb(141 141 141 / 63%); */
    /* border: 1px solid #5d4f4f; */
    box-shadow: 0px .1vh 1.2vh 2px #ff6d8470;
}
:deep(.mse .mse_btn) {
  width: 40px;
  height: 40px;
}

.mse_outline {
  border: 3px solid #3e3e3eba;
  width: calc(100% - 5px) !important;
  position: fixed;
  bottom: -2px;
  height: 50px;
  border-top-left-radius: 36px;
  border-top-right-radius: 35px;
  z-index: 666; /* 确保文本在渐变边框上方 */
}

/* 进度条颜色 */
:deep(.mse .xgplayer-progress-played){
  background: none;
  /* background: linear-gradient(-90deg, #7365ff 0%, #6456ff 100%); */
  animation: backgroundDarkAnimation 3s linear infinite;
  animation-delay: var(--animation-delay);
}
:deep(#mse_local .xgplayer-progress-played){
  background: #ff4343;
  animation: none;
  /* background: linear-gradient(-90deg, #7365ff 0%, #6456ff 100%); */
  
}

.gradient-border {
    padding: 2px;
    background-color: #ffffffff;
    border-top-left-radius: 51px;
    border-top-right-radius: 51px;
    position: relative;
    border: 1px solid transparent;
    background-origin: border-box;
    animation: backgroundDarkAnimation 3s linear infinite;
    animation-delay: var(--animation-delay);

    width: calc(100% - 10px) !important;
    position: fixed;
    bottom: -4px;
    height: 50px;
    border-top-left-radius: 34px;
    border-top-right-radius: 34px;
    z-index: 1;
    text-align: center;
  }
  .redStyle {
    animation: backgroundRedAnimation 3s linear infinite; /* 动画效果 */
    background-color: #b74343;
  }

  /* 下一首用的不是我的api 故直接删除*/
  :deep(#mse_local .xgplayer-next){
    display: none;
  }
  

  
  
</style>