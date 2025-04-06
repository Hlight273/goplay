<template>
  <div class="welcome-cards">
    <el-card class="welcome-card">
      <div class="user-welcome">
        <div class="avatar-wrapper">
          <el-avatar :size="64" :src="commonStore.myUserinfo.avatarUrl || require('@/assets/icons/default_avatar.jpg')" />
          <div class="online-status"></div>
        </div>
        <div class="welcome-text">
          <h2>欢迎回来, {{ commonStore.myUserinfo.nickname }}</h2>
          <p>{{ greetingText }}</p>
        </div>
      </div>
      <div class="quick-stats">
        <div class="stat-item animate-in">
          <el-icon><Calendar /></el-icon>
          <span>{{ formatDate(new Date()) }}</span>
        </div>
        <div class="stat-item animate-in" style="animation-delay: 0.2s">
          <el-icon><Star /></el-icon>
          <span>我的歌单 {{ myPlaylistCount }}</span>
        </div>
        <div class="stat-item animate-in" style="animation-delay: 0.4s">
          <el-icon><Timer /></el-icon>
          <span>在线时长 {{ onlineTime }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="mood-card">
      <template #header>
        <div class="mood-header">
          <span>今日心情</span>
          <el-button link @click="refreshMood">换一换</el-button>
        </div>
      </template>

      <div class="mood-content">
        <div class="mood-item" 
            v-for="mood in moodList" 
            :key="mood.type"
            :class="{ active: selectedMood === mood.type }"
            @click="selectMood(mood)">
          <component :is="mood.icon" />
          <span>{{ mood.name }}</span>
        </div>
      </div>

    </el-card>

  </div>

  <div class="emoji-animation" v-if="showEmoji">{{ currentEmoji }}</div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, markRaw } from 'vue'
import { Calendar, Star, Sunny, Moon, Cloudy, Lightning, Timer } from '@element-plus/icons-vue'
import { User } from '@/interface/user'
import { userPlaylistInfo } from '@/api/user';
import { ResultCode } from '@/util/webConst'
import { formatDate } from '@/util/commonUtil'
import { useCommonStore } from '@/store/commonStore'


const commonStore = useCommonStore()
const myPlaylistCount = computed(() => commonStore.myPlaylistInfos.length)

//mood
const showEmoji = ref(false)
const currentEmoji = ref('')
const emit = defineEmits(['mood-change'])
const moodList = ref([
  { type: 'happy', name: '愉悦', icon: markRaw(Sunny), color: '#FFB74D', emoji: '😊' },
  { type: 'calm', name: '平静', icon: markRaw(Moon), color: '#90CAF9', emoji: '😌' },
  { type: 'melancholy', name: '忧郁', icon: markRaw(Cloudy), color: '#7986CB', emoji: '😔' },
  { type: 'energetic', name: '激情', icon: markRaw(Lightning), color: '#F44336', emoji: '🔥' },
])
const selectedMood = ref('')
const selectMood = (mood: any) => {
  selectedMood.value = mood.type
  currentEmoji.value = mood.emoji
  showEmoji.value = true
  //动画结束后隐藏
  setTimeout(() => {
    showEmoji.value = false
  }, 2000)
  emit('mood-change', mood)
}

//问候语
const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return "夜深了，要注意休息哦！"
  if (hour < 11) return "早安，来听点清晨的音乐吧！"
  if (hour < 14) return "午安，来点轻音乐放松一下~"
  if (hour < 18) return "下午好，来杯咖啡配音乐？"
  if (hour < 22) return "晚上好，今天过得怎么样？"
  return "夜深了，要注意休息哦！"
})
//在线时长计算
const onlineTime = ref('0分钟')
let startTime = Date.now()
const updateOnlineTime = () => {
  const minutes = Math.floor((Date.now() - startTime) / 60000)
  if (minutes < 60) {
    onlineTime.value = `${minutes}分钟`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    onlineTime.value = `${hours}小时${remainingMinutes}分钟`
  }
}
onMounted(() => {
  setInterval(updateOnlineTime, 60000) // 每分钟更新一次
})

</script>

<style scoped>
.avatar-wrapper {
  position: relative;
}

.online-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #4CAF50;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s infinite;
}
.welcome-cards {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.welcome-card {
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-9));
  position: relative;
  overflow: hidden;
}

welcome-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  animation: rotate 20s linear infinite;
}

.welcome-text h2 {
  margin: 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
  animation: slideIn 0.5s ease-out;
}

.welcome-text p {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
  animation: fadeIn 0.5s ease-out;
}

.stat-item {
  opacity: 0;
  transform: translateY(20px);
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-welcome {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.welcome-text h2 {
  margin: 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.welcome-text p {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
}

.quick-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.mood-card {
  height: fit-content;
}

.mood-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mood-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mood-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-color-primary-light-9);
}

.mood-item svg {
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.mood-item.active svg {
  color: white;
}

.mood-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.mood-item.active {
  background: var(--el-color-primary-light-5);
  color: white;
}

.mood-item {
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mood-item:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mood-item.active {
  animation: selectedPulse 1s infinite;
}

@keyframes selectedPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}


.emoji-animation {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 200px;
  z-index: 9999;
  pointer-events: none;
  animation: emojiAppear 2s ease-out forwards;
}

@keyframes emojiAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.1);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
  40% {
    transform: translate(-50%, -50%) scale(1);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2);
  }
}
</style>