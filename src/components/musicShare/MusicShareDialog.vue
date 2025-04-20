<template>
  <div class="music-share-dialog">
    <el-dialog
      v-model="dialogVisible"
      title="分享音乐"
      width="30%"
      :close-on-click-modal="false"
      :show-close="true"
    >
      <div class="share-dialog-content">
        <div v-if="curSong.songInfo.id > 0" class="current-song-info">
          <div class="song-cover">
            <img :src="getSongCover(curSong)" alt="封面">
          </div>
          <div class="song-details">
            <div class="song-name">{{ curSong.songInfo.songName }}</div>
            <div class="song-artist">{{ curSong.songInfo.songArtist }}</div>
          </div>
        </div>
        <div v-else class="no-song-playing">
          <el-empty description="当前没有正在播放的歌曲"></el-empty>
        </div>
        
        <div class="share-message">
          <el-input
            v-model="shareMessage"
            type="textarea"
            :rows="3"
            placeholder="添加分享留言（可选）"
            maxlength="100"
            show-word-limit
          ></el-input>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="shareMusicToUser" :loading="sharing" :disabled="!curSong.songInfo.id">
            分享
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted,onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { sendMusicShare } from '@/api/share';
import { Song } from '@/interface/song';
import { ResultCode } from '@/util/webConst';
import { eventBus, MEventTypes } from '@/util/eventBus';

const props = defineProps<{
  visible: boolean;
  receiverId: number;
  receiverName?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'share-success'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

const shareMessage = ref('');
const sharing = ref(false);



// 获取歌曲封面
const getSongCover = (song: Song.SongContent) => {
  return song.coverBase64 
    ? `data:image/png;base64,${song.coverBase64}` 
    : require('@/assets/icons/default_album.png');
};

// 关闭对话框
const closeDialog = () => {
  dialogVisible.value = false;
  shareMessage.value = '';
};

// 分享音乐给用户
const shareMusicToUser = async () => {
  if (curSong.songInfo.id<0) {
    ElMessage.warning('当前没有正在播放的歌曲');
    return;
  }
  
  sharing.value = true;
  try {
    const res = await sendMusicShare({
      receiverId:props.receiverId, 
      songId:curSong.songInfo.id, 
      contentText:shareMessage.value});
    if (res.code === ResultCode.SUCCESS) {
      ElMessage.success(`已成功分享《${curSong.songInfo.songName}》给 ${props.receiverName || '用户'}`);
      emit('share-success');
      closeDialog();
    } else {
      ElMessage.error(res.message || '分享失败');
    }
  } catch (error) {
    console.error('分享音乐失败', error);
    ElMessage.error('分享音乐失败，请稍后再试');
  } finally {
    sharing.value = false;
  }
};

// 监听对话框打开，检查是否有正在播放的歌曲
watch(() => props.visible, (newVal) => {
  if (newVal && !curSong.songInfo.id) {
    ElMessage.warning('当前没有正在播放的歌曲');
  }
});

let curSong = reactive<Song.SongContent>({
    songInfo: {
        id: -1,
        songName: '',
        songArtist: '',
        songDuration: 0,
        songAlbum: '',
        songSize: 0
    },
    coverBase64: '',
    songUrl: ''
})
onMounted(() => {
    eventBus.on(MEventTypes.PLAY_NEW_SONG_LOCAL, updateCurSong);
});

onUnmounted(() => {
    eventBus.off(MEventTypes.PLAY_NEW_SONG_LOCAL, updateCurSong);
});

const updateCurSong = (songContent: Song.SongContent | null)=>{
    if(songContent==null)
        return;
    Object.assign(curSong, songContent);
}
</script>

<style scoped>
.share-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 2vh;
}

.current-song-info {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 1vh;
  border-radius: 0.8vh;
}

.song-cover {
  width: 6vh;
  height: 6vh;
  margin-right: 1vh;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.4vh;
}

.song-details {
  flex: 1;
}

.song-name {
  font-weight: bold;
  font-size: 1.6vh;
  margin-bottom: 0.5vh;
}

.song-artist {
  font-size: 1.2vh;
  color: #666;
}

.no-song-playing {
  padding: 2vh;
  text-align: center;
}

.share-message {
  margin-top: 1vh;
}

/* 暗色主题适配 */
:deep(.el-dialog) {
  border-radius: 1vh;
}

:deep(.el-dialog__header) {
  padding: 1.5vh;
  margin-right: 0;
  border-bottom: 1px solid #eee;
}

:deep(.el-dialog__body) {
  padding: 2vh;
}

:deep(.el-dialog__footer) {
  padding: 1vh 2vh 2vh;
  border-top: 1px solid #eee;
}
</style>