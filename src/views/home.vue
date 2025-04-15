<template>
  <Goheader></Goheader>
  <main>
    <el-tabs v-model="activeTab" :tab-position="tabPosition" type="border-card" class="demo-tabs">

      <el-tab-pane name="recommend">
        <template #label>
          <el-tooltip content="推荐音乐" placement="right" :show-after="300">
            <div class="nav-item">
              <el-icon><Promotion/></el-icon>
              <span class="nav-text">推荐</span>
            </div>
          </el-tooltip>
        </template>
        <TabMain></TabMain>
      </el-tab-pane>

      <el-tab-pane name="room" v-if="token!=null">
        <template #label>
          <el-tooltip content="音乐房间" placement="right" :show-after="300">
            <div class="nav-item">
              <el-icon><HomeFilled/></el-icon>
              <span class="nav-text">房间</span>
            </div>
          </el-tooltip>
        </template>
        <TabRoom></TabRoom>
      </el-tab-pane>

    <el-tab-pane name="community" v-if="token!=null">
      <template #label>
        <el-tooltip content="音乐社区" placement="right" :show-after="300">
          <div class="nav-item">
            <el-icon><HelpFilled /></el-icon>
            <span class="nav-text">社区</span>
          </div>
        </el-tooltip>
      </template>
      <MusicVillage :current-tab="activeTab"></MusicVillage>
    </el-tab-pane>

    <el-tab-pane name="mbti">
      <template #label>
        <el-tooltip content="交友圈" placement="right" :show-after="300">
          <div class="nav-item">
            <el-icon><GobletSquareFull /></el-icon>
            <span class="nav-text">交友</span>
          </div>
        </el-tooltip>
      </template>
      <MusicMBTI :current-tab="activeTab" />
    </el-tab-pane>

    <el-tab-pane name="playlist" v-if="token!=null">
      <template #label>
        <el-tooltip content="我的歌单" placement="right" :show-after="300">
          <div class="nav-item">
            <el-icon><Menu /></el-icon>
            <span class="nav-text">歌单</span>
          </div>
        </el-tooltip>
      </template>
      <TabMyPlaylist></TabMyPlaylist>
    </el-tab-pane>

    <el-tab-pane name="admin" v-if="token!=null&&isAdmin(myUserinfo)">
      <template #label>
        <el-tooltip content="管理面板" placement="right" :show-after="300">
          <div class="nav-item">
            <el-icon><Histogram /></el-icon>
            <span class="nav-text">管理</span>
          </div>
        </el-tooltip>
      </template>
      <TabAdmin></TabAdmin>
    </el-tab-pane>

    <el-tab-pane name="setting" v-if="token!=null">
      <template #label>
        <el-tooltip content="设置" placement="right" :show-after="300">
          <div class="nav-item">
            <el-icon><Tools /></el-icon>
            <span class="nav-text">设置</span>
          </div>
        </el-tooltip>
      </template>
      <TabSetting></TabSetting>
    </el-tab-pane>

  </el-tabs>
  <AudioConsole></AudioConsole>
  <AudioPanel></AudioPanel>
  <UserPage v-if="token!=null"></UserPage>
  <CurrentPlaylist />
  <CharacterModel :current-tab="activeTab" v-if="token!=null"/>
    
  </main>
  <DissolveTransition 
    :isVisible="dissolveOn" 
    :backgroundType="'pureColor'" 
    :noiseTexture="require('@/assets/effect/disslove1.png')"/>

</template>

<script lang="ts" setup>
import { ref, onMounted, defineAsyncComponent} from 'vue'
import { needDebugOutpot } from '@/util/webConst'
import {isAdmin} from '@/api/user'

import type { TabsInstance } from 'element-plus'
const tabPosition = ref<TabsInstance['tabPosition']>('left') //tab栏暂时设在左边
import TabMain from './tabMain.vue';
import TabRoom from './tabRoom.vue';
import AudioConsole from '@/components/audioConsole.vue';
import TabSetting from './tabSetting.vue';
import Goheader from '@/components/goheader.vue';
import TabMyPlaylist from './tabMyPlaylist.vue';
import DissolveTransition from '@/components/dissolveTransition.vue';
import AudioPanel from '@/views/audioPanel.vue';
import UserPage from './userPage.vue';
import TabAdmin from './tabAdmin.vue'
const MusicVillage = defineAsyncComponent(() => import('./musicVillage.vue'))
const MusicMBTI = defineAsyncComponent(() => import('@/components/MusicMBTI.vue'))
import CharacterModel from '@/components/characterModel.vue'
import CurrentPlaylist from '@/components/currentPlaylist.vue'


import { useCommonStore } from "@/store/commonStore";
import { storeToRefs } from "pinia";

const commonStore = useCommonStore();
const { dissolveOn, curPlaylistOn, myUserinfo } = storeToRefs(commonStore);

const activeTab = ref('recommend');

const token = localStorage.getItem("token");

onMounted(()=>{
  commonStore.updateMyUserInfo();
  if(needDebugOutpot)
    console.log(token);
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
  --el-tabs-header-height: 40px;
  box-sizing: border-box;
}


  .nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 7px;
  transition: all 0.3s ease;
}

.nav-text {
  font-size: 13px;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s ease;
  white-space: nowrap;
  font-family: serif;
}

:deep(.el-tabs--border-card) {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs--border-card > .el-tabs__header) {
  background: linear-gradient(180deg, var(--el-color-primary-light-9), #ffffff);
  border: none;
}

:deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item) {
  border: none;
  margin: 1px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover) {
  background: var(--el-color-primary-light-8);
  .nav-text {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active) {
  background: var(--el-color-primary-light-7);
  color: #ffffff;
  .nav-text {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.el-tabs--left.el-tabs--border-card .el-tabs__item.is-left.is-active) {
  /* border: 2px solid #bdbeff;
    box-shadow: 0px -8px 2px 0px rgb(131 51 98 / 31%) inset;
    padding-bottom: 8px;
    background: #b3c1de;
    border-radius: 10px; */
    border: 2px solid #d8d8d8;
    box-shadow: 0px -6px 1px 0px rgb(63 6 50 / 49%) inset;
    padding-bottom: 5px;
    background: #35373b;
    border-radius: 10px;
    font-weight: bold;
}

:deep(.el-tabs--border-card > .el-tabs__header .el-tabs__nav){
  width: 100px;
}

/* 添加媒体查询，针对移动设备优化侧边栏 */
@media screen and (max-width: 768px) {
  :deep(.el-tabs--border-card > .el-tabs__header .el-tabs__nav) {
    width: 50px; /* 移动端减小宽度 */
  }
  
  .nav-item {
    justify-content: center;
    padding: 12px 0;
  }
  
  .nav-text {
    display: none; /* 移动端完全隐藏文字 */
  }
  
  :deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover) .nav-text,
  :deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active) .nav-text {
    display: none;
  }
  
  :deep(.el-tabs--left.el-tabs--border-card .el-tabs__item.is-left.is-active) {
    padding: 12px 16px;
  }
}

.demo-tabs .custom-tabs-label .el-icon {
  font-size: 20px;
  transition: all 0.3s ease;
}
</style>