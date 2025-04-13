<template>
    <div class="hot-song-list">
      <div class="title-bar">
        <div class="title-wrapper">
          <el-icon class="title-icon"><Histogram /></el-icon>
          <h3>{{ title }}</h3>
          <div class="hot-tag">HOT</div>
          <div class="update-time">{{ updateTimeText }}</div>
        </div>
        <!-- <el-button link type="primary" class="more-btn" @click="onMore">
          <span>更多</span>
          <el-icon><ArrowRight /></el-icon>
        </el-button> -->
      </div>
      <ul class="songUl">
        <li :class="['songLi', selectedIndex == i ? 'select' : '']"
          v-for="(songContent, i) in songs" 
          @click="(event:any) => selectSong(event, i)">
          <img :src='(songContent.coverBase64!=null)?
            ("data:image/png;base64," + songContent.coverBase64):
            require("@/assets/icons/default_album.png")' alt="">
          <div class="song-info">
            <span class="song-name">{{ songContent.songInfo.songName }}</span>
            <span class="song-artist">{{ songContent.songInfo.songArtist }}</span>
          </div>
          <span class="song-duration">{{ formatDuration(songContent.songInfo.songDuration) }}</span>
          <el-button link type="primary" class="play-btn">
            <el-icon><VideoPlay /></el-icon>
          </el-button>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { VideoPlay } from '@element-plus/icons-vue'
  import { Song } from '@/interface/song'
  import { formatDuration } from '@/util/commonUtil'
  import { GoPlayer } from '@/util/XgPlayer'
  import useCurrentInstance from "@/hooks/useCurrentInstance"
  import { eventBus, MEventTypes } from '@/util/eventBus'
import { checkIsLogin } from '@/util/pageUtil'
  
  const { globalProperties } = useCurrentInstance()
  
  const props = defineProps({
    title: {
      type: String,
      default: '必听前10！~'
    },
    songs: {
      type: Array as () => Song.SongContent[],
      required: true
    }
  })
  
  const emit = defineEmits(['play', 'more'])
  const selectedIndex = ref<number>(-1)
  
  onMounted(() => {
    eventBus.on(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged)
  })
  
  onUnmounted(() => {
    eventBus.off(MEventTypes.GOPLAYER_MODE_CHANGED, handleModeChanged)
  })
  
  const handleModeChanged = (val: boolean) => {
    if (val) {
      globalProperties?.$message.closeAll()
      globalProperties?.$message.info("请先切换到单人模式！")
    }
  }
  
  const selectSong = (event: MouseEvent, i: number): void => {
    if(!checkIsLogin())return;
    event.stopPropagation()
    GoPlayer.getInstance().loadPlaylist4local(props.songs);
    if(GoPlayer.isRoomMode()) {
      globalProperties?.$message.closeAll()
      globalProperties?.$message.info("请先切换到单人模式！")
      return
    }
  
    if(i == selectedIndex.value) return
  
    selectedIndex.value = i
    globalProperties?.$GoPlayer.setPlayer4localIndex(i)
    emit('play', props.songs[i])
  }
  
  const onMore = () => {
    emit('more')
  }

  const updateTimeText = computed(() => {
  const hours = new Date().getHours()
  if (hours >= 6 && hours < 12) {
    return '早间推荐'
  } else if (hours >= 12 && hours < 18) {
    return '下午推荐'
  } else if (hours >= 18 && hours < 24) {
    return '晚间推荐'
  } else {
    return '深夜推荐'
  }
})
  

  </script>
  
  <style scoped>
  .hot-song-list {
    padding: 15px;
    border-radius: 8px;
    background: var(--el-bg-color);
    height: 100%;
    margin-top: -17px;
  }
  
  .title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 10px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.title-icon {
  font-size: 20px;
  color: var(--el-color-primary);
  animation: bounce 2s infinite;
}

.title-wrapper h3 {
  font-size: 18px;
  margin: 0;
  background: linear-gradient(to right, var(--el-color-primary), #909399);
  -webkit-background-clip: text;  /* 之前是--webkit-background-clip，多了一个- */
  background-clip: text;  /* 添加标准属性 */
  -webkit-text-fill-color: transparent;  /* 添加这行确保文字透明 */
  white-space: nowrap;  /* 防止文字换行 */
  padding-right: 8px;  /* 添加一些间距 */
}

.hot-tag {
  background: linear-gradient(45deg, #ff4e50, #f9d423);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  animation: pulse 1.5s infinite;
  margin: 0 4px;  /* 添加左右间距 */
}

.update-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-color-primary-light-9);
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;  /* 防止文字换行 */
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s;
}

.more-btn:hover {
  transform: translateX(4px);
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
  
  .songUl {
    position: relative;
    width: 100%;
    overflow-y: auto;
    max-height: calc(100% - 50px);
  }
  
  .songLi {
    margin: 8px 0;
    padding: 8px;
    display: flex;
    align-items: center;
    background-color: var(--el-bg-color-page);
    border-radius: 6px;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .songLi:hover {
    background-color: var(--el-color-primary-light-9);
  }
  
  .songLi.select {
    background-color: var(--el-color-primary-light-8);
  }
  
  .songLi img {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    margin-right: 12px;
  }
  
  .song-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .song-name {
    font-size: 14px;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .song-artist {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }
  
  .song-duration {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 0 12px;
  }
  
  .play-btn {
    padding: 8px;
  }
  
  .play-btn:hover {
    color: var(--el-color-primary);
  }
  </style>