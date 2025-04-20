<template>
  <div class="mbti-container hide_scroll_child2">
    <div class="mbti-header">
      <h2 class="section-title">
        音乐MBTI测试
        <el-tooltip content="了解你的音乐性格" placement="right">
          <el-icon class="mbti-icon"><MagicStick /></el-icon>
        </el-tooltip>
      </h2>
      <div v-if="hasMbtiType" class="retake-test">
        <el-button class="retake-btn" type="primary" @click="startTest">重新测试</el-button>
      </div>
    </div>

    <!-- 未开始测试且没有结果时显示开始页面 -->
    <div v-if="!hasResult && !isTestStarted && !hasMbtiType" class="start-test">
      <el-empty description="开始探索你的音乐性格">
        <template #image>
          <img src="@/assets/imgs/mbti-start.png" class="start-image" />
        </template>
        <el-button class="black_oil_btn" type="primary" @click="startTest">开始测试</el-button>
      </el-empty>
    </div>

    <!-- 测试进行中 -->
    <div v-else-if="!hasResult && isTestStarted" class="test-questions" ref="testQuestionsRef">
      <el-card class="question-card">
        <div id="particles-js" class="particles-container"></div>
        <div class="question-content">
          <h3 class="question-progress">问题 {{ currentQuestion + 1 }}/{{ questions.length }}</h3>
          <p class="question-text">{{ questions[currentQuestion].question }}</p>
          <div class="options">
            <el-button
              class="black_oil_btn"
              v-for="option in questions[currentQuestion].options"
              :key="option.text"
              type="primary"
              @click="selectAnswer(option.dimension)"
            >
              <span class="option-text">{{ option.text }}</span>
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 测试结果 -->
    <div v-else-if="hasResult && !hasMbtiType" class="mbti-result">
      <div class="result-card">
        <div class="type-header">
          <span class="type-title">{{ mbtiResult.type }}</span>
          <span class="type-name">{{ mbtiResult.name }}</span>
        </div>
        <div class="type-description">
          {{ mbtiResult.description }}
        </div>
        <div class="music-preferences">
          <h4>音乐偏好</h4>
          <el-tag 
            v-for="(genre, index) in mbtiResult.genres" 
            :key="index"
            :type="tagTypes[index % 4]"
            class="preference-tag"
          >
            {{ genre }}
          </el-tag>
        </div>
        <el-button v-if="ls.getItem('token')!=null" class="black_oil_btn" type="primary" @click="submitResult">提交结果</el-button>
      </div>
    </div>

    <!-- 已有MBTI类型，显示相似用户 -->
    <div v-else-if="hasMbtiType && !isTestStarted" class="similar-users-container">
      <div class="my-mbti-info">
        <div class="type-header">
          <span class="type-title">{{ currentMbtiInfo.type }}</span>
          <span class="type-name">{{ currentMbtiInfo.name }}</span>
        </div>
        <div class="type-description">
          {{ currentMbtiInfo.description }}
        </div>
        <div class="music-preferences">
          <h4>音乐偏好</h4>
          <el-tag 
            v-for="(genre, index) in currentMbtiInfo.genres" 
            :key="index"
            :type="tagTypes[index % 4]"
            class="preference-tag"
          >
            {{ genre }}
          </el-tag>
        </div>
      </div>

      <div class="similar-users-section">
        <h3 class="similar-users-title">与你音乐品味相似的用户</h3>
        <div v-if="similarUsers.length > 0" class="similar-users-bubbles" id="similar-users-container">
          <div v-for="(user, index) in similarUsers" :key="user.id" 
               class="user-bubble" 
               :style="getBubbleStyle(index)"
               @click="handleViewProfile(user)">
            <img :src="user.avatarUrl" alt="avatar" class="user-avatar">
            <span class="user-name">{{ user.nickname }}</span>
          </div>
        </div>
        <div v-if="similarUsers.length === 0" class="no-similar-users">
          <el-empty description="暂无相似用户" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { MBTICodec, MBTIService } from '@/util/mbtiUtil'
import { updateMBTI } from '@/api/user'
import { getRandomSimilarMbtiUsers } from '@/api/community'
import { ResultCode } from '@/util/webConst'
import { useCommonStore } from "@/store/commonStore";
import { storeToRefs } from "pinia";
import { User } from '@/interface/user'
import 'particles.js'
const ls = localStorage;
const commonStore = useCommonStore();
const { myUserinfo } = storeToRefs(commonStore);

// 初始化动态列表
const { currentTab } = defineProps<{
    currentTab?: string
}>()
const isInitialized = ref(false);
watch(() => currentTab, async (newTab) => {
    if (newTab === 'mbti' && !isInitialized.value) {
        await fetchSimilarUsers()
        isInitialized.value = true;
    }
}, { immediate: true })

const hasResult = ref(false)
const isTestStarted = ref(false)
const currentQuestion = ref(0)
const questions = ref(MBTIService.getQuestions())
const answers = ref<Record<number, string>>({})
const tagTypes = ['primary', 'success', 'warning', 'danger']
const mbtiResult = ref(MBTIService.getAllTypes()['ENFP'])
const similarUsers = ref<User.UserInfo[]>([])

// 计算属性：用户是否已有MBTI类型
const hasMbtiType = computed(() => {
  return myUserinfo.value && myUserinfo.value.mbtiType !== undefined && myUserinfo.value.mbtiType !== null
})

// 当前用户的MBTI信息
const currentMbtiInfo = computed(() => {
  if (!hasMbtiType.value) return MBTIService.getAllTypes()['ENFP']
  
  // 添加空值检查，确保mbtiType存在且为数字
  const mbtiTypeValue = myUserinfo.value.mbtiType
  if (mbtiTypeValue === undefined || mbtiTypeValue === null) {
    return MBTIService.getAllTypes()['ENFP']
  }
  
  const mbtiType = MBTICodec.decode(mbtiTypeValue)
  return MBTIService.getAllTypes()[mbtiType] || MBTIService.getAllTypes()['ENFP']
})

// 获取相似用户
const fetchSimilarUsers = async () => {
  try {
    const res = await getRandomSimilarMbtiUsers()
    if (res.code === ResultCode.SUCCESS && res.oData) {
      similarUsers.value = res.oData
      console.log("%c初始化mbti相似用户成功",'color: blue');
    } else if (res.code === ResultCode.EMPTY) {
      similarUsers.value = []
    }
  } catch (error) {
    console.error('获取相似用户失败:', error)
    similarUsers.value = []
  }
}

// 开始测试
const startTest = () => {
  isTestStarted.value = true
  hasResult.value = false
  currentQuestion.value = 0
  answers.value = {}
  // 重置 MBTI 结果
  mbtiResult.value = MBTIService.getAllTypes()['ENFP']
  // 如果是重新测试，需要将 hasMbtiType 相关的状态重置
  if (hasMbtiType.value) {
    myUserinfo.value.mbtiType = undefined
  }
}

// 选择答案
const selectAnswer = (dimension: string) => {
  answers.value[questions.value[currentQuestion.value].id] = dimension
  
  if (currentQuestion.value < questions.value.length - 1) {
    currentQuestion.value++
  } else {
    // 计算结果
    mbtiResult.value = MBTIService.calculateResult(answers.value)
    hasResult.value = true
    isTestStarted.value = false
  }
}

// 提交结果
const submitResult = async () => {
  
    const mbtiCode = MBTICodec.encode(mbtiResult.value.type)
    const res = await updateMBTI(mbtiCode)
    if (res.code === ResultCode.SUCCESS) {
      ElMessage.success(res.message)
      myUserinfo.value.mbtiType = mbtiCode
      // 提交成功后获取相似用户
      await fetchSimilarUsers()
      // 重置测试状态
      hasResult.value = false
      isTestStarted.value = false
    } else {
      ElMessage.error(res.message)
    }
  
}

// 查看用户主页
const handleViewProfile = (userinfo: User.UserInfo) => {
  commonStore.openUserPage_byUserInfo(userinfo)
}

// 获取气泡样式
const getBubbleStyle = (index: number) => {
  const colors = ['#ff6b6b', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', '#54a0ff']
  const size = 70 + Math.random() * 30 // 70px到100px之间的随机大小
  const delay = Math.random() * 5 // 0到5秒的随机延迟
  
  return {
    backgroundColor: colors[index % colors.length],
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`
  }
}

// 粒子效果相关
const testQuestionsRef = ref<HTMLElement | null>(null)
let particlesInstance: any = null
watch(isTestStarted, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initParticles()
    })
  } else {
    destroyParticles()
  }
})
function destroyParticles() {
  // @ts-ignore
  if (particlesInstance && window.pJSDom && window.pJSDom[0]) {
    // @ts-ignore
    window.pJSDom[0].pJS.fn.vendors.destroypJS()
    particlesInstance = null
  }
}
function initParticles() {
  const container = document.getElementById('particles-js')
  if (!container) return
  
  // 先销毁已有的实例
  destroyParticles()
  // @ts-ignore
  if (window.particlesJS) {
    // @ts-ignore
    window.particlesJS('particles-js', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#ffffff',
          opacity: 0.2,
          width: 1
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false
        }
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'grab' },
          resize: true
        },
        modes: {
          grab: { distance: 140, line_linked: { opacity: 0.5 } }
        }
      },
      retina_detect: true
    })
  }
}

// 组件挂载时检查用户MBTI状态并获取相似用户
// onMounted(async () => {
//     await fetchSimilarUsers()
// })

onUnmounted(() => {
  destroyParticles()
})
</script>

<style scoped>
.mbti-container {
  padding: 30px;
  background: linear-gradient(135deg, #1e1e2f, #2a2a40);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.mbti-container::before {
  scale: 2;
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: conic-gradient(
    from 0deg,
    #ff0080,
    #7928ca,
    #ff0080
  );
  animation: rotate 8s linear infinite;
  z-index: -1;
  border-radius: 20px;
  overflow: hidden;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.mbti-header {
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.retake-test {
  position: absolute;
  right: 0;
  top: 0;
}

.retake-btn {
  background: rgba(255, 0, 128, 0.2);
  border: none;
  color: #e0e0e0;
  transition: all 0.3s ease;
}

.retake-btn:hover {
  background: rgba(255, 0, 128, 0.4);
  transform: translateY(-3px);
}

.section-title {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff0080, #7928ca);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mbti-icon {
  margin-left: 10px;
  font-size: 24px;
  color: #ff0080;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.start-test {
  padding-bottom: 40px;
  text-align: center;
}

.start-image {
  width: 160px;
  height: 200px;
  object-fit: contain;
  filter: drop-shadow(0 0 20px rgba(255, 0, 128, 0.3));
}

.test-questions {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.question-card {
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 30px;
  position: relative;
  overflow: hidden;
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.question-content {
  position: relative;
  z-index: 1;
}

.question-progress,
.question-text,
.options {
  position: relative;
  z-index: 2;
}

.question-text {
  font-size: 18px;
  margin: 20px 0;
  color: #e0e0e0;
}

.options .el-button {
  width: 100%;
  text-align: left;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #e0e0e0;
  transition: all 0.3s ease;
}

.options .el-button:hover {
  background: rgba(255, 0, 128, 0.2);
  transform: translateY(3px);
}

.result-card, .my-mbti-info {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
}

.type-header {
  margin-bottom: 20px;
  text-align: center;
}

.type-title {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff0080, #7928ca);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.type-name {
  font-size: 24px;
  color: #ff0080;
}

.type-description {
  margin: 20px 0;
  line-height: 1.6;
  color: #e0e0e0;
}

.music-preferences {
  margin: 20px 0;
}

.preference-tag {
  margin: 5px;
  background: rgba(255, 0, 128, 0.2);
  border: none;
  color: #e0e0e0;
  transition: all 0.3s ease;
}

.preference-tag:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(255, 0, 128, 0.3);
}

h4 {
  margin-bottom: 10px;
  color: #ff0080;
}

.question-card::before {
  scale: 2;
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg,
    rgba(255, 0, 128, 0.1),
    rgba(121, 40, 202, 0.1),
    rgba(255, 0, 128, 0.1)
  );
  animation: rotate 8s linear infinite;
  z-index: -1;
}

.question-progress {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 20px;
}

.question-text {
  font-size: 20px;
  color: #e0e0e0;
  text-align: center;
  margin-bottom: 30px;
  line-height: 1.6;
}

.options {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-direction: column;
}

.black_oil_btn {
  width: 100%;
  padding: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: #e0e0e0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.black_oil_btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(255, 0, 128, 0.3),
    rgba(121, 40, 202, 0.3)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.black_oil_btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 20px rgba(255, 0, 128, 0.2);
}

.black_oil_btn:hover::before {
  opacity: 1;
}

.option-text {
  position: relative;
  z-index: 1;
}

/* 相似用户部分样式 */
.similar-users-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.similar-users-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.similar-users-title {
  font-size: 24px;
  color: #e0e0e0;
  margin-bottom: 20px;
  text-align: center;
  background: linear-gradient(45deg, #ff0080, #7928ca);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.similar-users-bubbles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  min-height: 200px;
}

.user-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.user-bubble:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 25px rgba(255, 0, 128, 0.4);
}

.user-avatar {
  width: 60%;
  height: 60%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.user-name {
  margin-top: 5px;
  font-size: 12px;
  color: white;
  text-align: center;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

.no-similar-users {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #e0e0e0;
}
</style>