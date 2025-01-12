<template>
    <div class="box">
      <img :src="userinfo?.avatarUrl" alt="avator" class="avatar">
      <div class="usertitle">欢迎回来，<span>{{ userinfo?.username }}</span>！</div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted} from 'vue'
import service from '@/util/request'

import useCurrentInstance from "@/hooks/useCurrentInstance";
import { userInfo } from '@/api/user';
import { User } from '@/interface/user';
const { globalProperties } = useCurrentInstance();

const userinfo = ref<User.UserInfo>();
const userId = Number(localStorage.getItem("userid"))

onMounted(() => {
  userInfo(userId).then(
    (res)=>{   
      switch (res.code) {
        case 20000:          
          userinfo.value = res.oData
          break;
        default:
          break;
      }
    },(err)=>{

    });
})
</script>

<style scoped>
.box {
  box-sizing: border-box;
  padding: 60px 0;
  height: 100%;
  /* width: 500px;
  height: 400px; */
  text-align: center
}
.box .avatar {
  width: 100px;
  height: 100px;
  border-radius: 100px;
  box-shadow: 0px 0px 10px 1px rgba(0, 0, 0, 0.2);
}
.box .usertitle {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: rgb(75, 66, 89);
  font-family: NSimSun;
  margin-top: 20px
}
.box .usertitle>span{
  max-width: 100px;
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 超出部分隐藏 */
  text-overflow: ellipsis; /* 显示省略号 */
}
</style>