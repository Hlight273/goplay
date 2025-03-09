<template>
    <div class="boxCd">
        <img 
        :src="!isNullorEmpty(curSong.coverBase64) ? 'data:image/png;base64,'+curSong.coverBase64 : cdURL" 
        :class="[!isNullorEmpty(curSong.songUrl) ? 'spin-element' : '',
                'cd',
                'un_selectable']"
        alt="" >
        <div class="songName limit_w">{{ isNullorEmpty(curSong.songInfo.songName)? '请选择歌曲':curSong.songInfo.songName }}</div>
        <div class="songArtist">{{ curSong.songInfo.songArtist }} - {{ curSong.songInfo.songAlbum }}</div>
        <el-button class="open-playlist-btn" @click="dialogVisible = true">
            <el-icon><Collection /></el-icon>
        </el-button>
   </div>

    <!-- 歌单弹框 -->
    <div class="playlist-out">
      <el-dialog  v-model="dialogVisible" title="加入我的歌单" @close="dialogVisible = false">
        <GoPlaylistPanel :song-id="curSong.songInfo.id"/>
      </el-dialog>
    </div>
   
</template>

<script lang="ts" setup>
import { ref,  } from 'vue'

import { Song } from '@/interface/song';
import { isNullorEmpty } from '@/util/commonUtil';
import GoPlaylistPanel from './goPlaylistPanel.vue';

const cdURL = require('@/assets/imgs/cd.png')
const props = defineProps<{curSong:Song.SongContent}>();

const dialogVisible = ref(false);




</script>

<style scoped>
.boxCd {
  position: relative;
    margin: 1vh;
    height: 95%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    align-content: center;
    flex-direction: column;
    background: rgb(60 60 61 / 57%);
    border-radius: .8vh;
    box-shadow: 0vh 0vh 1.1vh -0.5vh rgb(0 0 0 / 23%);
    color: aliceblue;
}
.boxCd .cd{
    margin: 4vh;
    margin-bottom: 0;
    width: 30vh;
    height: 30vh;
    background-color: #3c393c;
    border-radius: 100%;
    box-shadow: 0vh 0vh .1vh .5vh rgb(0 0 0 / 23%);
}
.boxCd .songName{
    max-width: 40vh;
    margin-top: 2vh;
    height: 5vh;
    display: flex;
    font-size: 1.9vh;
    justify-content: center;
    align-items: center;
}
.boxCd .songArtist{
    height: 1vh;
    display: flex;
    font-size: 1.24vh;
    justify-content: center;
    align-items: center;
}

@keyframes spin {  
  from {  
    transform: rotate(0deg);  
  }  
  to {  
    transform: rotate(360deg);  
  }  
}  
  
.spin-element {  
  animation: spin 30s linear infinite;  
}

.open-playlist-btn {
  position: absolute;
    background-color: #ffffff00;
    color: #ffffff;
    border-radius: 2vh;
    /* padding: 10px 15px; */
    border: none;
    font-size: 2vh;
    right: 1vh;
    bottom: 1vh;
    height: 4vh;
}


</style>

<style>
:deep(.playlist-out){
  border-radius: 1vh;
}
</style>