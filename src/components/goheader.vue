<template>
  <header class="black_flowing_panel">
    <span class="logo">GOPLAY</span>
    <div class="header-right">
      <DownloadQueue />
      <el-button v-if="ls.getItem('token')!=null" class="logout_btn black_oil_btn" type="primary" @click="userLogout()" color="#333333">退出登录</el-button>
      <el-button v-else class="logout_btn black_oil_btn" type="primary" @click="goLog()" color="#333333">注册&登录</el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { logout } from '@/api/user';
import { ResultCode } from '@/util/webConst';
import useCurrentInstance from "@/hooks/useCurrentInstance";
import DownloadQueue from './DownloadQueue.vue';
const { globalProperties } = useCurrentInstance();
const ls = localStorage;
const userLogout = ()=>{
  logout().then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:          
          localStorage.removeItem("token")
          globalProperties?.$router.replace("/login")
          globalProperties?.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
}

const goLog = ()=>{
  globalProperties?.$router.replace("/login")
}
</script>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: calc(100%);
  height: 4.9vh;
  box-sizing: border-box;
  padding: .5vh;
  box-shadow: 0px -3.4vh 0.4vh 0px rgb(24 9 20 / 71%) inset;
  padding-bottom: .8vh;
  border: .1vh solid var(--border-color, #652f2f);
  border-top: none;

  position: relative;
  z-index: 666;
}

.header-right {
  display: flex;
  align-items: center;
}

header .logo {
  margin-left: 1.2vh;
  font-size: 2.2vh;
  font-family: ui-monospace;
  font-weight: bold;
  background: linear-gradient(90deg, 
    #ff4759, 
    #ff7272, 
    #f27e95, 
    #ff98b9, 
    #ff6565);
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: textFlow 8s linear infinite;
  text-shadow: 0vh 0vh .33vh #ff6079;
}
</style>