<template>
    <div class="panel" :class="{'panel-hidden': !dissolveOn}">
        <div class="inner_pannel">
            <div class="cdbox">
                <AudioCdPlayerDark :cur-song="curSong"></AudioCdPlayerDark>
            </div>
            
        </div>
    </div>
    
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { storeToRefs } from "pinia";
import { useCommonStore } from "@/store/commonStore";
import AudioCdPlayerDark from './audioCdPlayerDark.vue';

import { Song } from '@/interface/song';
import { eventBus, MEventTypes } from '@/util/eventBus';
const commonStore = useCommonStore();
const { dissolveOn } = storeToRefs(commonStore);



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
    eventBus.on(MEventTypes.PLAY_NEW_SONG_LOCAL, updateCurSong);
});

onUnmounted(() => {
    eventBus.off(MEventTypes.PLAY_NEW_SONG_LOCAL, updateCurSong);
});

const updateCurSong = (songContent: Song.SongContent | null)=>{
    if(songContent==null)
        return;
    Object.assign(curSong, songContent);
}

</script>

<style scoped>
.panel {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 2000;
    top: 0;
    opacity: 1;
    visibility: visible;
    transition:  opacity 1.2s ease, visibility 0s 0.42s; /* 延迟 visibility */
    box-sizing: border-box;
    display: flex;
    background-color: #1c1c1c;
   
}
.inner_pannel {
    background: #313131;
    border-radius: 1.6vh;
    border: 0.2vh solid #262627;
    box-shadow: 1px -7.23vh 0.6vh 0px rgb(16 15 18 / 57%) inset;
    width: 100%;
    display: flex
;
    justify-content: center;
}
.cdbox {
    margin-top: 10vh;
    width: 46vh;
    height: 65vh;
    box-shadow: 1px -1.23vh 0.4vh 0px rgb(16 15 18 / 57%) inset;
    border-radius: .8vh;
}

.panel-hidden {
    opacity: 0;
    visibility: hidden;
}

.test {
    position: fixed;
    width: 6vh;
    height: 6vh;
    z-index: 99999;
}


</style>