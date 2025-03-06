<template>
    <div class="playlist-item" @click="selectPlaylist(playlistInfo)">
        <div class="tag">{{ playlistInfo.playlist.isPublic? '公开':'私密'}}</div>
        <img :src='(playlistInfo.playlist.coverUrl!=null&&playlistInfo.playlist.coverUrl!="")?
            (getPlaylistCoverURL(playlistInfo.playlist.coverUrl)):
            require("@/assets/icons/audio_folder.png")' class="playlist-cover" />
        <p>{{ playlistInfo.playlist.title }}</p>
    </div>
     <!-- 歌单详情弹出层 -->
    <div v-if="selectedPlaylistInfo.playlist.id>=0" class="playlist-overlay" >
        <div class="playlist-content">
            <el-icon class="close_btn" @click="closePlaylist"><CloseBold/></el-icon>
            <h3>{{ selectedPlaylistInfo.playlist.title }}</h3>
            <span>{{ selectedPlaylistInfo.playlist.description }}</span>
            <GoSongList 
                :my-user-info="myUserinfo" 
                :playlist-id="selectedPlaylistInfo.playlist.id"
                :song-content-list="selectedPlaylistInfo.songContentList"
                :is-room-playlist="false"/>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { getPlaylistCoverURL } from '@/api/static';
import { Playlist } from '@/interface/playlist';
import { User } from '@/interface/user';
import { GoPlayer } from '@/util/XgPlayer';
import {defineProps, reactive} from 'vue'
import GoSongList from '@/components/goSongList.vue'
import { isNothing } from '@/util/commonUtil';

const props = defineProps<{
    playlistInfo: Playlist.PlaylistInfo;
    myUserinfo: User.UserInfo;
}>();
const selectedPlaylistInfo = reactive<Playlist.PlaylistInfo>({...Playlist.playlistInfo_InitData});
const selectPlaylist = (playlistInfo:Playlist.PlaylistInfo) => {
  Object.assign(selectedPlaylistInfo, playlistInfo);
  GoPlayer.getInstance().loadPlaylist4local(playlistInfo.songContentList)
};
const closePlaylist = ()=>{
  Object.assign(selectedPlaylistInfo, Playlist.playlistInfo_InitData);
}
</script>

<style scoped>
.playlist-item {
    position: relative;
  text-align: center;
  cursor: pointer;
}

.playlist-cover {
  width: 20vh;
  height: 20vh;
  border-radius: 5px;
  transition: transform 0.3s ease-in-out;
}

.playlist-cover:hover {
    transform: scale(1.05);
}

.playlist-overlay {
    z-index: 1001;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
}

.playlist-content {
    position: relative;
    padding: 0 1vh;
    padding-top: 1vh;
    padding-bottom: 1.6vh;
    width: 90%;
    max-height: 64vh;
    background-color: #f5f5f6;
    border-radius: 3vh;
    border: .4vh solid #867789;
    box-shadow: 0px -.7vh .2vh 0px rgb(94 90 133 / 84%) inset;
    overflow: hidden;
}

.playlist-content .close_btn {
    cursor: pointer;
    color: var(--el-color-primary);
    font-size: 2.2vh;
    position: absolute;
    top: 1vh;
    right: 1vh;
}

.tag {
    top: 1vh;
    z-index: 1000;
    position: absolute;
    display: flex;
    justify-content: center;
    background-color: #85849d;
    padding: 0.3vh;
    font-size: 1.4vh;
    font-weight: bold;
    border-radius: 5vh;
    width: 4vh;
    color: white;
}
</style>