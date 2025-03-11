<template>

   
    <div class="panel" :class="{'panel-hidden': !dissolveOn}">
        <div class="tabBox">
                <el-tabs v-model="currentPageState" type="card" class="room-tabs">
                    <el-tab-pane label="音乐" :name="PageStatus.MUSIC" add-icon>
                        <template #label><span class="custom-tabs-label"><el-icon><Headset/></el-icon></span></template>
                    </el-tab-pane>
                    <el-tab-pane v-if="curSong.songInfo.id>=0" label="歌单" :name="PageStatus.RECOMMEND" add-icon>
                        <template #label><span class="custom-tabs-label"><el-icon><ChatDotSquare /></el-icon></span></template>
                    </el-tab-pane>
                </el-tabs>
            </div>
        <div class="inner_pannel">
            
            <div v-show="currentPageState==PageStatus.MUSIC" class="content">
                <AudioCdPlayerDark :cur-song="curSong"></AudioCdPlayerDark>
            </div>
            <div v-show="currentPageState==PageStatus.RECOMMEND" class="content">
                <CommentList :cur-song="curSong"></CommentList>
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
import CommentList from './commentList.vue';
const commonStore = useCommonStore();
const { dissolveOn } = storeToRefs(commonStore);

enum PageStatus {
  MUSIC = 0,
  RECOMMEND = 1,
}
const currentPageState = ref(PageStatus.MUSIC)


let curSong = reactive<Song.SongContent>({
    songInfo: {
        id: -1,
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
    align-items: center;
    flex-direction: column;
}
.panel-hidden {
    opacity: 0;
    visibility: hidden;
}
.inner_pannel {
    background: #313131;
    border-radius: 1.6vh;
    border: 0.2vh solid #262627;
    box-shadow: 1px -1.0vh 0.6vh 0px rgb(16 15 18 / 57%) inset;
    width: 80vw;
    box-sizing: border-box;
    display: flex;
    /* justify-content: center; */
    flex-direction: column;
    align-items: center;
    height: 82vh;
    /* margin-top: 5vh; */
    min-width: 50vh;
}
.content {
    margin-top: 4vh;
    width: 90%;
    height: 71vh;
    box-shadow: 1px -1.23vh 0.4vh 0px rgb(16 15 18 / 57%) inset;
    border-radius: .8vh;
    min-width: 40vh;
}

.tabBox {
  margin-left: 15px;
  margin-top: 5vh;
  height: 3vh;
  /* width: 100%; */
  display: flex;
  align-items: flex-start;
  /* justify-content: center; */
}

:deep(.el-tabs__item){
    height: 3.2vh;
    width: 10vh;
    color: #616463;
    font-size: 1.3vh;
}
:deep(.el-tabs__item.is-active){
    color: #b74343;
    border-bottom: .3vh solid #c75151 !important;
    box-shadow: 0px -0.23vh 0.5vh 0.2vh rgb(16 15 18 / 57%) inset;
    border-top-left-radius: 3vh;
    border-top-right-radius: 3vh;
    background: #313131;

}
</style>