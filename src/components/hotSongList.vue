<template>
    <div class="hot-song-list">
      <div class="title-bar">
        <h3>{{ title }}</h3>
        <el-button link type="primary" @click="onMore">更多 ></el-button>
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
  import { ref, onMounted, onUnmounted } from 'vue'
  import { VideoPlay } from '@element-plus/icons-vue'
  import { Song } from '@/interface/song'
  import { formatDuration } from '@/util/commonUtil'
  import { GoPlayer } from '@/util/XgPlayer'
  import useCurrentInstance from "@/hooks/useCurrentInstance"
  import { eventBus, MEventTypes } from '@/util/eventBus'
  
  const { globalProperties } = useCurrentInstance()
  
  const props = defineProps({
    title: {
      type: String,
      default: '推荐歌曲~'
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
  </script>
  
  <style scoped>
  .hot-song-list {
    padding: 15px;
    border-radius: 8px;
    background: var(--el-bg-color);
    height: 100%;
  }
  
  .title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
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