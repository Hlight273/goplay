<template>
    <div class="content">

        <div class="infobox">
            <img :src="myUserinfo?.avatarUrl" alt="avator" class="avatar">
            <div class="usertitle">欢迎回来，{{ User.describtionUser(myUserinfo) }}<span>{{ myUserinfo?.nickname }}</span>！</div>
        </div>

        <div class="line_top">
            <div class="title"><el-icon><Avatar /></el-icon>个人信息</div>
            <!-- <img :src="userinfo.avatarUrl" alt="avator" class="avator"> -->
            <div class="input_box">
                <span class="stroke">用户名:</span>
                <span class="label">{{ myUserinfo.username }}</span>
            </div>
            <div class="input_box">
                <span class="stroke">昵称:</span>
                <GoplayInput placeholder='输入昵称' v-model=curNickname :onSubmit=submitNickname type='text'></GoplayInput>
            </div>
            <div class="input_box">
                <span class="stroke">Go积分:</span>
                <span class="label">{{ myUserinfo.hPoints??0 }}</span>
            </div>
            <!-- <div class="input_box">
                <span class="stroke">修改密码:</span>
                <GoplayInput placeholder='输入原密码' v-model=curInputedOldPwd :onSubmit=submitNickname type='password'></GoplayInput>
            </div> -->
            <el-button class="super_submit floating_rightup" @click="">修改密码</el-button>
            <span class="userId">#{{ myUserinfo.id }}</span>
            
        </div>
        <div class="line_top">
            <div class="title"><el-icon><Coin /></el-icon>积分充值</div>
            <div v-show="myVipinfo.level>0" style="display: flex;align-items: center;">
              <VipTag :level="myVipinfo.level"></VipTag>
              <span>
                <!-- {{ formatDate(myVipinfo.startTime) }}- -->{{ formatDate(myVipinfo.endTime) }}到期
              </span>
            </div>
            <span class="white_b_font stroke" v-show="myVipinfo.level<=0">当前没有vip!</span>
            <el-button class="super_submit floating_rightup" @click="goRecharge" style="width: 8vh;">充值</el-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, onUpdated, onActivated, onBeforeMount } from 'vue'
import { User } from '@/interface/user';
import { updateNickname, userInfo } from '@/api/user';
import { ResultCode } from '@/util/webConst';
import GoplayInput from '@/components/goplayInput.vue';
import { formatDate } from '@/util/commonUtil';

import { storeToRefs } from "pinia";
import { useCommonStore } from "@/store/commonStore";
import { useRouter } from 'vue-router';
import VipTag from '@/components/vipTag.vue';
const router = useRouter();

const commonStore = useCommonStore();
const { myUserinfo, myVipinfo } = storeToRefs(commonStore);

const userId = Number(localStorage.getItem("userid"));

const curNickname = ref('')
const curInputedOldPwd = ref('')
const curInputedNewPwd1 = ref('')
const curInputedNewPwd2 = ref('')

const submitNickname = (text:string, callback: (text: string) => void)=>{
  updateNickname(text).then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:          
          callback(text);
          myUserinfo.value.nickname = curNickname.value;
          break;
        default:
          break;
      }
    });
    // fetch('/api/submit', { body: childValue })
    // .then(() => callback(true))  //通过回调返回结果
    // .catch(() => callback(false));
    
}

const goRecharge = ()=>{
  router.push('/pay');
}

onMounted(() => {
  commonStore.updateMyVipInfo();
  commonStore.updateMyUserInfo();
  
  
})

watch(
  () => myUserinfo.value,
  (newVal, oldVal) => {
    if(oldVal==undefined)return;
    curNickname.value = myUserinfo.value.nickname
    
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.content {
    margin-right: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: #434343;
    min-height: 88vh;
    flex-wrap: wrap;
    font-size: 1.4vh;
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
    padding: 1vh 2.2vh 2.2vh 2vh;
    border: 1px solid #e9e9e9;
    background: #fcfcfc;
    border-radius: 1vh;
    box-shadow: 0px -.23vh .2vh 0px rgb(216 207 255 / 57%) inset;
}

.content .line_top .title{
  position: absolute;
    display: flex
;
    align-items: center;
    top: -2.4vh;
    left: 1vh;
    color: #ffffff;
    font-size: 1.3vh;
    font-weight: bold;
    box-shadow: 0px -.23vh .2vh 0px rgb(255 129 181 / 57%) inset;
    background: #313131;
    border-radius: 1.6vh;
    border-top-right-radius: 1.6vh;
    border-bottom-left-radius: 1.6vh;
    font-family: 'NSimSun', 'Microsoft YaHei', sans-serif;
    width: 10vh;
    height: 2.6vh;
    border: 0.2vh solid #6475ff;
    justify-content: space-evenly;
    padding: 0vh 0.4vh;
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
.content .line_top .input_box span.label {
  margin-left: 0.8vh;
  color: var(--font-grey);
    font-size: 1.6vh;
    font-weight: normal;
    font-family: ui-serif;
}
.content .line_top .userId {
  height: 2vh;
    line-height: 2vh;
    position: absolute;
    right: 1.2vh;
    bottom: 1vh;
    font-size: 2vh;
    color: #d5ceef;
    font-family: Segoe UI Black;
    font-weight: bold;
}
.content .line_top .avator{
  margin-top: 0px;
  height: 3.2vh;
  width: 3.2vh;
  border-radius: 2.5vh;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, .3);
}


.infobox {
  box-sizing: border-box;
  padding: 60px 0;
  /* height: 100%; */
  width: 100%;
  /* width: 500px;
  height: 400px; */
  text-align: center
}
.infobox .avatar {
  width: 100px;
  height: 100px;
  border-radius: 100px;
  box-shadow: 0px 0px 10px 1px rgba(0, 0, 0, 0.2);
}
.infobox .usertitle {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: rgb(75, 66, 89);
  font-family: NSimSun;
  margin-top: 20px
}
.infobox .usertitle>span{
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.floating_rightup {
  position: absolute;
  right: 1vh;
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