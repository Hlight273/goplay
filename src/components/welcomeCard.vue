<template>
  <div class="welcome-cards">
    <el-card class="welcome-card">
      <div class="user-welcome">
        <el-avatar :size="64" :src="commonStore.myUserinfo.avatarUrl || require('@/assets/icons/default_avatar.jpg')" />
        <div class="welcome-text">
            <h2>欢迎回来, {{ commonStore.myUserinfo.nickname }}</h2>
          <p>今天想听点什么？</p>
        </div>
      </div>
      <div class="quick-stats">
    <div class="stat-item">
      <el-icon><Calendar /></el-icon>
      <span>{{ formatDate(new Date()) }}</span>
    </div>
    <div class="stat-item">
      <el-icon><Star /></el-icon>
      <span>我的歌单 {{ myPlaylistCount }}</span>
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
</template>

<script setup lang="ts">
import { onMounted, ref,computed, markRaw } from 'vue'
import { Calendar, Star, Sunny, Moon, Cloudy, Lightning } from '@element-plus/icons-vue'
import { User } from '@/interface/user'
import { userPlaylistInfo } from '@/api/user';
import { ResultCode } from '@/util/webConst'
import { formatDate } from '@/util/commonUtil'
import { useCommonStore } from '@/store/commonStore'


const commonStore = useCommonStore()
const myPlaylistCount = computed(() => commonStore.myPlaylistInfos.length)

const emit = defineEmits(['mood-change'])

const moodList = ref([
  { type: 'happy', name: '愉悦', icon: markRaw(Sunny), color: '#FFB74D' },
  { type: 'calm', name: '平静', icon: markRaw(Moon), color: '#90CAF9' },
  { type: 'melancholy', name: '忧郁', icon: markRaw(Cloudy), color: '#7986CB' },
  { type: 'energetic', name: '激情', icon: markRaw(Lightning), color: '#F44336' },
])

const selectedMood = ref('')

const selectMood = (mood: any) => {
  selectedMood.value = mood.type
  emit('mood-change', mood)
}

const refreshMood = () => {
  moodList.value = moodList.value.sort(() => Math.random() - 0.5)
}

</script>

<style scoped>
.welcome-cards {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.welcome-card {
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-9));
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
</style>