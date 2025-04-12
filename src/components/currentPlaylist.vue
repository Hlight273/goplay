<template>
    <div v-show="curPlaylistOn" class="playlist-panel">
        <div class="panel-header black_flowing_panel">
        <span class="panel-title"> <el-icon><List /></el-icon></span>
        <el-icon class="close-btn" @click="curPlaylistOn = false"></el-icon>
        <!-- <el-icon class="close-btn" @click="curPlaylistOn = false"><Close /></el-icon> -->
        </div>
        <div class="panel-content black_flowing_panel">

            <ul class="songUl hide_scroll_child" v-if="goPlayer.personalPlaylist && goPlayer.personalPlaylist.length > 0">
                <li :class="['songLi', currentIndex === i ? 'select' : '']"
                    v-for="(songContent, i) in goPlayer.personalPlaylist" 
                    :key="i"
                    @click="selectSong(i)">
                <img :src='(songContent.coverBase64!=null)?
                    ("data:image/png;base64," + songContent.coverBase64):
                    require("@/assets/icons/default_album.png")' alt="">
                <span>{{ songContent.songInfo.songName }}</span>
                <span>{{ songContent.songInfo.songArtist }}</span>
                <span>{{ songContent.songInfo.songAlbum }}</span>
                <span>{{ formatDuration(songContent.songInfo.songDuration) }}</span>
                <span>
                    <el-icon @click="downloadSong(songContent.songUrl)"><Download/></el-icon>
                    {{ formatBytes(songContent.songInfo.songSize) }}
                    <div v-if="downloadedSongs[songContent.songUrl]" class="download-indicator"></div>
                </span>
                </li>
            </ul>
            <div class="empty-playlist" v-else>
                <el-icon class="empty-icon"><VideoPlay /></el-icon>
                <span class="empty-text">播放列表为空</span>
            </div>
        </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { useCommonStore } from "@/store/commonStore";
  import { storeToRefs } from "pinia";
  import { ref, computed } from 'vue';
  import { VideoPlay, DeleteFilled, Download, Close } from '@element-plus/icons-vue';
  import { GoPlayer } from '@/util/XgPlayer';
  import { formatDuration, formatBytes } from '@/util/commonUtil';
  import useCurrentInstance from "@/hooks/useCurrentInstance";
  import { eventBus, MEventTypes } from '@/util/eventBus';
  import { onMounted, onUnmounted } from 'vue';
  
  const { globalProperties } = useCurrentInstance();
  const commonStore = useCommonStore();
  const { curPlaylistOn, myUserinfo } = storeToRefs(commonStore);
  
  const goPlayer = GoPlayer.getInstance();
  const currentIndex = ref();
  const downloadedSongs = ref<Record<string, boolean>>({});
  
  onMounted(() => {
    eventBus.on(MEventTypes.SONG_LOADING_PROGRESS, handleDownloadProgress);
  });
  
  onUnmounted(() => {
    eventBus.off(MEventTypes.SONG_LOADING_PROGRESS, handleDownloadProgress);
  });
  
  const handleDownloadProgress = ({ url, progress }: { url: string, progress: number }) => {
    if (progress === 100) {
      downloadedSongs.value[url] = true;
      currentIndex.value = goPlayer.getLocalPlaylistIndex();
    }
  };
  
  const selectSong = (i: number): void => {
    if (i === currentIndex.value) return;
    goPlayer.setPlayer4localIndex(i);
    currentIndex.value = i;
  };
  
  const downloadSong = (songUrl: string) => {
    if (songUrl === undefined || songUrl === "" || songUrl === null) return;
    import('@/api/song').then(({ getSongFile }) => {
      getSongFile(songUrl, 0);
    });
  };
  </script>
  
  <style scoped>
  .dark-playlist-dialog {
    --el-dialog-bg-color: #1a1a1a;
    --el-dialog-text-color: #ffffff;
    --el-dialog-border-radius: 1vh;
  }
  
  .playlist-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  background: #1a1a1a;
  border-radius: 1vh;
  border: 1px solid #333;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  z-index: 2000;
  pointer-events: auto;
}



.panel-title {
    color: #6c6c6c;
    font-size: 1.8vh;
    font-weight: bold;
}

.close-btn {
    cursor: pointer;
    color: #000000;
    font-size: 1.4vh;
    transition: all 0.3s;
    background: #ff8181;
    border-radius: 2vh;
    box-shadow: 0.0vh -0.4vh 0.4vh 0px rgb(124 49 106 / 91%) inset;
    border: 0.4vh solid #333333;
}

.close-btn:hover {
  color: #fff;
  transform: scale(1.1);
  border: 0.4vh solid #633846;
}
.close-btn::after {
    content: '';
    /* flex: 0; */
    width: 0.5vh;
    height: 0.4vh;
    border-radius: 2vh;
    background: #ffb2d2;
    position: relative;
    top: -.2vh;
    left: -.01vh;
    border: .1vh solid #ffb6e5;
    box-shadow: 0.0vh 0.3vh 0.3vh 0px rgb(62 105 255 / 33%);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5vh;
  background: #262626;
  border-bottom: 1px solid #333;
  border-radius: 1vh 1vh 1vh 1vh;
  box-shadow: 0px -4.4vh 0.3vh 0px rgb(24 9 20 / 71%) inset;
}
.panel-content {
    padding: .2vh;
    color: #fff;
    overflow: hidden;
    box-shadow: 0px -1.4vh 0.4vh 0px rgb(24 9 20 / 71%) inset;
    padding-bottom: 30px;

}

  .empty-playlist {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5vh 0;
    color: #666;
  }
  
  .empty-icon {
    font-size: 5vh;
    margin-bottom: 2vh;
  }
  
  .empty-text {
    font-size: 1.6vh;
    margin-bottom: 2vh;
  }
  
  /* 歌曲列表样式 - 参考自goSongList.vue */
  .songUl {
    position: relative;
    width: calc(100% + 1.6vh);
    overflow-y: scroll;
    max-height: 52vh;
    padding-right: 2vh;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .songLi {
    margin: .6vh .6vh;
    padding: 0.3vh 0;
    display: flex;
    align-items: center;
    background-color: #2a2a2a;
    border-radius: .6vh;
    box-shadow: 0px 0px 0.2vh .1vh rgba(0, 0, 0, 0.3);
    transition: all 0.5s ease-out;
  }
  
  .songLi:hover {
    background-color: #333;
    transform: translateX(0.3vh);
  }
  
  .songLi.select {
    background-color: #3a3a3a;
    border-left: 3px solid #9f2336;
  }
  
  .songLi span {
    display: flex;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 1.28vh;
    color: #ccc;
  }
  
  .songLi img:nth-child(1) {
    margin: 0px 1.2vh 0 1vh;
    width: 3.5vh;
    height: 3.5vh;
    border-radius: .4vh;
  }
  
  .songLi span:nth-child(2) {
    flex: 8 1 0%;
  }
  
  .songLi span:nth-child(3) {
    flex: 3 1 0%;
  }
  
  .songLi span:nth-child(4) {
    flex: 3 1 0%;
  }
  
  .songLi span:nth-child(5) {
    flex: 1.5 1 0%;
  }
  
  .songLi span:nth-child(6) {
    flex: 2.2 1 0%;
    padding-right: 2vh;
    min-width: 12vw;
  }
  
  .songLi span:nth-child(6)>i {
    cursor: pointer;
    padding: .3vh;
    font-size: 2vh;
    color: #ab9bbb;
  }
  
  .songLi span.delete {
    flex: 0 1 0%;
    margin: 0 1vh;
    cursor: pointer;
    font-size: 1.6vh;
    color: #ffffff;
    border-radius: 2vh;
    background-color: #6f6f95;
    display: flex;
    justify-content: center;
    transition: all 0.3s ease-out;
  }
  
  .songLi:hover span.delete {
    flex: 1 1 0%;
  }
  
  .songLi span.delete i {
    height: 2.4vh;
    width: 2vh;
  }
  
  .songLi span.delete:hover {
    background-color: #ff4d4d;
  }
  
  /* 下载指示器样式 */
  .download-indicator {
    display: inline-block;
    width: 0.8vh;
    height: 0.8vh;
    border-radius: 50%;
    background-color: #4CAF50;
    margin-left: 0.5vh;
    vertical-align: middle;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7), 0 0 0 0 rgba(76, 175, 80, 0.4);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 0.2vh rgba(76, 175, 80, 0.4), 0 0 0 0.4vh rgba(76, 175, 80, 0.2);
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 0 0.4vh rgba(76, 175, 80, 0), 0 0 0 0.6vh rgba(76, 175, 80, 0);
      transform: scale(1);
    }
  }
  
  /* 移动端响应式样式 */
  @media screen and (max-width: 768px) {
    .songUl {
      width: 100%;
      padding-right: 1vh;
    }
  
    .songLi {
      margin: .4vh .4vh;
      padding: 0.2vh 0;
    }
  
    .songLi img:nth-child(1) {
      margin: 0px 0.8vh 0 0.8vh;
      width: 3vh;
      height: 3vh;
    }
  
    .songLi span:nth-child(2) {
      flex: 5 1 0%;
    }
    
    .songLi span:nth-child(3),
    .songLi span:nth-child(4) {
      display: none;
    }
    
    .songLi span:nth-child(5) {
      flex: 1 1 0%;
    }
    
    .songLi span:nth-child(6) {
      flex: 0.8 1 0%;
      padding-right: 1vh;
      font-size: 0;
    }
  
    .songLi span:nth-child(6)>i {
      font-size: 1.8vh;
      padding: .2vh;
    }
  
    .songLi span.delete {
      flex: 0.6 1 0%;
      margin: 0 0.8vh;
    }
  
    .songLi span.delete i {
      height: 2vh;
      width: 1.6vh;
    }
  
    .download-indicator {
      width: 0.6vh;
      height: 0.6vh;
      margin-left: 0.2vh;
    }
  }
  
  @media screen and (max-width: 480px) {
    .songLi img:nth-child(1) {
      width: 2.6vh;
      height: 2.6vh;
      margin: 0px 0.6vh 0 0.6vh;
    }
  
    .songLi span {
      font-size: 1.1vh;
    }
  
    .songLi span:nth-child(6)>i {
      font-size: 1.6vh;
    }
  
    .songLi span.delete {
      margin: 0 0.6vh;
    }
  
    .songLi span.delete i {
      height: 1.8vh;
      width: 1.4vh;
    }
  }
  </style>