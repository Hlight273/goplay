<template>
<!-- 我的歌单 -->
<div class="recommend-container">
  <h2 class="title-area">
      <span class="title">我的歌单</span>
      <el-button class="super_submit" @click="openDialog_AddPlaylist">
          <el-icon><Plus /></el-icon>新建歌单
      </el-button>
  </h2>
  <div class="recommend-list hide_scroll_child">
      <div v-if="commonStore.myPlaylistInfos.length > 0" v-for="(playlistInfo, index) in commonStore.myPlaylistInfos" :key="index" style="position: relative;">
        <el-button class="floating_btn" @click="openDialog_UpdatePlaylist(playlistInfo.playlist)">
          <el-icon><Edit /></el-icon>
        </el-button>
        <PlaylistBlock :playlist-info="playlistInfo" :my-userinfo="commonStore.myUserinfo"/>
      </div>
      <div v-else class="empty-tip">
          <el-icon><Plus /></el-icon>
          <span>创建你的第一个歌单，开始上传音乐吧！</span>
      </div>
  </div>
</div>


<!-- 新建歌单弹出框 -->
 <div class="playlist_info_modify">
  <el-dialog v-model="dialogVisible" :title="isUpdateDialog?'修改信息':'新建歌单'" @close="resetForm">
    <el-form :model="playlistFormData" ref="formRef" label-width="80px" class="playlist-form">
      <el-form-item label="歌单标题" :rules="[ { required: true, message: '请输入歌单标题', trigger: 'blur' } ]">
        <el-input v-model="playlistFormData.title" placeholder="请输入歌单标题" />
      </el-form-item>
      <el-form-item label="歌单描述" :rules="[ { required: true, message: '请输入歌单描述', trigger: 'blur' } ]">
        <el-input v-model="playlistFormData.description" placeholder="请输入歌单描述" />
      </el-form-item>
      <el-form-item label="设置封面">
        <ImageUploader :upload-callback="onImageUpload"></ImageUploader>
      </el-form-item>
      <el-form-item label="是否公开">
        <el-switch v-model="playlistFormData.isPublic" :active-value="1" :inactive-value="0" active-text="公开" inactive-text="私密" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false" style="color: var(--el-color-primary);">取消</el-button>
      <el-button type="primary" @click="isUpdateDialog?submitUpdatePlaylist():submitAddPlaylist()">确定</el-button>
      <el-button v-show="isUpdateDialog" class="super_submit" @click="deletePlaylist">删除歌单</el-button>

      <el-button v-show="isUpdateDialog&&CanRecommand(commonStore.myUserinfo)" class="super_submit" @click="submitAddRecommend">推送歌单+</el-button>
      <el-button v-show="isUpdateDialog&&CanRecommand(commonStore.myUserinfo)" class="super_submit" @click="submitRemoveRecommend">去除推送-</el-button>
    </div>
  </el-dialog>
 </div>

</template>

<script lang="ts" setup>
import { CanRecommand, userInfo, userPlaylistInfo } from '@/api/user';
import { Playlist } from '@/interface/playlist';
import { ResultCode } from '@/util/webConst';
import { onMounted, reactive, ref } from 'vue';
import { Plus } from '@element-plus/icons-vue'
import { addPlaylist, removePlaylist, updatePlaylist } from '@/api/playlist';
import { getPlaylistCoverURL } from '@/api/static';
import { uploadPlaylistCover } from '@/api/upload';
import { ElMessage } from 'element-plus';
import ImageUploader from '@/components/ImageUploader.vue'
import PlaylistBlock from '@/components/playlistBlock.vue'
import { addRecommend, removeRecommend } from '@/api/recommend';
import { useCommonStore } from '@/store/commonStore'

const commonStore = useCommonStore()

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
  isUpdateDialog.value = false;
}

const submitAddPlaylist = () => {
  addPlaylist(playlistFormData).then(
    (res) => {
    switch (res.code) {
      case ResultCode.SUCCESS:
        commonStore.myPlaylistInfos.push({playlist:res.oData, songContentList:[]});
       // console.log("新增",myPlaylistInfos);
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
        for (let i = 0; i < commonStore.myPlaylistInfos.length; i++) {
          const info = commonStore.myPlaylistInfos[i];
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
        for (let i = 0; i < commonStore.myPlaylistInfos.length; i++) {
          const info = commonStore.myPlaylistInfos[i];
          if(info.playlist.id == playlistFormData.id){
            commonStore. myPlaylistInfos.splice(i, 1);
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

const submitAddRecommend =()=>{
  addRecommend(playlistFormData.id)
  .then((res)=>{
    ElMessage.success(res.message);
  })
}
const submitRemoveRecommend =()=>{
  removeRecommend(playlistFormData.id)
  .then((res)=>{
    ElMessage.success(res.message);
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
  commonStore.updateMyUserInfo();
  commonStore.updateMyPlaylistInfo();
})
</script>

<style scoped>
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
    display: flex;
    gap: 2vh;
    padding: 2vh 0;
    flex-direction: row;
    flex-wrap: wrap;
    overflow: hidden;
    height: 73vh;
    justify-content: center;
    align-content: flex-start;
}

.floating_btn {
  z-index: 599;
  position: absolute;
  top: .3vh;
  right: .3vh;
  color: #ffffff;
  width: 3.2vh;
  height: 3.2vh;
  border-radius: 50%;
  font-size: 1.4vh;
  border: none;
  background-color: rgba(60, 57, 60, 0.7);
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transform: scale(0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* 添加父元素悬停时的按钮显示效果 */
div[style="position: relative;"]:hover .floating_btn {
  opacity: 1;
  transform: scale(1);
}

.floating_btn:hover {
  background-color: var(--el-color-primary);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.title-area {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2vh;
    border-bottom: .1vh solid #d2d2d263;
    padding-bottom: 1vh;
    padding-top: 1vh;
}

.title-area .title {
  font-size: 1.9vh;
    color: #3c3c3c;
    font-weight: normal;
    position: relative;
    padding-left: 1.5vh;
}

.title-area .title::before {
  content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 0.4vh;
    height: 1.4vh;
    background: #ff9294;
    border-radius: 1.2vh;
    border: 0.2vh solid #ff72c3;
    animation: decoratorDance 3s ease-in-out infinite;
}
@keyframes decoratorDance {
    0%, 100% {
        transform: translateY(-50%);
    }
    30% {
        transform: translateY(-80%);
    }
    40% {
        transform: translateY(25%);
    }
    50% {
        transform: translateY(-50%) rotate(0deg);
    }
    70% {
        transform: translateY(-50%) rotate(360deg);
    }
}
</style>

<style>
.playlist_info_modify .el-dialog{
    min-width: 540px !important;
    border-radius: 2vh;
    border: 0.2vh solid #ccccff;
    box-shadow: 0px -0.2vh 0.2vh 0px rgb(129 82 82 / 47%) inset;
}
.playlist_info_modify .el-dialog .el-dialog__title {
    font-size: 2vh;
    background: linear-gradient(94deg, #b894f7, #d28be6, #ef90f7, #ff98b9);
    background-size: 200% auto;
    color: transparent;
    background-clip: text;
    font-weight: bold;
    position: relative;
    top: -0.5vh;
}
</style>