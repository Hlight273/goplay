<template>
    <div class="village-container">
        <!-- Logo -->
        <div class="village-header">
            <span class="logo">GOPLAY·音乐村</span>
        </div>
        
        <!-- 发布动态区域 -->
        <div class="post-creator">
            <el-input
                v-model="newPost.contentText"
                type="textarea"
                :rows="3"
                placeholder="分享你的音乐心情..."
            />
            <!-- 歌曲选择区域 -->
            <div v-if="selectedSong" class="selected-song">
                <div class="songLi">
                    <img :src='(selectedSong.coverBase64!=null)?
                        ("data:image/png;base64," + selectedSong.coverBase64):
                        require("@/assets/icons/default_album.png")' alt="">
                    <div class="song-info">
                        <span class="song-name">{{ selectedSong.songInfo.songName }}</span>
                        <span class="song-artist">{{ selectedSong.songInfo.songArtist }}</span>
                    </div>
                    <el-button link @click="clearSelectedSong">
                        <el-icon><Close /></el-icon>
                    </el-button>
                </div>
            </div>
            <div class="post-actions">
                <div class="left-actions">
                    <ImageUploader 
                        :upload-callback="onImageUpload" 
                        :multiple="true" 
                        :max-count="3"
                        :ref="uploadRef">
                    </ImageUploader>
                    <el-button class="village_btn" type="primary" @click="selectCurrentSong">
                        <el-icon><Service /></el-icon>
                        添加当前播放歌曲
                    </el-button>
                </div>
                <el-button class="village_btn" type="primary" @click="submitPost">发布</el-button>
            </div>
        </div>

        <!-- 动态列表 -->
        <div class="post-list">
            <el-card v-for="post in posts" :key="post.id" class="post-card white_backpanel">
                <div class="post-header">
                    <el-avatar :src="post.addedByAvatar" @click="openUserProfile(post.addedBy)" class="clickable-avatar" />
                    <div class="post-info clickable-avatar" @click="openUserProfile(post.addedBy)">
                        <span class="username clickable-username" @click="openUserProfile(post.addedBy)">{{ post.addedByName }}</span>
                        <span class="time">{{ formatDate(post.addedAt) }} 发帖</span>
                    </div>
                </div>
                
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

        <!-- 加载更多 -->
        <div class="load-more" v-if="hasMore">
            <el-button @click="loadMore">加载更多</el-button>
        </div>
    </div>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {  CaretTop, ChatDotRound, Service } from '@element-plus/icons-vue'
import { Post } from '@/interface/post'
import { getPostList, createPost, togglePostLike, getPostComments, addPostComment, getCommentReplies } from '@/api/post'
import { formatDate, formatDuration } from "@/util/commonUtil"
import { GoPlayer } from '@/util/XgPlayer'
import { ResultCode } from "@/util/webConst"
import { uploadPostImage } from '@/api/upload'

import { getPostImageURL } from '@/api/static'
import ImageUploader, { ImageUploaderExposed } from '@/components/ImageUploader.vue'
import CommentList2 from '@/components/commentList2.vue'
import { Song } from '@/interface/song'
import { eventBus, MEventTypes } from '@/util/eventBus'


// 初始化动态列表
const { currentTab } = defineProps<{
    currentTab?: string
}>()
const isInitialized = ref(false);
watch(() => currentTab, (newTab) => {
    if (newTab === 'community' && !isInitialized.value) {
        loadPosts(1);
        isInitialized.value = true;
    }
}, { immediate: true })


import { useCommonStore } from "@/store/commonStore"
const commonStore = useCommonStore();
const openUserProfile = (userId: number) => {
    commonStore.openUserPage(userId);
}


const posts = ref<(Post.PostDetail & { showComments?: boolean })[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const hasMore = ref(true);

const newPost = reactive<Post.PostInfo>({
    contentText: '',
    imageUrls: [],
})

const uploadRef = ref<ImageUploaderExposed  | null>(null);

// 获取动态列表
const loadPosts = async (page: number) => {
    console.log("%c初始化动态列表成功",'color: blue');
    
    const res = await getPostList(page, pageSize.value);
    if (res.data) {
        const processedPosts = res.data.posts.map(post => ({
            ...post,
            showComments: false,
            imageUrls: post.imageUrls.map(url => getPostImageURL(url))
        }))

        if (page === 1) {
            posts.value = processedPosts;
        } else {
            posts.value.push(...processedPosts);
        }
        hasMore.value = posts.value.length < res.data.total;
    }
}

// 加载更多
const loadMore = () => {
    currentPage.value++
    loadPosts(currentPage.value)
}

const onImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        console.log("uploading...", file);
        
        uploadPostImage(file).then((res) => {
            newPost.imageUrls.push(res.oData);
            resolve(getPostImageURL(res.oData));
        }).catch(() => {
            reject();
        });
    });
}

const selectedSong = ref<Song.SongContent | null>(null)
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

const selectCurrentSong = () => {
    if (curSong.songInfo.id == -1) {
        ElMessage.warning('当前没有正在播放的歌曲')
        return
    }
    selectedSong.value = curSong
    newPost.songId = curSong.songInfo.id
}

const clearSelectedSong = () => {
    selectedSong.value = null
    newPost.songId = undefined
}

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

const playSong = (songContent: Song.SongContent) => {
    if(GoPlayer.isRoomMode()) {
        ElMessage.info("请先切换到单人模式！")
        return
    }
    GoPlayer.getInstance().loadPlaylist4local([songContent])
    GoPlayer.getInstance().setPlayer4localIndex(0)
}

//发布动态
const submitPost = () => {
    if (!newPost.contentText.trim()) {
        ElMessage.warning('请输入内容')
        return
    }
    
    createPost(newPost).then((res) => {
        switch (res.code) {
            case ResultCode.SUCCESS:
                ElMessage.success(res.message)
                newPost.contentText = ''
                newPost.imageUrls = []
                newPost.songId = undefined
                selectedSong.value = null
                uploadRef.value?.clearImages();
                loadPosts(1)
                break
            default:
                ElMessage.error('发布失败，请稍后再试')
                break
        }
    })
}

// 点赞/取消点赞
const handleLike = (post: Post.PostDetail) => {
    togglePostLike(post.id).then((res) => {
        switch (res.code) {
            case ResultCode.SUCCESS:
                post.likedByCurrentUser = !post.likedByCurrentUser
                post.likeCount += post.likedByCurrentUser ? 1 : -1
                ElMessage.success(res.message)
                break
            default:
                ElMessage.error('操作失败，请稍后再试')
                break
        }
    })
}

// 评论相关
const currentPost = ref<Post.PostDetail | null>(null)
const comments = ref<Post.PostComment[]>([])
const commentPage = ref(1)
const commentPageSize = ref(10)
const hasMoreComments = ref(true)


// 显示评论
const toggleComments = async (post: Post.PostDetail & { showComments?: boolean }) => {
    // 关闭其他帖子的评论
    posts.value.forEach(p => {
        if (p.id !== post.id) {
            p.showComments = false
        }
    })
    
    // 切换当前帖子的评论显示状态
    post.showComments = !post.showComments
    
    if (post.showComments) {
        currentPost.value = post
        commentPage.value = 1
        const res = await getPostComments(post.id, commentPage.value, commentPageSize.value)
        if (res.data) {
            comments.value = res.data.comments
            hasMoreComments.value = comments.value.length < res.data.total
        }
    } else {
        currentPost.value = null
        comments.value = []
    }
}


// onMounted(() => {
    
//     loadPosts(1)
// })
</script>

<style scoped>
.village-container {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    height: 83vh;
    overflow-y: scroll;
}

.post-creator {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}



.post-card {
    margin-bottom: 20px;
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
}

.time {
    font-size: 12px;
    color: #999;
}

.post-content {
    margin-bottom: 16px;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 12px;
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

.load-more {
    text-align: center;
    margin-top: 20px;
}

.post-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    flex-wrap: wrap;
    gap: 12px;
}

/* 添加新的样式 */
.left-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
}

.selected-song {
    margin: 12px 0;
    padding: 0 2vh;
}

.post-song {
    margin: 12px 0;
    background-color: var(--el-bg-color-page);
    border-radius: 6px;
}

/* 复用 hotSongList.vue 的歌曲样式 */
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

:deep(.post-creator .el-textarea__inner, .comment-input .el-textarea__inner){
    padding: 1vh;
    border-radius: 1.6vh;
    min-height: 6vh;
    max-height: 12vh;
    /* background-color: #efeff2; */
    /* box-shadow: 0 .1vh .1vh .01vh #a6fffa24 inset; */
    font-size: 1.4vh;
    resize: none;
  }

  :deep(.post-list .el-card__body) {
    padding: 1.5vh !important;
}

/* 添加可点击头像和用户名的样式 */
.clickable-avatar {
    cursor: pointer;
    transition: transform 0.2s;
}

.clickable-avatar:hover {
    transform: scale(1.05);
}

.clickable-username {
    cursor: pointer;
    transition: color 0.2s;
}

.clickable-username:hover {
    color: var(--el-color-primary);
    text-decoration: underline;
}

.village-header {
    margin-bottom: 1px;
    display: flex
;
    align-items: center;
    background: linear-gradient(45deg, #ccc8ff, #ecc3ff, #90afff);
    border: .3vh solid #d4ceff;
    border-bottom: none;
    border-radius: 12px;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
    padding: .5vh 1vh;
    justify-content: center;
    margin-top: -20px;
}

.logo {
    font-size: 2.2vh;
    font-family: ui-monospace;
    font-weight: bold;
    background: linear-gradient(90deg, #ffe9ec, #ffe0e0, #ffeafc, #ffdae6, #efefff);
    background-size: 200% auto;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    animation: textFlow-97e2073e 4s linear infinite;
    text-shadow: 0vh 0vh .33vh #dfcdff29;
}

@keyframes textFlow {
    0% {
        background-position: 0% center;
    }
    100% {
        background-position: 200% center;
    }
}

/* 添加移动端适配样式 */
@media screen and (max-width: 768px) {
    .village-container {
        padding: 20px 10px;
        height: 80vh;
    }

    .post-creator {
        padding: 15px;
        margin-bottom: 15px;
    }

    .post-card {
        margin-bottom: 15px;
    }

    .post-header {
        padding: 4px 6px 6px 6px;
        margin-bottom: 12px;
    }

    .post-info {
        margin-left: 8px;
    }

    .username {
        font-size: 14px;
    }

    .time {
        font-size: 11px;
    }

    .post-content {
        margin-bottom: 12px;
        font-size: 14px;
    }

    .image-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
        margin-top: 8px;
    }

    .songLi {
        padding: 6px;
    }

    .songLi img {
        width: 36px;
        height: 36px;
        margin-right: 8px;
    }

    .song-name {
        font-size: 13px;
    }

    .song-artist, .song-duration {
        font-size: 11px;
    }

    .play-btn {
        padding: 6px;
    }

    .post-footer {
        padding-top: 8px;
        margin-bottom: 6px;
    }

    .actions {
        gap: 8px;
    }

    .actions .village_btn {
        padding: 6px 12px;
        font-size: 12px;
    }

    .post-actions {
        margin-top: 12px;
        gap: 8px;
    }

    .left-actions {
        width: 100%;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    .left-actions .village_btn {
        flex: 1;
        min-width: 120px;
        font-size: 12px;
        padding: 6px 8px;
    }
}

/* 超小屏幕适配 */
@media screen and (max-width: 480px) {
    .village-container {
        padding: 20px 8px;
    }

    .post-creator {
        padding: 12px;
        margin-bottom: 12px;
    }

    .image-grid {
        grid-template-columns: 1fr;
    }

    .songLi img {
        width: 32px;
        height: 32px;
        margin-right: 6px;
    }

    .song-name {
        font-size: 12px;
    }

    .song-artist, .song-duration {
        font-size: 10px;
    }

    .play-btn {
        padding: 4px;
    }

    .actions .village_btn {
        padding: 4px 8px;
        font-size: 11px;
    }

    .left-actions .village_btn {
        min-width: 100px;
        font-size: 11px;
        padding: 4px 6px;
    }

    .post-content {
        font-size: 13px;
    }

    :deep(.post-creator .el-textarea__inner) {
        font-size: 13px;
        min-height: 5vh;
    }
}
</style>