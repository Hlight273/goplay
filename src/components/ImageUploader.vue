<template>
    <el-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="#"
    v-loading="loading"
    :http-request="uploadFile"
    :before-upload="BeforeUpload"
    :auto-upload="true"
    :on-exceed="handleExceed"
    :limit="fileLimit"
    list-type="picture"
  >
    <el-button type="primary" :icon="UploadFilled" style="width: 10vh;"></el-button>
  </el-upload>
</template>
  
<script lang="ts" setup>
import { ref, defineProps } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, type UploadProps, type UploadUserFile } from 'element-plus'
import useCurrentInstance from "@/hooks/useCurrentInstance";
import { uploadPlaylistCover } from "@/api/upload";
import { allowedImageMimeTypes, maxImageFileSize } from '@/util/webConst';

const { globalProperties } = useCurrentInstance();

const props = defineProps<{
  uploadCallback: (file: File) => Promise<string>;
}>();

const fileList = ref<UploadUserFile[]>([]);
const fileLimit = ref(1);
const loading = ref(false);

const uploadFile = (options: any) => {
    console.log("upload");
    loading.value = true;
    let rawFile: File = options.file;
    fileList.value = [];
    console.log("上传文件:", rawFile);

    props.uploadCallback(rawFile).then((imageUrl) => {
        fileList.value.push(
            { 
                name: rawFile.name ,
                url: imageUrl
            });
        ElMessage.success('上传成功！');
        loading.value = false;
    }).catch(() => {
        ElMessage.error('上传失败！');
        loading.value = false;
    });
    // uploadPlaylistCover(rawFile).then((imageUrl) => {
    //     fileList.value.push({ 
    //         name: rawFile.name,
    //     });
    //     globalProperties?.$message.success('上传成功！');
    //     loading.value = false;
    // }).catch(() => {
    //     globalProperties?.$message.error('上传失败！');
    //     loading.value = false;
    // });
}

const handleExceed: UploadProps['onExceed'] = (files) => {
    console.log("exceed");
    fileList.value = [files[0]];
}

const BeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    console.log("before", rawFile);
    return new Promise((resolve, reject) => {
        if (!allowedImageMimeTypes.includes(rawFile.type)) {
            globalProperties?.$message.warning("图片格式支持: " + allowedImageMimeTypes.join('、') + "！");
            reject();
        } else if (rawFile.size > maxImageFileSize) {
            globalProperties?.$message.warning('文件大小不能超过' + maxImageFileSize / 1024 / 1024 + 'MB!');
            reject();
        }
        resolve();
    });
}
</script>

<style scoped>
.upload-demo {
    width: 100%;
    display: flex;
    flex-direction: row-reverse;
    align-items: center;
}
</style>
