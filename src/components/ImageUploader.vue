<template>
    <el-upload
    ref="upload"
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
    <el-button class="village_btn" type="primary" :icon="UploadFilled" style="width: 10vh;">上传图片</el-button>
  </el-upload>
</template>
  
<script lang="ts" setup>
import { ref, defineProps } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, UploadInstance, type UploadProps, type UploadUserFile, UploadRawFile, genFileId   } from 'element-plus'
import useCurrentInstance from "@/hooks/useCurrentInstance";
import { allowedImageMimeTypes, maxImageFileSize } from '@/util/webConst';

const { globalProperties } = useCurrentInstance();

const props = defineProps<{
    uploadCallback: (file: File) => Promise<string>;
    multiple?: boolean;  // 新增多图片上传选项
    maxCount?: number;   // 新增最大上传数量选项
}>();


const fileList = ref<UploadUserFile[]>([]);
const fileLimit = ref(props.maxCount || 1);  // 使用传入的maxCount或默认为1
const loading = ref(false);

const upload = ref<UploadInstance>()

//暴露方法, 清空图片
export interface ImageUploaderExposed {
  clearImages: () => void
}
const clearImages = () => {
  fileList.value = []
}
defineExpose<ImageUploaderExposed>({
  clearImages
})

const uploadFile = (options: any) => {
    loading.value = true;
    let rawFile: File = options.file;

    // 单图片模式下清空列表
    if (!props.multiple) {
        fileList.value = [];
    }else {
        // 多图片模式下，清理掉所有 status 为 'ready' 的文件
        fileList.value = fileList.value.filter(file => file.status === 'success');
    }
    
    props.uploadCallback(rawFile).then((imageUrl) => {
        const newFile = { 
            name: rawFile.name,
            url: imageUrl
        };
        
        if (!props.multiple) {
            fileList.value = [newFile];
        } else {
            fileList.value.push(newFile);
        }
        
        ElMessage.success('上传成功！');
        loading.value = false;
    }).catch(() => {
        ElMessage.error('上传失败！');
        loading.value = false;
    });
}

const handleExceed: UploadProps['onExceed'] = (files) => {
    if (!props.multiple) {
        upload.value!.clearFiles()
        const file = files[0] as UploadRawFile
        file.uid = genFileId()
        ElMessage.warning(`单次只能上传一张图片，请重新上传`);
        //upload.value!.handleStart(file)
    } else {
        ElMessage.warning(`最多只能上传 ${fileLimit.value} 张图片`);
    }
}

const BeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
    //console.log("before", rawFile);
    return new Promise((resolve, reject) => {
        if (!allowedImageMimeTypes.includes(rawFile.type)) {
            globalProperties?.$message.warning("图片格式支持: " + allowedImageMimeTypes.join('、') + "！");
            reject();
        } else if (rawFile.size > maxImageFileSize) {
            globalProperties?.$message.warning('文件大小不能超过' + maxImageFileSize / 1024 / 1024 + 'MB!');
            reject();
        }
        // 检查是否已存在相同文件
        const existingFile = fileList.value.find(f => f.name === rawFile.name);
        if (existingFile) {
            ElMessage.warning('该文件已存在');
            loading.value = false;
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
