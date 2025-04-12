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
const refreshMood = () => {
  // 重置当前选中的心情
  selectedMood.value = ''
  
  // 随机打乱心情列表顺序
  const shuffled = [...moodList.value]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  moodList.value = shuffled
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
  display: flex;
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
  /* 添加最大宽度和最小宽度限制 */
  max-width: 160px;
  min-width: 120px;
  height: 48px;
  overflow: hidden;
  margin: 0 auto;
}

.mood-item svg {
  font-size: 20px;
  color: var(--el-text-color-primary);
  /* 固定图标大小 */
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.mood-item span {
  /* 防止文字溢出 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
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

/* 移除重复的样式定义 */
/* .mood-item {
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
} */

.mood-item:hover {
  /* 修改悬停效果，减小缩放幅度 */
  transform: scale(1.03) translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 媒体查询部分调整 */
@media screen and (max-width: 768px) {
  /* 其他样式保持不变... */
  
  .mood-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    justify-items: center;
  }
  
  .mood-item {
    max-width: 120px;
    min-width: 80px;
    height: 36px;
    padding: 8px;
    gap: 6px;
  }
  
  .mood-item svg {
    font-size: 16px;
    width: 16px;
    height: 16px;
  }
  
  .mood-item span {
    font-size: 12px;
  }
}

@media screen and (max-width: 480px) {
  /* 其他样式保持不变... */
  
  .mood-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .mood-item {
    max-width: 100px;
    min-width: 70px;
    height: 32px;
    padding: 6px;
    gap: 4px;
  }
  
  .mood-item svg {
    font-size: 14px;
    width: 14px;
    height: 14px;
  }
  
  .mood-item span {
    font-size: 11px;
  }
  
  .mood-item.active {
    animation: none; /* 移动端禁用动画以提高性能 */
  }
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

/* 添加移动端响应式样式 */
@media screen and (max-width: 768px) {
  .welcome-cards {
    flex-direction: column;
    gap: 15px;
    margin: 15px 0;
  }
  
  .user-welcome {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .welcome-text h2 {
    font-size: 18px;
  }
  
  .welcome-text p {
    font-size: 14px;
  }
  
  .quick-stats {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  /* 添加卡片头部样式调整 */
  :deep(.el-card__header) {
    padding: 1px 15px;
  }
  :deep(.el-card__body){
    padding: 8% 4px;
  }
  
  /* 修改这里，改为横向排列 */
  .mood-content {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    gap: 4px;
  }
  
  .mood-item {
    max-width: 70px;
    min-width: unset;
    width: 23%;
    height: 28px;
    padding: 4px;
    gap: 4px;
    flex: 0 0 auto;
    margin: 0;
  }
  
  .emoji-animation {
    font-size: 150px;
  }
}

/* 针对更小屏幕的优化 */
@media screen and (max-width: 480px) {
  .welcome-cards {
    margin: 10px 0;
  }
  
  .avatar-wrapper .el-avatar {
    width: 50px !important;
    height: 50px !important;
    font-size: 50px !important;
  }
  
  .online-status {
    width: 10px;
    height: 10px;
  }
  
  .welcome-text h2 {
    font-size: 16px;
  }
  
  .welcome-text p {
    font-size: 12px;
  }
  
  .stat-item {
    font-size: 12px;
  }
  
  /* 更小屏幕上的心情选项更小 */
  .mood-content {
    gap: 2px;
  }
  
  .mood-item {
    width: 18%;
    height: 24px;
    padding: 2px 4px;
    gap: 2px;
  }
  
  .mood-item svg {
    font-size: 12px;
    width: 12px;
    height: 12px;
  }
  
  .mood-item span {
    font-size: 10px;
  }
  
  .emoji-animation {
    font-size: 120px;
  }
}
</style>