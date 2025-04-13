<template>
    <div class="out">
    <div class="form-box">
      <div class="title">注册|账号</div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" style="max-width: 600px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" :type="addPassFlag ? 'text' : 'password'">
            <template #suffix>
              <span @click="addPassFlag = !addPassFlag">
                <el-icon v-if="addPassFlag"><View /></el-icon>
                <el-icon v-else><Hide /></el-icon>
              </span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="password2">
          <el-input v-model="form.password2" :type="addPassFlag ? 'text' : 'password'">
            <template #suffix>
              <span @click="addPassFlag = !addPassFlag">
                <el-icon v-if="addPassFlag"><View /></el-icon>
                <el-icon v-else><Hide /></el-icon>
              </span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="agreeToTerms">
          <el-checkbox v-model="form.agreeToTerms" @change="openAgreementDialog">
            我已阅读并同意《免责申明》
          </el-checkbox>
        </el-form-item>

        <div class="button-box">
            <el-button type="primary" @click="onSubmit(formRef)" color="#333333">注册</el-button>
        </div>
      </el-form>
      <div class="link">
        <router-link :to="{ path: '/login' }">已有账号</router-link>
        <router-link :to="{ path: '/home' }">游客进入</router-link>
      </div>
    </div>
  </div>


   <!-- 免责申明弹框 -->
   <el-dialog v-model="agreementVisible" title="免责申明" width="600px">
      <p>在使用 GoPlay 友音同享音乐平台（以下简称 Goplay）前，请您务必仔细阅读并透彻理解本声明。</p>
      <p>本网站音乐资源大部分来自于互联网，如涉及侵权，请原作者联系管理员，我们将在 24 小时内删除。</p>
      <p>音乐资源分享仅用于学习交流，不得用于商业行为，违规使用获取利益，由下载方承担法律责任。</p>
      <p>上传者请保证音乐为本人原创，如涉及侵权，请联系管理员，我们将在 24 小时内删除。</p>
      <template #footer>
        <el-button :disabled="countdown > 0" type="primary" @click="confirmAgreement">
          {{ countdown > 0 ? `请等待 ${countdown} 秒` : '确认' }}
        </el-button>
      </template>
    </el-dialog>

</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules} from 'element-plus'
import {encrypt} from '@/util/encrypt'

import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

import type {View, Hide} from '@element-plus/icons-vue'
import { register } from '@/api/user';
const addPassFlag=ref(false)//图标显示标识

const formRef = ref<FormInstance>()
interface RegisterRuleForm {
    username: string
    password: string
    password2: string
    agreeToTerms: boolean;
}
const form = reactive<RegisterRuleForm>({
  username: '',
  password: '',
  password2: '',
  agreeToTerms: false
})

const validatePassword = (rule: any, value: string, callback: (message?: Error) => void) => {
    //console.log(form.password+" "+form.password2)
    if (value === '') {
        callback(new Error('请再次输入密码'));
    } else if (value !== form.password) {
        callback(new Error('两次输入密码不一致!'));
    } else {
        callback();
    }
};

const rules = reactive<FormRules<RegisterRuleForm>>({
  username: [{required: true, message: '账号不可为空', trigger: 'blur'}],
  password: [{required: true, message: '密码不可为空', trigger: 'blur'}],
  password2: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ]
})

const onSubmit = async (formEl: FormInstance | undefined) => {
  if(!form.agreeToTerms){
    globalProperties?.$message.error(`请先同意版权协定！`)
    return;
  }
  if (!formEl) 
    return
  await formEl.validate((valid, fields) => {
    if (!valid) {
      globalProperties?.$message.error(`格式有误！`)
      return
    }
    let data0 = (({ username, password }) => ({ username, password }))(form);//加密前
    let data = {//加密后
        username: form.username,
        password: encrypt(form.password)
    }
    register(data).then((res)=>{
      switch (res.code) {
        case 20000:
          globalProperties?.$router.replace({path: "/login", query: data0})//跳转到登陆页面用的是加密前
          globalProperties?.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
  })
}

const agreementVisible = ref(false) // 控制弹框显示
const countdown = ref(5) // 5 秒倒计时
const openAgreementDialog = () => {
  form.agreeToTerms = false // 防止用户直接勾选
  agreementVisible.value = true
  countdown.value = 5
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const confirmAgreement = () => {
  form.agreeToTerms = true
  agreementVisible.value = false
}

</script>

<style scoped>
.out {
  position: absolute;
  top: 40%;
  left: 50%;
  margin-left: -150px;
  margin-top: -200px;
}
.out .form-box {
  box-sizing: border-box;
  padding: 100px 0;
  min-width: 300px;
  height: 400px;
}
.out .form-box .title {
  margin-bottom: 30px;
  text-align: center;
  font-size: 30px;
  color: gray;
  font-family: NSimSun;
}
.out .form-box .link * {
  display: block;
  margin-top: 30px;
  text-align: center;
  color:#ff5a70;
  font-size: 14px;
}

.out .form-box .el-form-item {
  margin-bottom: 30px;
}

.button-box {
  text-align:center
}
</style>