<template>
  <div class="user-posts">
    <div class="post-list hide_scroll_child2">
      <el-card v-for="post in posts" :key="post.id" class="post-card white_backpanel">
        <div class="post-header">
          <el-avatar :src="post.addedByAvatar" class="clickable-avatar" />
          <div class="post-info">
            <span class="username">{{ post.addedByName }}</span>
            <span class="time">{{ formatDate(post.addedAt, true) }} 发帖</span>
          </div>
        </div>

        <div class="post-content" :class="{ 'has-song': post.songContent }">
          <p class="content-text">{{ post.contentText }}</p>
          
          <!-- 歌曲展示 -->
          <div v-if="post.songContent" class="post-song">
            <div class="songLi">
              <img :src='(post.songContent.coverBase64!=null)?
                ("data:image/png;base64," + post.songContent.coverBase64):
                require("@/assets/icons/default_album.png")' alt="cover" class="song-cover">
              <div class="song-info">
                <span class="song-name">{{ post.songContent.songInfo.songName }}</span>
                <span class="song-artist">{{ post.songContent.songInfo.songArtist }}</span>
              </div>
              <span class="song-duration">{{ formatDuration(post.songContent.songInfo.songDuration) }}</span>
              <el-button link type="primary" class="play-btn" @click="playSong(post.songContent)">
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 图片展示 -->
          <div v-if="post.imageUrls.length" class="image-grid" 
               :class="{ 'single-image': post.imageUrls.length === 1 }">
            <el-image
              v-for="(url, index) in post.imageUrls"
              :key="index"
              :src="url"
              :preview-src-list="post.imageUrls"
              fit="cover"
              class="post-image"
              loading="lazy"
            />
          </div>
        </div>

        <div class="post-footer">
          <div class="actions">
            <el-button 
              class="village_btn"
              :type="post.likedByCurrentUser ? 'primary' : 'default'"
              @click="handleLike(post)"
            >
              <el-icon><CaretTop /></el-icon>
              {{ post.likeCount }}
            </el-button>
            <el-button 
              class="village_btn"
              :type="post.showComments ? 'primary' : 'default'"
              @click="toggleComments(post)"
            >
              <el-icon><ChatDotRound /></el-icon>
              {{ post.commentCount }}
            </el-button>
          </div>
        </div>

        <!-- 评论区 -->
        <div v-if="post.showComments" class="comments-section">
          <div class="comments-divider"></div>
          <CommentList2 :postId="post.id"></CommentList2>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <div v-show="total>=11" class="total-count">共 {{ total }} 条</div>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handleCurrentChange"
        layout="prev, pager, next"
        :hide-on-single-page="true"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CaretTop, ChatDotRound, VideoPlay } from '@element-plus/icons-vue'
import { Post } from '@/interface/post'
import { getPostListByUserId, togglePostLike } from '@/api/post'
import { formatDate, formatDuration } from "@/util/commonUtil"
import { GoPlayer } from '@/util/XgPlayer'
import CommentList2 from '@/components/commentList2.vue'
import { Song } from '@/interface/song'
import { getPostImageURL } from '@/api/static'
import { ResultCode } from '@/util/webConst'

const props = defineProps<{
  userId: number
}>()

const posts = ref<(Post.PostDetail & { showComments?: boolean })[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadPosts = async (page: number) => {
  const res = await getPostListByUserId(props.userId, page, pageSize.value)
  if (res.data) {
    console.log(res.data);
    
    posts.value = res.data.posts.map(post => ({
      ...post,
      showComments: false,
      imageUrls: post.imageUrls.map(url => getPostImageURL(url))
    }))
    total.value = res.data.total
  }
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadPosts(val)
}

const handleLike = async (post: Post.PostDetail) => {
  const res = await togglePostLike(post.id)
  if (res.code === ResultCode.SUCCESS) {
    post.likedByCurrentUser = !post.likedByCurrentUser
    post.likeCount += post.likedByCurrentUser ? 1 : -1
  } else {
    ElMessage.error(res.message)
  }
}

const toggleComments = (post: Post.PostDetail & { showComments?: boolean }) => {
  posts.value.forEach(p => {
    if (p.id !== post.id) p.showComments = false
  })
  post.showComments = !post.showComments
}

const playSong = (songContent: Song.SongContent) => {
  if(GoPlayer.isRoomMode()) {
    ElMessage.info("请先切换到单人模式！")
    return
  }
  GoPlayer.getInstance().loadPlaylist4local([songContent])
  GoPlayer.getInstance().setPlayer4localIndex(0)
}

onMounted(() => {
  loadPosts(1)
})
</script>

<style scoped>
.user-posts {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-lighter);
}

.post-list {
  box-sizing: border-box;
  padding: 20px;
  height: 92%;
}

.post-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 5px 8px 8px 8px;
  border: .1vh solid #f0f1ff;
  box-shadow: 0px -.2vh .2vh 0px rgb(128 125 155 / 20%) inset;
}

.post-info {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #999;
}

.post-content {
  margin-bottom: 16px;
  padding: 10px 16px;
  border: 1px solid #ebebeb;
  border-radius: 14px;
  background: #ffffff;
}

.content-text {
  margin: 0;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  font-size: 14px;
  white-space: pre-wrap;
}

.post-song {
  margin: 12px 0;
  background-color: var(--el-bg-color-page);
  border-radius: 6px;
}

.songLi {
  padding: 8px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.songLi img {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 12px;
}

.song-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.song-name {
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-artist {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.song-duration {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0 12px;
}

.play-btn {
  padding: 8px;
}

.play-btn:hover {
  color: var(--el-color-primary);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.image-grid.single-image {
  grid-template-columns: 1fr;
}

.post-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-image:hover {
  transform: scale(1.02);
}

.post-footer {
  border-top: 1px solid #eee;
  padding-top: 12px;
  margin-bottom: 8px;
}

.actions {
  display: flex;
  gap: 12px;
}

.comments-section {
  margin-top: 16px;
}

.comments-divider {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 16px 0;
}

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.total-count {
  margin-right: 10px;
  color: var(--el-text-color-secondary);
}

.clickable-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.clickable-avatar:hover {
  transform: scale(1.05);
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .user-posts {
    padding: 10px;
  }

  .post-list {
    padding: 10px;
  }

  .post-header {
    padding: 4px 6px 6px 6px;
  }

  .username {
    font-size: 13px;
  }

  .time {
    font-size: 11px;
  }

  .content-text {
    font-size: 13px;
  }

  .image-grid {
    gap: 6px;
  }

  .songLi {
    padding: 6px;
  }

  .song-name {
    font-size: 13px;
  }

  .song-artist, .song-duration {
    font-size: 11px;
  }
}
</style>