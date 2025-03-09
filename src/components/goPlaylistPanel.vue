<template>
    <ul class="songUl">
        <li class="songLi" 
            v-for="info in myPlaylistInfos" 
            :key="info.playlist.id"
            @click="addSongToPlaylist(info.playlist.id, songId)">
            <img :src='(info.playlist.coverUrl!=null&&info.playlist.coverUrl!="")?
            (getPlaylistCoverURL(info.playlist.coverUrl)):
            require("@/assets/icons/audio_folder.png")' class="playlist-cover" />
            <span>{{ info.playlist.title }}</span>
            <span>{{ info.songContentList.length }} 首歌曲</span>
            <span>{{ info.playlist.updateAt }}</span>
        </li>
    </ul>
</template>

<script setup lang="ts">
import { defineProps, onMounted, reactive } from "vue";
import { addSongInPlaylist } from "@/api/playlist";
import { Playlist } from "@/interface/playlist";
import { userPlaylistInfo } from "@/api/user";
import { ResultCode } from "@/util/webConst";
import { ElMessage } from "element-plus";
import { getPlaylistCoverURL } from "@/api/static";

const userId = Number(localStorage.getItem("userid"));
interface Props {
  songId: number;
}
const props = defineProps<Props>();
const myPlaylistInfos = reactive<Playlist.PlaylistInfo[]>([]);

const addSongToPlaylist = (playlistId: number, songId: number) => {
  addSongInPlaylist(playlistId, songId).then(
  (res)=>{   
    switch (res.code) {
      case ResultCode.SUCCESS:
        ElMessage.success(res.message);
        break;
      default:
        break;
    }
  });
};


onMounted(() => {
  userPlaylistInfo(userId).then(
  (res)=>{   
    switch (res.code) {
      case ResultCode.SUCCESS:
        Object.assign(myPlaylistInfos,res.oData);
        break;
      case ResultCode.EMPTY:          
        break;
      default:
        break;
    }
  });
})
</script>

<style scoped>
.songUl {
  position: relative;
  width: calc(100% + 1.6vh);
  overflow-y: scroll;
  max-height: 52vh;
  padding-right: 2vh;
}

.songLi {
  margin: 0.6vh 0.6vh;
  padding: 0.3vh 0;
  display: flex;
  align-items: center;
  background-color: #ededf1;
  border-radius: 0.6vh;
  box-shadow: 0px 0px 0.2vh 0.1vh rgb(91 98 116 / 20%);
  transition: all 0.3s ease-out;
  cursor: pointer;
}

.songLi:hover {
  background-color: #dcdcdc;
}

.songLi img {
  margin: 0px 1.2vh 0 1vh;
  width: 3.5vh;
  height: 3.5vh;
  border-radius: 0.4vh;
}

.songLi span {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 1.28vh;
  color: #474747;
}
</style>
