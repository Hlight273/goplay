<template>
  <div class="mbti-container">
    <div class="mbti-header">
      <h2 class="section-title">
        音乐MBTI测试
        <el-tooltip content="了解你的音乐性格" placement="right">
          <el-icon class="mbti-icon"><MagicStick /></el-icon>
        </el-tooltip>
      </h2>
    </div>

    <div v-if="!hasResult && !isTestStarted" class="start-test">
      <el-empty description="开始探索你的音乐性格">
        <template #image>
          <img src="@/assets/imgs/mbti-start.png" class="start-image" />
        </template>
        <el-button class="black_oil_btn" type="primary" @click="startTest">开始测试</el-button>
      </el-empty>
    </div>

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


    <div v-else class="mbti-result">
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
        <el-button class="black_oil_btn" type="primary" @click="shareResult">分享结果</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, Ref, watch ,nextTick} from 'vue'
import { MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { MBTIService } from '@/util/mbtiUtil'
import 'particles.js'

const hasResult = ref(false)
const isTestStarted = ref(false)
const currentQuestion = ref(0)
const questions = ref(MBTIService.getQuestions())
const answers = ref<Record<number, string>>({})
const tagTypes = ['', 'success', 'warning', 'danger']
const mbtiResult = ref(MBTIService.getAllTypes()['ENFP'])

const startTest = () => {
  isTestStarted.value = true
  currentQuestion.value = 0
  answers.value = {}
}

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

const shareResult = () => {
  const shareText = MBTIService.generateShareText(mbtiResult.value)
  // 复制到剪贴板
  navigator.clipboard.writeText(shareText)
    .then(() => ElMessage.success('结果已复制到剪贴板'))
    .catch(() => ElMessage.error('复制失败'))
}


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
  border-radius: 20px; /* 添加圆角匹配容器 */
  overflow: hidden; /* 防止溢出 */
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.mbti-header {
  text-align: center;
  margin-bottom: 30px;
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
  padding: 40px 0;
  text-align: center;
}

.start-image {
  width: 200px;
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

/* 确保其他内容在粒子效果之上 */
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
  transform: translateY(3px), scale(1.05);
}

.result-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 30px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
.test-questions {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.question-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 30px;
  position: relative;
  overflow: hidden;
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
    display: flex
;
    gap: 15px;
    align-items: center;
    flex-direction: row;
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
</style>