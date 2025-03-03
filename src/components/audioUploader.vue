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
    <el-button type="primary" :icon="UploadFilled" style="width: 10vh;"></el-button>
    <!-- <el-icon class="el-icon--upload"><upload-filled /></el-icon> -->
    <div class="el-upload__text">
    </div>
  </el-upload>
</template>
  
<script lang="ts" setup>
import { ref,defineProps } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Upload, Refrigerator } from '@element-plus/icons-vue'
import type { UploadProps, UploadUserFile } from 'element-plus'
import useCurrentInstance from "@/hooks/useCurrentInstance";
import { uploadAudio } from "@/api/upload";
import { allowedMimeTypes, maxFileSize } from '@/util/webConst';
const { globalProperties } = useCurrentInstance();

const props = defineProps<{
  roomCode: string;
  userId: number;
}>();

const fileList = ref<UploadUserFile[]>([

//   {
//     name: 'element-plus-logo2.svg',
//     url: 'https://element-plus.org/images/element-plus-logo.svg',
//   },
])
const fileLimit = ref(1);
const loading = ref(false)

const uploadFile = (options:any)=>{
    console.log("upload");
    loading.value= true;
    let rawFile:File = options.file
    fileList.value = []
    console.log("上传文件:",rawFile);
    uploadAudio(props.userId, props.roomCode,rawFile).then(()=>{
        fileList.value.push(
        { 
            name: rawFile.name,
            url: require('@/assets/icons/audio_folder.png')
        });
        globalProperties?.$message.success('上传成功！')
        loading.value = false;
        fileList.value = []
    })
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {//限制总数
    console.log("exceed");
    fileList.value = [files[0]]
    // if (fileList.value.length >= Number(fileLimit.value)) {
    //     globalProperties?.$message.warning('最多上传一个文件！')
    // }
}


const BeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    console.log("before",rawFile);
    return new Promise((resolve, reject)=>{
        if (!allowedMimeTypes.includes(rawFile.type)) {
            globalProperties?.$message.warning("音频格式支持: "+allowedMimeTypes.join('、')+" ！")
            reject();
        }else if (rawFile.size > maxFileSize) {
            
            globalProperties?.$message.warning('文件大小不能超过'+maxFileSize/1024/1024+'MB!')
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