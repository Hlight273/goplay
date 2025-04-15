<template>
  <div class="user-posts">
    <div class="post-list hide_scroll_child2">
      <el-card v-for="post in posts" :key="post.id" class="post-card white_backpanel">
        <div class="post-content">
          <p>{{ post.contentText }}</p>
          <!-- 歌曲展示 -->
          <div v-if="post.songContent" class="post-song">
            <div class="songLi">
              <img :src='(post.songContent.coverBase64!=null)?
                ("data:image/png;base64," + post.songContent.coverBase64):
                require("@/assets/icons/default_album.png")' alt="">
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
          <div v-if="post.imageUrls.length" class="image-grid">
            <el-image
              v-for="(url, index) in post.imageUrls"
              :key="index"
              :src="url"
              :preview-src-list="post.imageUrls"
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
import { formatDuration } from "@/util/commonUtil"
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
    //ElMessage.success(res.message)
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
    background: #f2f2f2;
    border-radius: 10px;
    border: 2px solid #e0dfe2;
}

.post-list {
    box-sizing: border-box;
    padding: 20px;
    height: 92%;
}

.post-card {
  margin-bottom: 2vh;
  width: 100%;
}

/* 复用 musicVillage 的相关样式 */
.post-content {
  margin-bottom: 16px;
  padding: 10px 16px;
  border: 1px solid #ebebeb;
  border-radius: 14px;
  background: #ffffff;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
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

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2vh 0;
}

.total-count {
  margin-right: 1vh;
  color: #999;
}
</style>