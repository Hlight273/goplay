<template>
  <header>
    <el-button class="logout_btn" type="primary" @click="userLogout()" color="#333333">退出登录</el-button>
  </header>
  <main>
    <el-tabs :tab-position="tabPosition" type="border-card" class="demo-tabs">
      <el-tab-pane>
        <template #label><span class="custom-tabs-label"><el-icon><UserFilled/></el-icon></span></template>
        <TabMyInfo></TabMyInfo>
      </el-tab-pane>
      <el-tab-pane>
        <template #label> <span class="custom-tabs-label"> <el-icon><HomeFilled/></el-icon></span></template>
        <TabRoom></TabRoom>
      </el-tab-pane>
      <el-tab-pane>
        <template #label><span class="custom-tabs-label"><el-icon><Setting/></el-icon></span></template>
        设置
      </el-tab-pane>
    </el-tabs>
  </main>
  
  <!-- <div class="out">
    
    
  </div> -->
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted} from 'vue'
import { logout } from '@/api/user'
import { ResultCode, needDebugOutpot } from '@/util/webConst'

import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

import type { TabsInstance } from 'element-plus'
const tabPosition = ref<TabsInstance['tabPosition']>('left') //tab栏暂时设在左边

import TabMyInfo from './tabMyInfo.vue';
import TabRoom from './tabRoom.vue';

const userLogout = ()=>{
  logout().then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:          
          localStorage.removeItem("token")
          globalProperties.$router.replace("/login")
          globalProperties.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

onMounted(()=>{
  if(needDebugOutpot)
    console.log(localStorage.getItem("token"));
})  
</script>

<style scoped>
header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  height: 5vh;
  box-sizing: border-box;
  padding: .5vh;
  box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.2);
}

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
</style>