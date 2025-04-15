<template>
    <el-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="#"
    v-loading="loading"
    :http-request = "uploadFile"
    :before-upload = "BeforeUpload"
    :auto-upload="true"
    :on-exceed="handleExceed"
    :limit="fileLimit"
  >
  <!-- :before-remove="handleRemove" -->
    <el-button class="village_btn" type="primary" :icon="UploadFilled" style="width: 10vh;">上传音乐</el-button>
    <!-- <el-icon class="el-icon--upload"><upload-filled /></el-icon> -->
    <div class="el-upload__text">
    </div>
  </el-upload>
</template>
  
<script lang="ts" setup>
import { ref,defineProps, defineEmits  } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Upload, Refrigerator } from '@element-plus/icons-vue'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { uploadAudio4Playlist, uploadAudio4Room } from "@/api/upload";
import { allowedAudioMimeTypes, maxAudioFileSize } from '@/util/webConst';
import { Song } from '@/interface/song';
import { GoPlayer } from '@/util/XgPlayer';

const props = defineProps<{
  roomCode: string;
  userId: number;
  playlistId: number;
  isRoomPlaylist: boolean;
}>();
interface UploadEvents {(event: 'upload-success', songContent: Song.SongContent): void;}
const emit = defineEmits<UploadEvents>();//父组件回调@upload-success

const fileList = ref<UploadUserFile[]>([])
const fileLimit = ref(1);
const loading = ref(false)

const uploadFile = (options:any)=>{
    //console.log("upload");
    loading.value= true;
    let rawFile:File = options.file
    fileList.value = []
    //console.log("上传文件:",rawFile);
    if(props.isRoomPlaylist){//上传到房间歌单
        uploadAudio4Room(props.userId, props.roomCode, rawFile).then((res)=>{
            emit('upload-success', res.oData);//给父组件上传成功的回调
            fileList.value.push(
            { 
                name: rawFile.name,
                url: require('@/assets/icons/audio_folder.png')
            });
            ElMessage.success('上传成功！')
            loading.value = false;
            fileList.value = []
        }).catch((err)=>{
            loading.value = false;
        })
    }else{//上传到普通歌单
        uploadAudio4Playlist(props.userId, props.playlistId, rawFile).then((res)=>{
            emit('upload-success', res.oData);//给父组件上传成功的回调，返回songContent
            fileList.value.push(
            { 
                name: rawFile.name,
                url: require('@/assets/icons/audio_folder.png')
            });
            ElMessage.success('上传成功！')
            loading.value = false;
            fileList.value = []
        }).catch((err)=>{
            loading.value = false;
        })
    }
   
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {//限制总数
    //console.log("exceed");
    fileList.value = [files[0]]
    // if (fileList.value.length >= Number(fileLimit.value)) {
    //     globalProperties?.$message.warning('最多上传一个文件！')
    // }
}


const BeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    //console.log("before",rawFile);
    return new Promise((resolve, reject)=>{
        if (!allowedAudioMimeTypes.includes(rawFile.type)) {
            ElMessage.warning("音频格式支持: "+allowedAudioMimeTypes.join('、')+" ！")
            reject();
        }else if (rawFile.size > maxAudioFileSize) {
            
            ElMessage.warning('文件大小不能超过'+maxAudioFileSize/1024/1024+'MB!')
            reject();
        }
        resolve();
    })
}

</script>

<style scoped>
.upload-demo {
    width: 100%;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
}
:deep(.el-upload--text) {
    cursor: pointer;
    padding: .3vh;
    font-size: 2vh;
    color: #ab9bbb;
}
:deep(ul.el-upload-list) {
    flex: 8 1 0%;
    height: 3.5vh;
    margin: 0;
}
:deep(li.el-upload-list__item) {
    /* width: 40vh; */
    transition: none;
    font-size: 1.5vh;

}
:deep(.el-upload-list__item-info) {
    margin: 0px 1.2vh 0 1vh;
    height: 3.5vh;
    margin-left: 1.2vh;
}
:deep(.el-upload-list__item-name) {
    font-size: 1.3vh;
    padding: 0;
    transition:none
}
:deep(li.el-upload-list__item .el-upload-list__item-status-label .el-icon){
    width: 2vh;
}
</style>