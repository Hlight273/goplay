<template>
  <header>
    <span class="logo">GOPLAY</span>
    <el-button class="logout_btn" type="primary" @click="userLogout()" color="#333333">退出登录</el-button>
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
  width: 100%;
  height: 5vh;
  box-sizing: border-box;
  padding: .5vh;
  justify-content: space-between;
  box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.2);
}
header .logo {
  margin-left: 1vh;
  font-size: 2.2vh;
    font-family: ui-monospace;
    font-weight: bold;
    color: #5a4d62;
}
</style>