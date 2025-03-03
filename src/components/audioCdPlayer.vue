<template>
    <div class="boxCd">
        <img 
        :src="!isNullorEmpty(curSong.coverBase64) ? 'data:image/png;base64,'+curSong.coverBase64 : cdURL" 
        :class="[!isNullorEmpty(curSong.songUrl) ? 'spin-element' : '',
                'cd',
                'un_selectable']"
        alt="" >
        <div class="songName">{{ isNullorEmpty(curSong.songInfo.songName)? '请选择歌曲':curSong.songInfo.songName }}</div>
        <div class="songArtist">{{ curSong.songInfo.songArtist }} - {{ curSong.songInfo.songAlbum }}</div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch, onUpdated, onActivated, onBeforeMount, Ref, onUnmounted } from 'vue'
import useCurrentInstance from "@/hooks/useCurrentInstance";
import { GoPlayer } from '@/util/XgPlayer';
import { eventBus, MEventTypes } from '@/util/eventBus';
import { Song } from '@/interface/song';
import { isNullorEmpty } from '@/util/commonUtil';
const { globalProperties } = useCurrentInstance();

const cdURL = require('@/assets/imgs/cd.png')
let curSong = reactive<Song.SongContent>({
    songInfo: {
        id: 0,
        songName: '',
        songArtist: '',
        songDuration: 0,
        songAlbum: '',
        songSize: 0
    },
    coverBase64: '',
    songUrl: ''
})
onMounted(() => {
    eventBus.on(MEventTypes.PLAY_NEW_SONG, updateCurSong);
});

onUnmounted(() => {
    eventBus.off(MEventTypes.PLAY_NEW_SONG, updateCurSong);
});

const updateCurSong = (songContent: Song.SongContent | null)=>{
    if(songContent==null)
        return;
    Object.assign(curSong, songContent);
}




</script>

<style scoped>
.boxCd {
    margin: 1vh;
    height: 95%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    align-content: center;
    flex-direction: column;
    background: #f2f1f2;
    border-radius: .8vh;
    box-shadow: 0vh 0vh 1.1vh -0.5vh rgb(0 0 0 / 23%);
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
  /* 其他样式，比如宽高、颜色等 */  
}
</style>