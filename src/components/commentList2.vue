<template>
    <div class="comment-section">
        <div v-if="comments.length === 0" class="no-comments">
            当前评论空空如也哟
        </div>
        <div v-else class="comments-list hide_scroll_child">
            <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                    <el-avatar :src="comment.addedByAvatar" size="small" />
                    <span class="comment-author">{{ comment.addedByName }}</span>
                    <span class="comment-time">{{ formatDate(comment.addedAt) }}</span>
                </div>
                <div class="comment-content">{{ comment.contentText }}</div>
                <!-- 评论操作区 -->
                <div class="comment-actions">
                    <el-button link type="primary" @click="handleReply(comment)">
                        回复
                    </el-button>
                    <el-button v-if="comment.totalReplies > 0" link @click="toggleReplies(comment)">
                        {{ comment.showReplies ? '收起回复' : `查看回复(${comment.totalReplies})` }}
                    </el-button>
                </div>
                <!-- 二级评论区域 -->
                <div v-if="comment.showReplies && comment.replies" class="replies-section">
                    <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                        <div class="comment-header">
                            <el-avatar :src="reply.addedByAvatar" size="small" />
                            <span class="comment-author">{{ reply.addedByName }}</span>
                            <span class="reply-to">回复</span>
                            <span class="comment-author">@{{ reply.replyToName }}</span>
                            <span class="comment-time">{{ formatDate(reply.addedAt) }}</span>
                        </div>
                        <div class="comment-content">{{ reply.contentText }}</div>
                        <div class="comment-actions">
                            <el-button link type="primary" @click="handleReply(reply, comment)">
                                回复 @{{ reply.addedByName }}
                            </el-button>
                        </div>
                    </div>
                    <div v-if="comment.loadedRepliesCount < comment.totalReplies" class="load-more-replies">
                        <el-button link @click="loadMoreReplies(comment)">加载更多回复</el-button>
                    </div>
                </div>
            </div>
            <!-- 加载更多评论 -->
            <div v-if="hasMoreComments" class="load-more-comments">
                <el-button link @click="loadMoreComments">加载更多评论</el-button>
            </div>
        </div>
        <!-- 评论输入框 -->
        <div class="comment-input">
            <div v-if="replyingTo" class="replying-to">
                回复 @{{ replyingTo.addedByName }}
                <el-button link @click="cancelReply">
                    <el-icon><Close /></el-icon>
                </el-button>
            </div>
            <el-input
                v-model="newComment"
                type="textarea"
                :rows="2"
                :placeholder="replyingTo ? `回复 @${replyingTo.addedByName}...` : '写下你的评论...'"
            />
            <el-button class="village_btn" type="primary" @click="submitComment">
                {{ replyingTo ? '回复' : '发表评论' }}
            </el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { Post } from '@/interface/post'
import { formatDate } from "@/util/commonUtil"
import { ElMessage } from 'element-plus'
import { getPostComments, getCommentReplies, addPostComment } from '@/api/post'
import { ResultCode } from '@/util/webConst'

const props = defineProps<{
    postId: number
}>()

// 评论相关的响应式变量
const comments = ref<Post.PostComment[]>([])
const newComment = ref('')
const commentPage = ref(1)
const commentPageSize = ref(10)
const hasMoreComments = ref(true)

// 回复相关的响应式变量
const replyingTo = ref<Post.PostComment | null>(null)
const replyToComment = ref<Post.PostComment | null>(null)

// 初始化评论列表
const initComments = async () => {
    commentPage.value = 1
    const res = await getPostComments(props.postId, commentPage.value, commentPageSize.value)
    if (res.data) {
        comments.value = res.data.comments
        hasMoreComments.value = comments.value.length < res.data.total
    }
}

// 加载更多评论
const loadMoreComments = async () => {
    commentPage.value++
    const res = await getPostComments(props.postId, commentPage.value, commentPageSize.value)
    if (res.data) {
        comments.value.push(...res.data.comments)
        hasMoreComments.value = comments.value.length < res.data.total
    }
}

// 处理回复
const handleReply = (comment: Post.PostComment, parentComment?: Post.PostComment) => {
    replyingTo.value = comment
    replyToComment.value = parentComment || comment
}

// 取消回复
const cancelReply = () => {
    replyingTo.value = null
    replyToComment.value = null
}

// 切换二级评论显示状态
const toggleReplies = async (comment: Post.PostComment) => {
    comment.showReplies = !comment.showReplies
    if (comment.showReplies && (!comment.replies || comment.replies.length === 0)) {
        const res = await getCommentReplies(comment.id, 1, commentPageSize.value)
        if (res.data) {
            comment.replies = res.data.replies
            comment.totalReplies = res.data.total
            comment.loadedRepliesCount = res.data.replies.length
        }
    }
}

// 加载更多二级评论
const loadMoreReplies = async (comment: Post.PostComment) => {
    if (!comment.loadedRepliesCount || !comment.replies) return
    
    const nextPage = Math.floor(comment.loadedRepliesCount / commentPageSize.value) + 1
    const res = await getCommentReplies(comment.id, nextPage, commentPageSize.value)
    if (res.data) {
        comment.replies.push(...res.data.replies)
        comment.loadedRepliesCount = comment.replies.length
    }
}

// 提交评论
const submitComment = async () => {
    if (!newComment.value.trim()) {
        ElMessage.warning('请输入内容')
        return
    }

    const comment: Post.PostComment = {
        postId: props.postId,
        contentText: newComment.value.trim(),
        parentId: replyingTo.value?.id || null,
        id: 0,
        addedBy: 0,
        addedAt: '',
        isActive: 0,
        addedByName: '',
        addedByAvatar: ''
    }

    const res = await addPostComment(comment)
    if (res.code === ResultCode.SUCCESS) {
        ElMessage.success(replyingTo.value ? '回复成功' : '评论成功')
        newComment.value = ''
        
        if (replyingTo.value && replyToComment.value) {
            // 如果是回复，刷新该评论的回复列表
            const repliesRes = await getCommentReplies(replyToComment.value.id, 1, commentPageSize.value)
            if (repliesRes.data) {
                replyToComment.value.replies = repliesRes.data.replies
                replyToComment.value.totalReplies = (replyToComment.value.totalReplies || 0) + 1
                replyToComment.value.loadedRepliesCount = repliesRes.data.replies.length
            }
        } else {
            // 如果是一级评论，刷新评论列表
            await initComments()
        }
        
        // 清除回复状态
        cancelReply()
    } else {
        ElMessage.error('发布失败')
    }
}

// 初始化
initComments()
</script>

<style scoped>
/* 评论区样式 */
.comments-section {
    margin-top: 16px;
    border-top: 1px solid #eee;
    padding-top: 16px;
}

.comments-list {
    max-height: 400px;
    overflow-y: auto;
}

.comment-item {
    margin-bottom: 16px;
    padding: 12px;
    border-bottom: 1px solid #eee;
    background-color: var(--el-bg-color-page);
    border-radius: 6px;
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.comment-author {
    font-weight: 500;
    font-size: 14px;
    color: var(--el-text-color-primary);
    /* 添加悬停效果 */
    &:hover {
        color: var(--el-color-primary);
        cursor: pointer;
    }
}

.comment-content {
    font-size: 14px;
    color: var(--el-text-color-primary);
}

.load-more-comments {
    text-align: center;
    margin: 12px 0;
}

.comment-input {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    align-items: flex-end;
}
.replies-section {
    margin-left: 24px;
    margin-top: 12px;
    padding-left: 12px;
    border-left: 2px solid var(--el-border-color-lighter);
}

.reply-item {
    margin-bottom: 12px;
    padding: 8px;
    background-color: var(--el-bg-color);
    border-radius: 4px;
}

.reply-item .comment-author {
    font-size: 13px;
}

.reply-item .comment-time {
    font-size: 11px;
}

.comment-actions {
    margin-top: 8px;
    display: flex;
    gap: 12px;
}

.comment-time {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-left: auto; /* 将时间推到右边 */
}

.reply-to {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin: 0 4px;
}

.replying-to {
    background-color: var(--el-bg-color);
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.load-more-replies {
    text-align: center;
    margin: 8px 0;
}


  :deep(.comment-input .el-textarea__inner){
    padding: 1vh;
    border-radius: 1.6vh;
    min-height: 6vh;
    max-height: 12vh;
    /* background-color: #efeff2; */
    /* box-shadow: 0 .1vh .1vh .01vh #a6fffa24 inset; */
    font-size: 1.4vh;
    resize: none;
  }

  /* 添加移动端适配样式 */
@media screen and (max-width: 768px) {
    .replies-section {
        margin-left: 12px;
        padding-left: 8px;
    }

    .reply-item {
        margin-bottom: 8px;
        padding: 6px;
    }

    .reply-item .comment-header {
        flex-wrap: wrap;
        gap: 4px;
    }

    .reply-item .comment-author {
        font-size: 12px;
    }

    .reply-item .reply-to {
        font-size: 11px;
        margin: 0 2px;
    }

    .reply-item .comment-time {
        font-size: 10px;
        width: 100%;
        margin: 2px 0;
        text-align: right;
    }

    .reply-item .comment-content {
        font-size: 13px;
        margin: 4px 0;
    }

    .reply-item .comment-actions {
        margin-top: 4px;
    }

    .reply-item .el-button {
        padding: 4px 8px;
        font-size: 12px;
    }
}

@media screen and (max-width: 480px) {
    .replies-section {
        margin-left: 8px;
        padding-left: 6px;
    }

    .reply-item {
        margin-bottom: 6px;
        padding: 4px;
    }

    .reply-item .comment-header {
        margin-bottom: 4px;
    }

    .reply-item .comment-content {
        font-size: 12px;
    }

    .reply-item .el-button {
        padding: 2px 6px;
        font-size: 11px;
    }
}
</style>