<template>
  <Goheader></Goheader>
  <main>
    <el-tabs :tab-position="tabPosition" type="border-card" class="demo-tabs">
      <el-tab-pane>
        <template #label><span class="custom-tabs-label"><el-icon><Promotion/></el-icon></span></template>
        <TabMyInfo></TabMyInfo>
      </el-tab-pane>
      <el-tab-pane>
        <template #label> <span class="custom-tabs-label"> <el-icon><HomeFilled/></el-icon></span></template>
        <TabRoom></TabRoom>
      </el-tab-pane>
      <el-tab-pane>
        <template #label><span class="custom-tabs-label"><el-icon><Menu/></el-icon></span></template>
        <TabMyPlaylist></TabMyPlaylist>
      </el-tab-pane>
      <el-tab-pane>
        <template #label><span class="custom-tabs-label"><el-icon><Tools/></el-icon></span></template>
        <TabSetting></TabSetting>
      </el-tab-pane>
    </el-tabs>
    <AudioConsole></AudioConsole>
    
  </main>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, onUpdated, onActivated, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router';
import { ResultCode, needDebugOutpot } from '@/util/webConst'

import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

import type { TabsInstance } from 'element-plus'
const tabPosition = ref<TabsInstance['tabPosition']>('left') //tab栏暂时设在左边

import TabMyInfo from './tabMyInfo.vue';
import TabRoom from './tabRoom.vue';
import AudioConsole from '@/components/audioConsole.vue';
import TabSetting from './tabSetting.vue';
import Goheader from '@/components/goheader.vue';
import TabMyPlaylist from './tabMyPlaylist.vue';


onMounted(()=>{
  if(needDebugOutpot)
    console.log(localStorage.getItem("token"));
})


</script>

<style scoped>
main {
  box-sizing: border-box;
  height: calc(calc(var(--i-window-height) - 6vh) - 1px);
  width: 100vw;
}

.out {
  display: flex;
  position: absolute;
  top: calc(100px + 35%);
  left: 50%;
  margin-left: -250px;
  margin-top: -200px;
}

.demo-tabs {
  height: 88vh;
}
.demo-tabs > .el-tabs__content {
  padding: 3vh;
  color: #6b778c;
  font-size: 3vw;
  font-weight: 600;
  text-align: center;
}
.demo-tabs .custom-tabs-label .el-icon {
  display: flex;
  height: 20px;
  font-size: 20px;
}
.el-tabs {
  height: calc(calc(var(--i-window-height) - 6vh) - 1px);
  --el-tabs-header-height: 60px;
  box-sizing: border-box;
}

:deep(.el-tabs--border-card>.el-tabs__content) {
    padding: 1vh;
}
:deep(.el-tabs--border-card>.el-tabs__header .el-tabs__item){
  padding: 0px 20px;
}


#mse {
  width: calc(100% - 0px) !important;
  position: fixed;
  bottom: 0vw;
  background: #a5a6c6c9;
  height: 50px;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  background: #363636;
  box-shadow: 0px -1.3vh .2vh 0px rgb(35 21 31 / 42%) inset;
  position: relative; /* 相对定位，确保文字在前面 */
  z-index: 1; /* 确保文本在渐变边框上方 */
  text-align: center;
}
:deep(#mse .xgplayer-controls) {
  height: 0;
}
:deep(#mse .xg-pos){
  box-sizing: border-box;
  padding: 0px 22px;
}
:deep(#mse .xgplayer-progress-btn) {
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
:deep(#mse .xgplayer-error){
  display: none;
}
:deep(#mse .xgplayer-progress-played){
  background: none;
  /* background: linear-gradient(-90deg, #7365ff 0%, #6456ff 100%); */
  animation: backgroundAnimation 10s linear infinite; /* 动画效果 */
}
:deep(#mse .xgplayer-slider){
  background: #5e5e5e;
  border-radius: 10px;
  border: 0.01vh solid #c7c4d6;
  box-shadow: 0px -.7vh .2vh 0px rgb(42 42 42 / 76%) inset;
}


:deep(#mse .xgplayer-bar){
  left: 12px;
  bottom: 16px;
  height: 68px;
}
:deep(#mse .xgplayer-drag){
    /* bottom: 14px; */
  background: #ffd1d1;
  max-height: 66px;
  /* border: 0.01vh solid #000000; */
  box-shadow: 0px 0.3vh 0.4vh 0px rgb(255 0 111 / 82%);
}
:deep(#mse .xgplayer-drag:after){
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
:deep(#mse .mse_btn) {
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
}

.gradient-border {
    padding: 2px;
    background-color: #ffffffff; /* 内部背景色，可以根据需要调整 */
    border-top-left-radius: 51px;
    border-top-right-radius: 51px;
    position: relative;
    border: 1px solid transparent; /* 设置 border 为透明以展示渐变效果 */
    /* background-image: linear-gradient(white, white), linear-gradient(45deg, red, yellow, green, cyan, blue, magenta, red); */
    background-origin: border-box; /* 确保背景从边框开始 */
    /*background-clip: content-box, border-box; *//* 确保背景只展示在内容框和边框上 */
    animation: backgroundAnimation 10s linear infinite; /* 动画效果 */

    width: calc(100% - 10px) !important;
    position: fixed;
    bottom: -4px;
    height: 50px;
    border-top-left-radius: 34px;
    border-top-right-radius: 34px;
    z-index: 1;
    text-align: center;
  }
  

  @keyframes gradient-border-animation {
    0% {
        background-position: 0% 0%;
    }
    100% {
        background-position: 100% 0%;
    }
  }
  @keyframes backgroundAnimation {
    0% {
      background-color: #ce9292;
    }
    14% {
      background-color: #ff27a1;
    }
    28% {
      background-color: #bb87ca;
    }
    42% {
      background-color: #6b92de;
    }
    57% {
      background-color: #4fa1a8;
    }
    71% {
      background-color: #6b92de;
    }
    85% {
      background-color: #ff27a1;
    }
    100% {
      background-color: #ce9292;
    }
  }
  @keyframes borderAnimation {
    0% {
        border-color: #ce9292;
    }
    14% {
        border-color: #ff27a1;
    }
    28% {
        border-color: #be99c9;
    }
    42% {
        border-color: #959fce;
    }
    57% {
        border-color: #4fa1a8;
    }
    71% {
        border-color: #959fce;
    }
    85% {
        border-color: #ff27a1;
    }
    100% {
        border-color: #ce9292; /* 重复开始颜色 */
    }
  }
</style>