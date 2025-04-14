<template>
    <div class="download-btn" @click="toggleExpand">
      <el-badge 
        :value="Object.keys(downloads).length" 
        :max="99" 
        type="danger" 
        :hidden="!hasDownloads"
        class="custom-badge"
      >
        <el-icon><Download /></el-icon>
      </el-badge>
      
      <transition name="fade">
        <div class="download-panel" v-if="isExpanded">

          <div class="download-header">
            <span>传输队列</span>
            <el-icon class="close-icon" @click.stop="isExpanded = false"><Close /></el-icon>
          </div>

          <div class="download-list">
            <div v-if="!hasDownloads" class="empty-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>当前无缓存任务</span>
            </div>
            <div v-else v-for="(item, url) in downloads" :key="url" class="download-item">
              <div class="download-info">
                <span class="filename">{{ getFileName(url) }}</span>
                <span class="progress-text">{{ item.progress }}%</span>
              </div>
              <el-progress 
                :percentage="item.progress" 
                :status="item.progress === 100 ? 'success' : ''"
                :stroke-width="6"
              />
            </div>
          </div>

          <hr class="divider" />

          <div class="download-list" v-if="hasUploads || !hasDownloads">
            <div v-if="!hasUploads" class="empty-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>当前无上传任务</span>
            </div>
            <div v-else v-for="(item, filename) in uploads" :key="filename" class="download-item">
              <div class="download-info">
                <span class="filename">{{ filename }}</span>
                <span class="progress-text">{{ item.progress }}%</span>
              </div>
              <el-progress 
                :percentage="item.progress" 
                :status="item.progress === 100 ? 'success' : ''"
                :stroke-width="6"
              />
            </div>
          </div>
          
        </div>
      </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Download, ArrowDown, Close, InfoFilled } from '@element-plus/icons-vue';
import { eventBus, MEventTypes } from "@/util/eventBus";

interface DownloadItem {
  progress: number;
  timestamp: number;
}

const downloads = ref<Record<string, DownloadItem>>({});
const isExpanded = ref(false);
const AUTO_REMOVE_DELAY = 3000; // 完成后3秒自动移除

const hasDownloads = computed(() => Object.keys(downloads.value).length > 0);

// 切换展开/折叠状态
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// 从URL中提取文件名
const getFileName = (url: string): string => {
  // 如果URL太长，截取最后部分
  if (url.length > 30) {
    return '...' + url.substring(url.length - 27);
  }
  return url;
};

// 监听下载进度事件
const handleDownloadProgress = ({ url, progress }: { url: string, progress: number }) => {
  if (!downloads.value[url]) {
    downloads.value[url] = {
      progress: 0,
      timestamp: Date.now()
    };
  }
  
  downloads.value[url].progress = progress;
  
  // 如果下载完成，设置定时器自动移除
  if (progress === 100) {
    setTimeout(() => {
      const currentDownloads = { ...downloads.value };
      delete currentDownloads[url];
      downloads.value = currentDownloads;
    }, AUTO_REMOVE_DELAY);
  }
};

//上传
const uploads = ref<Record<string, DownloadItem>>({});
const hasUploads = computed(() => Object.keys(uploads.value).length > 0);
const handleUploadProgress = ({ filename, progress }: { filename: string, progress: number }) => {
  if (!uploads.value[filename]) {
    uploads.value[filename] = {
      progress: 0,
      timestamp: Date.now()
    };
  }
  uploads.value[filename].progress = progress;
  if (progress === 100) {
    setTimeout(() => {
      const currentUploads = { ...uploads.value };
      delete currentUploads[filename];
      uploads.value = currentUploads;
    }, AUTO_REMOVE_DELAY);
  }
};

// 生命周期钩子
onMounted(() => {
  eventBus.on(MEventTypes.SONG_LOADING_PROGRESS, handleDownloadProgress);
  eventBus.on(MEventTypes.FILE_UPLOAD_PROGRESS, handleUploadProgress);
});

onUnmounted(() => {
  eventBus.off(MEventTypes.SONG_LOADING_PROGRESS, handleDownloadProgress);
  eventBus.off(MEventTypes.FILE_UPLOAD_PROGRESS, handleUploadProgress);
});
</script>

<style scoped>
.download-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 1.5vh;
  color: #fff;
  top: .2vh;
}

.download-btn .el-icon {
  font-size: 2vh;
}

.download-panel {
  position: absolute;
  top: 40px;
  right: -70px;
  width: 400px;
  background-color: rgba(30, 30, 30, 0.7);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  overflow: hidden;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.download-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: rgba(50, 50, 50, 0.5);
  color: white;
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.close-icon {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s;
}

.close-icon:hover {
  color: #fff;
}

.download-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  color: #fff;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.empty-tip {
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin: 5px;
  border: 0.2vh solid #555760;
  box-shadow: none;
}

.empty-tip .el-icon {
  margin-right: 8px;
  font-size: 18px;
  opacity: 0.8;
}

.download-item {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.download-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.download-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.filename {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.progress-text {
  font-size: 14px;
  color: #a5a5ff;
  font-weight: 500;
}

/* 自定义进度条样式 */
:deep(.el-progress-bar__outer) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.el-progress-bar__inner) {
  background-color: #a5a5ff !important;
}

:deep(.el-progress__text) {
  color: #fff !important;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
.download-list::-webkit-scrollbar {
  width: 6px;
}

.download-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.download-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.download-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 添加自定义徽章样式 */
:deep(.custom-badge .el-badge__content) {
  font-size: 10px;
  padding: 1px 3px;
  line-height: 1px;
  border: none;
  right: calc(-3px + var(--el-badge-size) / 2);
  top: 18px;
  height: 10px;
}

/* 分隔线样式 */
.divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  margin: 10px 0;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .download-panel {
    position: fixed;
    top: auto;
    bottom: 70px;
    right: 10px;
    width: calc(100% - 20px);
    max-width: 350px;
  }

  .download-header {
    padding: 8px 12px;
  }

  .download-list {
    max-height: 250px;
    padding: 8px;
  }

  .download-item {
    margin-bottom: 8px;
    padding-bottom: 8px;
  }

  .filename {
    font-size: 13px;
  }

  .progress-text {
    font-size: 13px;
  }

  .empty-tip {
    padding: 20px 0;
    font-size: 13px;
  }
}

@media screen and (max-width: 480px) {
  .download-panel {
    bottom: 60px;
  }

  .download-header {
    padding: 6px 10px;
  }

  .download-list {
    max-height: 200px;
    padding: 6px;
  }

  .filename {
    font-size: 12px;
  }

  .progress-text {
    font-size: 12px;
  }

  .empty-tip {
    padding: 15px 0;
    font-size: 12px;
  }
}

/* 上传列表样式 */
.upload-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  color: #fff;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  width: 100%;
  padding: 5px 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 10px;
}

/* 移动端适配中添加 */
@media screen and (max-width: 768px) {
  .upload-list {
    max-height: 250px;
    padding: 8px;
  }
}

@media screen and (max-width: 480px) {
  .upload-list {
    max-height: 200px;
    padding: 6px;
  }

  .section-title {
    font-size: 12px;
    padding: 4px 0;
  }
}
</style>