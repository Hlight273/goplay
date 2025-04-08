<template>
  <header>
    <span class="logo">GOPLAY</span>
    <el-button class="logout_btn black_oil_btn" type="primary" @click="userLogout()" color="#333333">退出登录</el-button>
  </header>
</template>

<script setup lang="ts">
import { logout } from '@/api/user';
import { ResultCode } from '@/util/webConst';
import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

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
</script>

<style scoped>
header {
  display: flex;
    justify-content: flex-end;
    align-items: center;
    width: calc(100% - 0.1vh);
    height: 4.9vh;
    box-sizing: border-box;
    padding: .5vh;
    justify-content: space-between;
    box-shadow: 0px -3.4vh 0.4vh 0px rgb(24 9 20 / 71%) inset;
    padding-bottom: .8vh;
    background: linear-gradient(45deg, var(--start-color, #3e3e3e), var(--mid-color, #4a3e46), var(--end-color, #3e3e3e));
    border: .1vh solid var(--border-color, #652f2f);
    border-top: none;
    animation: headerAnimation 6s infinite ease-in-out;
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

@keyframes textFlow {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes headerAnimation {
  0% {
    --start-color: #2a2a2a;
    --mid-color: #332d33;
    --end-color: #2a2a2a;
    --border-color: #4a1f1f;
  }
  33% {
    --start-color: #2a2a33;
    --mid-color: #2d2a33;
    --end-color: #2d2a33;
    --border-color: #1f2d4a;
  }
  66% {
    --start-color: #332a2a;
    --mid-color: #2a3333;
    --end-color: #2a2a33;
    --border-color: #4a1f4a;
  }
  100% {
    --start-color: #2a2a2a;
    --mid-color: #332d33;
    --end-color: #2a2a2a;
    --border-color: #4a1f1f;
  }
}
</style>