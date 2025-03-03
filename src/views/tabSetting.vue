<template>
    <div class="content">
        <div class="line_top">
            <div class="title"><el-icon><Avatar /></el-icon>个人信息</div>
            <div class="input_box">
                <span class="stroke">用户名:</span>
                <GoplayInput placeholder='输入用户名' v-model=curUserName :onSubmit=submitUserName></GoplayInput>
            </div>
            <div class="input_box">
                <span class="stroke">修改密码:</span>
                <GoplayInput placeholder='输入原密码' v-model=curInputedPwd :onSubmit=submitUserName type='password'></GoplayInput>
            </div>
            
        </div>
        <div class="line_top">
            <div class="title"><el-icon><Coin /></el-icon>积分充值</div>
            <el-button class="super_submit" style="width: 8vh;">充值vip</el-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, onUpdated, onActivated, onBeforeMount } from 'vue'
import useCurrentInstance from "@/hooks/useCurrentInstance";
import { User } from '@/interface/user';
import { userInfo } from '@/api/user';
import { ResultCode } from '@/util/webConst';
import GoplayInput from '@/components/goplayInput.vue';
const { globalProperties } = useCurrentInstance();

const userinfo = ref<User.UserInfo>({
  id: 0,
  username: '',
  avatarUrl: '',
  level: 0
});
const userId = Number(localStorage.getItem("userid"));

const curUserName = ref('')
const curInputedPwd = ref('')

const submitUserName = (text:string, callback: (text: string) => void)=>{
    console.log("改名");
    // fetch('/api/submit', { body: childValue })
    // .then(() => callback(true))  // 🟢 通过回调返回结果
    // .catch(() => callback(false));
    callback(text+'改') 
}

onMounted(() => {
  userInfo(userId).then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:          
          userinfo.value = res.oData
          curUserName.value = userinfo.value.username
          break;
        default:
          break;
      }
    },(err)=>{

    });
})
</script>

<style scoped>
.content {
    margin-right: 10px;
    display: flex
;
    flex-direction: column;
    align-items: flex-start;
    color: #434343;
    min-height: 88vh;
    flex-wrap: wrap;
}
.content .line_top {
    position: relative;
    padding-right: 16vh;
    margin: 1vh;
    margin-top: 5vh;
    display: flex;
    flex-direction: column;
    /* width: 100%; */
    width: calc(100vw - 175px);
    padding: 1vh 2.2vh 1.4vh 2vh;
    border: 1px solid #e9e9e9;
    background: #fcfcfc;
    border-radius: 1vh;
    box-shadow: 0px -.23vh .2vh 0px rgb(216 207 255 / 57%) inset;
}
.content .line_top .el-button {
    background-color: var(--el-color-primary);
}
.content .line_top .el-button:hover {
    background-color: var(--el-color-primary-light-3);
    color: white;
}
.content .line_top .title{
    position: absolute;
    display: flex;
    align-items: center;
    top: -3.4vh;
    left: 1vh;
    color: #ffffff;
    font-size: 1.6vh;
    font-weight: bold;
    box-shadow: 0px -.23vh .2vh 0px rgb(255 129 181 / 57%) inset;
    background: #313131;
    border-radius: 1.6vh;
    border-top-right-radius: 1.6vh;
    border-bottom-left-radius: 1.6vh;
    font-family: 'NSimSun', 'Microsoft YaHei', sans-serif;
    width: 10vh;
    height: 2.8vh;
    border: 0.2vh solid #6475ff;
    justify-content: space-evenly;
    padding: 0.2vh 0.1vh;
}

.content .line_top .input_box {
    display: flex;
    height: 3vh;
    align-items: center;
    /* background-color: #e2e0e7; */
    border-radius: 2vh;
    box-sizing: border-box;
    /* padding: 1.4vh 1.4vh; */
    margin: 0.4vh;
}
.content .line_top .input_box span{
    min-width: 8vh;
    color: #ffffff;
    font-weight: bold;
    font-size: 1.4vh;
}
</style>

<!-- <style>
.el-button, .el-input__wrapper {
  box-sizing: border-box;
  color: #fff;
  font-weight: 600;
  border-radius: 4vh;
  font-size: 1.3vh;
  padding: .7vh 1.5vh;
  height: 3vh;
}

</style> -->