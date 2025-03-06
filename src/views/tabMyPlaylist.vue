<template>
<!-- 我的歌单 -->
<div class="recommend-container">
    <h2>我的歌单 <el-button class="super_submit" @click="openDialog_AddPlaylist">新建歌单</el-button></h2>
    <div class="recommend-list">
        <div v-for="(playlistInfo, index) in myPlaylistInfos" :key="index" >
          
          <el-button class="super_submit" @click="openDialog_UpdatePlaylist(playlistInfo.playlist)">编辑歌单</el-button>
          <PlaylistBlock :playlist-info="playlistInfo" :my-userinfo="myUserinfo"/>
        </div>
    </div>
</div>


<!-- 新建歌单弹出框 -->
<el-dialog v-model="dialogVisible" :title="isUpdateDialog?'修改信息':'新建歌单'" @close="resetForm">
    <el-form :model="playlistFormData" ref="formRef" label-width="80px">
      <el-form-item label="歌单标题" :rules="[ { required: true, message: '请输入歌单标题', trigger: 'blur' } ]">
        <el-input v-model="playlistFormData.title" placeholder="请输入歌单标题" />
      </el-form-item>
      <el-form-item label="歌单描述" :rules="[ { required: true, message: '请输入歌单描述', trigger: 'blur' } ]">
        <el-input v-model="playlistFormData.description" placeholder="请输入歌单描述" />
      </el-form-item>
      <el-form-item label="封面">
        <ImageUploader :upload-callback="onImageUpload"></ImageUploader>
      </el-form-item>
      <el-form-item label="公开">
        <el-switch v-model="playlistFormData.isPublic" :active-value="1" :inactive-value="0" active-text="公开" inactive-text="私密" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="isUpdateDialog?submitUpdatePlaylist():submitAddPlaylist()">确定</el-button>
      <el-button v-show="isUpdateDialog" class="super_submit" @click="deletePlaylist">删除歌单</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { userInfo, userPlaylistInfo } from '@/api/user';
import { Playlist } from '@/interface/playlist';
import { User } from '@/interface/user';
import { ResultCode } from '@/util/webConst';
import { onMounted, reactive, ref } from 'vue';
import { addPlaylist, removePlaylist, updatePlaylist } from '@/api/playlist';
import { getPlaylistCoverURL } from '@/api/static';
import { uploadPlaylistCover } from '@/api/upload';
import { ElMessage } from 'element-plus';
import ImageUploader from '@/components/ImageUploader.vue'
import PlaylistBlock from '@/components/playlistBlock.vue'
const userId = Number(localStorage.getItem("userid"));
const myUserinfo = ref<User.UserInfo>({
  id: 0,
  username: '',
  avatarUrl: '',
  level:0
});

const myPlaylistInfos = reactive<Playlist.PlaylistInfo[]>([]);

const dialogVisible = ref(false); // 新建歌单显示与否
const isUpdateDialog = ref(false); //控制删除歌单按钮是否显示
const playlistFormData = reactive<Playlist.PlaylistForm>({...Playlist.playlistForm_InitData});

const openDialog_AddPlaylist = () =>  dialogVisible.value = true;
const openDialog_UpdatePlaylist = (playlist:Playlist.Playlist) => {
  playlistFormData.id = playlist.id;
  playlistFormData.title = playlist.title;
  playlistFormData.coverUrl = playlist.coverUrl;
  playlistFormData.description = playlist.description;
  playlistFormData.isPublic = playlist.isPublic;
  isUpdateDialog.value = true;
  dialogVisible.value = true;
}

const resetForm = () => {
  Object.assign(playlistFormData, {...Playlist.playlistForm_InitData})
}

const submitAddPlaylist = () => {
  addPlaylist(playlistFormData) .then(
    (res) => {
    switch (res.code) {
      case ResultCode.SUCCESS:
        myPlaylistInfos.push({playlist:res.oData, songContentList:[]});

        ElMessage.success(res.message);
        dialogVisible.value = false; // 关闭创建歌单弹框
        isUpdateDialog.value = false; // 状态恢复
        break;
      default:
        break;
    }
  })
};
const submitUpdatePlaylist = () => {
  updatePlaylist(playlistFormData.id, playlistFormData).then(
    (res) => {
    switch (res.code) {
      case ResultCode.SUCCESS:
        for (let i = 0; i < myPlaylistInfos.length; i++) {
          const info = myPlaylistInfos[i];
          if(info.playlist.id == res.oData.id){
            info.playlist.title = res.oData.title;
            info.playlist.coverUrl = res.oData.coverUrl;
            info.playlist.description = res.oData.description;
            info.playlist.isPublic = res.oData.isPublic;
            ElMessage.success(res.message);
            dialogVisible.value = false; // 关闭创建歌单弹框
            isUpdateDialog.value = false; // 状态恢复
            return;
          }
        }
        break;
      default:
        break;
    }
  })
}

const deletePlaylist = () => {
  removePlaylist(playlistFormData.id).then(
    (res) => {
    switch (res.code) {
      case ResultCode.SUCCESS:
        for (let i = 0; i < myPlaylistInfos.length; i++) {
          const info = myPlaylistInfos[i];
          if(info.playlist.id == playlistFormData.id){
            myPlaylistInfos.splice(i, 1);
            ElMessage.success(res.message);
            dialogVisible.value = false; // 关闭创建歌单弹框
            isUpdateDialog.value = false; // 状态恢复
            return;
          }
        }
        break;
      default:
        break;
    }
  })
}

// imageUploader的回调函数
const onImageUpload = (file: File):Promise<string> => {
    return new Promise((resolve, reject) => {
        uploadPlaylistCover(file).then((res) => {
            playlistFormData.coverUrl = res.oData;
            resolve(getPlaylistCoverURL(res.oData));
        }).catch(() => {
            reject();
        });
    });
}

onMounted(() => {
  userInfo(userId).then(
    (res)=>{   
      switch (res.code) {
        case ResultCode.SUCCESS:          
          myUserinfo.value = res.oData;
          break;
        default:
          break;
      }
    });

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

<style>
.home-container {
  width: 100vw;
  height: 100vh;
  background-color: #f5f5f5;
  padding: 2vh;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommend-container {
  margin-top: 1vh;
}

.recommend-list {
  display: flex
;
    gap: 2vh;
    /* overflow-x: auto; */
    padding: 2vh 0;
    flex-direction: row;
    flex-wrap: wrap;
}


</style>