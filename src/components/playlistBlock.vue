<template>
    <div class="playlist-item" @click="selectPlaylist(playlistInfo)">
        <div class="tag">{{ playlistInfo.playlist.isPublic? '公开':'私密'}}</div>
        <img :src='(playlistInfo.playlist.coverUrl!=null&&playlistInfo.playlist.coverUrl!="")?
            (getPlaylistCoverURL(playlistInfo.playlist.coverUrl)):
            require("@/assets/icons/audio_folder.png")' class="playlist-cover" />
        <p class="super_submit">{{ playlistInfo.playlist.title }}</p>
    </div>
     <!-- 歌单详情弹出层 -->
    <div v-if="selectedPlaylistInfo.playlist.id>=0" class="playlist-overlay" >
        <div class="playlist-content">
            <!-- <el-icon class="close_btn" @click="closePlaylist"><CloseBold/></el-icon> -->
            <el-icon class="close_btn" @click="closePlaylist"><el-icon><CircleCloseFilled /></el-icon></el-icon>
            <div class="infobox">
                <img :src='(playlistInfo.playlist.coverUrl!=null&&playlistInfo.playlist.coverUrl!="")?
                    (getPlaylistCoverURL(playlistInfo.playlist.coverUrl)):
                    require("@/assets/icons/audio_folder.png")' class="playlist-cover mini-cover" />
                <div class="column">
                    <h3>{{ selectedPlaylistInfo.playlist.title }}</h3>
                    <span>简介：{{ selectedPlaylistInfo.playlist.description }}</span>
                </div>
                <div class="creater">
                    <span>{{ formatDate(selectedPlaylistInfo.playlist.addedAt) }}</span>
                    用户<span class="username" @click="commonStore.openUserPage_byUserInfo(ownerUserInfo)">
                        {{ ownerUserInfo.nickname }}
                    </span>创建
                </div>
            </div>
           
            <GoSongList 
                :my-user-info="myUserinfo" 
                :playlist-info="selectedPlaylistInfo"
                :is-room-playlist="false"/>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { getPlaylistCoverURL } from '@/api/static';
import { Playlist } from '@/interface/playlist';
import { User } from '@/interface/user';
import { GoPlayer } from '@/util/XgPlayer';
import {defineProps, onMounted, reactive} from 'vue'
import GoSongList from '@/components/goSongList.vue'
import { userInfo } from '@/api/user';
import { ResultCode } from '@/util/webConst';

import { useCommonStore } from "@/store/commonStore";
import { formatDate } from '@/util/commonUtil';
const commonStore = useCommonStore();

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

const ownerUserInfo = reactive<User.UserInfo>({
        id: 0,
        username: "",
        avatarUrl: "",
        level: 0,
        nickname: ""
    })
onMounted(()=>{
    userInfo(props.playlistInfo.playlist.userId).then((res)=>{
        if(res.code == ResultCode.SUCCESS){
            Object.assign(ownerUserInfo, res.oData);
        }
    })
})
</script>

<style scoped>
.playlist-item {
    display: flex;
    position: relative;
    text-align: center;
    cursor: pointer;
    flex-direction: column;
    align-items: center;
}
.playlist-item p {
    color: #ffffff;
    display: flex;
    font-size: 1.4vh;
    align-items: center;
    justify-content: center;
    border-radius: 2vh;
    width: 14vh;
    height: 2vh;
    margin-top: 1vh;
    font-family: auto;
}


.playlist-cover {
  width: 20vh;
  height: 20vh;
  border-radius: 5px;
  transition: transform 0.3s ease-in-out;
  object-fit: cover;
  border: .2vh solid #aca6c7;
  background-color: #3c393c;
}

.playlist-cover:hover {
    transform: scale(1.02);
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
    display: flex;
    flex-direction: column;
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
    color: var(--el-color-primary);
    cursor: pointer;
    font-size: 2.2vh;
    position: absolute;
    top: 1.4vh;
    right: 2vh;
    color: #b99ec0;
}
.playlist-content .infobox {
    display: flex;
}
.playlist-content .infobox .column {
    position: relative;
    display: flex;
    flex-direction: column;
    margin-top: .5vh;
    width: 60%;
}
.playlist-content .infobox .column h3 {
    color: #907676;;
    font-size: 1.8vh;
    font-weight: lighter;
    /* background: #9084ff; */
    display: inline-block;
    padding: .5vh 1vh;
    border-radius: 1.6vh;
    font-family: math;
    max-width: 90%;
}
.playlist-content .infobox .column span {
    margin-left: 1vh;
    box-sizing: border-box;
    color: #ae99a5;
    font-size: 1.4vh;
    padding: .4vh .8vh;
    background: #f2f2f2;
    border-radius: 1.5vh;
    border: .1vh solid #d4c3da;
}
.playlist-content .infobox .mini-cover {
    width: 10vh;
    height: 10vh;
    border-radius: 2vh;
    border: .2vh solid #cdc6eb;
    margin: .4vh;
}
.playlist-content .infobox .creater {
    position: absolute;
    font-size: 1.4vh;
    /* background-color: #dedbed; */
    border-radius: 2vh;
    padding: .4vh .8vh;
    margin: .4vh;
    /* border: .1vh solid #d4c3da; */
    right: 1vh;
    top: 8vh;
    color: #d1c7c7;
}
.playlist-content .infobox .creater .username {
    padding: .1vh .6vh;
    cursor: pointer;
    color: white;
    background-color: #e6b8dd;
    border-radius: 1vh;
    border: .4vh solid #bfd4ff;
    box-shadow: 0px -.7vh .2vh 0px rgb(152 164 217 / 84%) inset;
    font-size: 1.2vh;
    font-weight: bold;
}

.tag {
    left: 0.4vh;
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
    border: .2vh solid #aca6c7;
}


</style>