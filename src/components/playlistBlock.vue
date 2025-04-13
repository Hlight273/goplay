<template>
    <div class="playlist-item" @click="selectPlaylist(playlistInfo)">
        <div class="tag" :class="{ 'private-tag': !playlistInfo.playlist.isPublic }">
            {{ playlistInfo.playlist.isPublic? '公开':'私密'}}
        </div>
        <div class="cover-container">
            <img :src='(playlistInfo.playlist.coverUrl!=null&&playlistInfo.playlist.coverUrl!="")?
                (getPlaylistCoverURL(playlistInfo.playlist.coverUrl)):
                require("@/assets/icons/audio_folder.png")' class="playlist-cover" />
            <div class="title-overlay">
                <p>{{ playlistInfo.playlist.title }}</p>
                <span class="song-count">{{ playlistInfo.songContentList.length }}首</span>
            </div>
        </div>
    </div>
     <!-- 歌单详情弹出层 -->
    <div v-if="selectedPlaylistInfo.playlist.id>=0" class="playlist-overlay" >
        <div class="playlist-content">
            <!-- <el-icon class="close_btn" @click="closePlaylist"><CloseBold/></el-icon> -->
            <el-icon class="close_btn" @click="closePlaylist"><el-icon><CloseBold /></el-icon></el-icon>
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
import { checkIsLogin } from '@/util/pageUtil';
import { formatDate } from '@/util/commonUtil'

import { useCommonStore } from '@/store/commonStore'
const commonStore = useCommonStore()

const props = defineProps<{
    playlistInfo: Playlist.PlaylistInfo;
    myUserinfo: User.UserInfo;
}>();
const selectedPlaylistInfo = reactive<Playlist.PlaylistInfo>({...Playlist.playlistInfo_InitData});
const selectPlaylist = (playlistInfo:Playlist.PlaylistInfo) => {
  if(!checkIsLogin())return;
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
    width: 20vh;
}

.cover-container {
    position: relative;
    width: 20vh;
    height: 20vh;
    overflow: hidden;
    border-radius: 5px;
}

.playlist-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease-in-out;
    background-color: #3c393c;
}

.title-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
    padding: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.title-overlay p {
    color: white;
    margin: 0;
    font-size: 1.4vh;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
    flex: 1;
    margin-right: 8px;
}

.song-count {
    color: #ffffff;
    font-size: 1.2vh;
    white-space: nowrap;
    opacity: 0.8;
}

.cover-container:hover .playlist-cover {
    transform: scale(1.01);
}

.cover-container:hover .title-overlay {
    transform: translateY(0);
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
    padding-bottom: 4.6vh;
    width: 90%;
    max-height: 64vh;
    background-color: #f7f7f7;
    border-radius: 3vh;
    border: .3vh solid #5d5d5d;
    box-shadow: 0px -.5vh .2vh 0px rgb(94 90 133 / 84%) inset;
    overflow: hidden;
}

.playlist-content .infobox {
    display: flex;
    gap: 2vh;
    padding: 2vh;
    background: linear-gradient(145deg, #ffffff, #f5f5f5);
    border-radius: 2vh;
    margin: 1vh;
    box-shadow: 0 0.2vh 1vh rgba(0, 0, 0, 0.05);
    position: relative; /* 添加相对定位 */
}

.playlist-content .infobox .mini-cover {
    width: 12vh;
    height: 12vh;
    border-radius: 1.5vh;
    border: 0.2vh solid #e8e8f3;
    box-shadow: 0 0.4vh 1vh rgba(0, 0, 0, 0.1);
    object-fit: cover;
}

.playlist-content .infobox .column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.5vh;
    padding: 0.5vh;
}

.playlist-content .infobox .column h3 {
    color: #333;
    font-size: 2vh;
    font-weight: 600;
    margin: 0;
    padding: 0;
    line-height: 1.4;
    max-width: 100%;
}

.playlist-content .infobox .column span {
    color: #666;
    font-size: 1.4vh;
    line-height: 1.6;
    padding: 1vh 1.5vh;
    background:#ffffff;
    border-radius: 1vh;
    border: 0.1vh solid #eef0ff;
    box-shadow: 0 0.2vh 0.4vh rgba(0, 0, 0, 0.05);
}

.playlist-content .infobox .creater {
    position: absolute;
    bottom: 0.5vh;
    right: 0vh;
    display: flex
;
    align-items: center;
    gap: 0.8vh;
    font-size: 1.3vh;
    color: #888;
    background: rgb(255 254 254 / 70%);
    padding: 0.8vh 1.2vh;
    border-radius: 1vh;
    -webkit-backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    box-shadow: 0 0.1vh 0.3vh rgba(0, 0, 0, 0.05);
    height: 16px;
}

.playlist-content .infobox .creater .username {
    padding: 0.4vh 1vh;
    color: #7a7aff;
    background: #f0f0ff;
    border-radius: 0.8vh;
    border: 0.1vh solid #e0e0ff;
    box-shadow: none;
    font-size: 1.3vh;
    font-weight: 500;
    transition: all 0.3s ease;
}

.playlist-content .infobox .creater .username:hover {
    background: #e6e6ff;
    transform: translateY(-0.1vh);
}

/* 添加移动端适配 */
@media screen and (max-width: 768px) {
    .playlist-content .infobox {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 1.5vh;
        gap: 1.5vh;
        padding-bottom: 5vh;
    }

    .playlist-content .infobox .column {
        width: 100%;
        align-items: center;
    }

    .playlist-content .infobox .creater {
        justify-content: center;
        flex-wrap: wrap;
        bottom: 1vh;
        right: 1.5vh;
        font-size: 1.2vh;
        bottom: 0.4vh;
    }
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
    position: absolute;
    left: 0.8vh;
    top: 0.8vh;
    z-index: 400;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.4vh 1.2vh;
    font-size: 1.2vh;
    font-weight: 500;
    color: white;
    background: linear-gradient(135deg, #ff71bc, #43bdff);
    border-radius: 1vh;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(4px);
    transition: all 0.3s ease;
    border: none;
    min-width: auto;
    white-space: nowrap;
}

.tag::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 1vh;
    padding: 0.1vh;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
}
.private-tag {
    background: linear-gradient(135deg, #a940ff, #e09e8b);
}

.playlist-item:hover .tag {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.playlist-content .close_btn {
    cursor: pointer;
    font-size: 1.4vh;
    position: absolute;
    top: 1.4vh;
    right: 2vh;
    width: 1.6vh;
    height: 1.6vh;
    border-radius: 50%;
    display: flex
;
    align-items: center;
    justify-content: center;
    background: #c8c5d8;
    transition: all 0.3s ease;
    color: #ffffff;
    border: .3vh solid #eaedf5;
    z-index: 1;
}

.playlist-content .close_btn:hover {
    transform: scale(1.1);
    color: #ffffff;
    border: .3vh solid #f1f3ff;
}

.playlist-content .close_btn:active {
    transform: scale(1.1);
    color: #ffffff;
    border: .3vh solid  #f1f3ff;
}

/* 移动端适配时调整创建者信息的位置 */
@media screen and (max-width: 768px) {
    
}
</style>