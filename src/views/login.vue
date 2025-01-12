<template>
  <div class="out">
    <div class="form-box">
      <div class="title">登录|账号</div>
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
        <div class="button-box">
            <el-button type="primary" @click="onSubmit(formRef)" color="#333333">登录</el-button>
        </div>
      </el-form>
      <div class="link">
        <router-link :to="{ path: '/register' }">忘记密码?</router-link>
      </div>
    </div>
  </div>
 
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted} from 'vue'
import type { ComponentSize, FormInstance, FormRules } from 'element-plus'
import service from '@/util/request'
import {encrypt} from '@/util/encrypt'
import { login,register } from "@/api/user";

import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();

import type {View, Hide} from '@element-plus/icons-vue'
import { User } from '@/interface/user';
const addPassFlag=ref(false)//图标显示标识

onMounted(() => {//login到reg自动填充账号密码
  let regdata = globalProperties.$router.currentRoute.value.query
  if (Object.keys(regdata).length > 0){
    console.log("路由从login切换到reg传输了："+regdata);
    form.username = regdata.username as string
    form.password = regdata.password as string
  }
})

const formRef = ref<FormInstance>()
interface LoginRuleForm {
  username: string
  password: string
}
const form = reactive<LoginRuleForm>({
  username: '',
  password: '',
})

const rules = reactive<FormRules<LoginRuleForm>>({
  username: [{required: true, message: '账号不可为空', trigger: 'blur'}],
  password: [{required: true, message: '密码不可为空', trigger: 'blur'}]
})

const onSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) 
    return
  await formEl.validate((valid, fields) => {
    if (!valid){
      globalProperties.$message.error(`格式有误！`)
      return
    }
     
    let data = {
        username: form.username,
        password: encrypt(form.password)
    }
    login(data).then((res)=>{   
      switch (res.code) {
        case 20000:
          localStorage.setItem("username",res.data.username)
          localStorage.setItem("userid",res.data.userid.toString())
          localStorage.setItem("token",res.data.token)
          globalProperties.$router.replace("/home")
          globalProperties.$message.success(res.message)
          break;
        default:
          break;
      }
    },(err)=>{

    });
  })
}
</script>

<style scoped>
.out {
  position: absolute;
  top: 45%;
  left: 50%;
  margin-left: -250px;
  margin-top: -200px;
}
.out .form-box {
  box-sizing: border-box;
  padding: 100px;
  width: 500px;
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