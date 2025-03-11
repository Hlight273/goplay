<template>
    <div class="comment-section">
      <!-- 判断是否有评论 -->
      <div v-if="comments.length === 0" class="no-comments">
        当前评论空空如也哟
      </div>
      
      <div class="hide_scroll_child">
        <div v-for="comment in comments" :key="comment.id" class="comment" :class="{'highlighted': selectedComment?.id === comment.id}">
            <div class="comment-content">
            <p class="comment-text">{{ comment.contentText }}</p>
            <div class="comment-meta">
                <span class="author">用户 {{ comment.addedByName }}</span>
                <span class="date">{{ formatDate(comment.addedAt) }}</span>
                <el-button v-show="comment.totalReplies ?? 0" class="noback_btn" size="small" @click="toggleReplies(comment)">
                {{ (comment.loadedRepliesCount ?? 0) < (comment.totalReplies ?? 0) ? 
                `展开更多 (${(comment.totalReplies ?? 0) - (comment.loadedRepliesCount ?? 0)})` 
                : "收起" }}
                </el-button>
                <el-button class="noback_btn" size="small" @click="selectComment(comment)">回复</el-button>
            </div>
            </div>
    
            <!-- 二级评论 -->
            <div v-if="comment.replies?.length" class="replies">
            <div v-for="reply in comment.replies" :key="reply.id" class="reply">
                <p class="reply-text"> {{ comment.addedByName }}:{{ reply.contentText }}</p>
            </div>
            </div>
        </div>
      </div>
     

      <div class="placeholder"></div>
  
      <div class="r-bottom">
        <!-- 回复提示 -->
        <div v-if="selectedComment" class="reply-info limit_w" @click="selectedComment=null">
                @{{ selectedComment.contentText }}:&nbsp;
        </div>
    
        <!-- 评论输入框 -->
        <div class="comment-input">
            <el-input
            v-model="newComment"
            type="textarea"
            placeholder="请输入评论..."
            :rows="4"
            ></el-input>
            <el-button style="float: right;margin: 1vh;" class="black_oil_btn" type="primary" @click="submitComment">
                提交评论
            </el-button>
        </div>
      </div>
     
  
      <!-- 分页 -->
      <el-pagination
        v-if="totalComments > pageSize"
        layout="prev, pager, next"
        :total="totalComments"
        :page-size="pageSize"
        @current-change="fetchComments"
      />
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted, onUnmounted, watch } from "vue";
  import { getCommentsBySong, getRepliesByComment, addComment } from "@/api/song";
  import { Song } from "@/interface/song";
  import { formatDate } from "@/util/commonUtil";
  import { ResultCode } from "@/util/webConst";
  import { ElMessage } from "element-plus";
  
  const props = defineProps<{curSong:Song.SongContent}>();
  const comments = ref<Song.Comment[]>([]);
  const totalComments = ref(0);
  const pageSize = 5;
  const currentPage = ref(1);
  const newComment = ref(""); // 新评论的内容
  const selectedComment = ref<Song.Comment | null>(null); // 当前选中的评论
  
  // 获取评论
  const fetchComments = async (page = 1) => {
    const res = await getCommentsBySong(props.curSong.songInfo.id, page, pageSize);
    if (res.data) {
      comments.value = res.data.comments;
      totalComments.value = res.data.total;
    }
  };
  
  // 切换回复的显示
  const toggleReplies = async (comment: Song.Comment) => {
    if (comment.loadedRepliesCount && comment.loadedRepliesCount >= (comment.totalReplies ?? 0)) {
      comment.replies = [];
      comment.loadedRepliesCount = 0;
      return;
    }
  
    const page = Math.floor((comment.loadedRepliesCount || 0) / 5) + 1;
    const res = await getRepliesByComment(comment.id, page, 5);
  
    if (res.data) {
      comment.replies = [...(comment.replies || []), ...res.data.replies];
      comment.loadedRepliesCount = (comment.loadedRepliesCount || 0) + res.data.replies.length;
    }
  };
  
  // 选中评论并准备回复
  const selectComment = (comment: Song.Comment) => {
    selectedComment.value = comment;
    newComment.value = ""; // 清空输入框
  };
  
  // 提交新评论
  const submitComment = () => {
    if (newComment.value.trim()) {
      const commentData = {
        songId:props.curSong.songInfo.id,
        contentText: newComment.value.trim(),
        parentId: selectedComment.value?.id // 如果是回复评论，传递parentId
      };
      addComment(commentData).then((res) => {
        switch (res.code) {
          case ResultCode.SUCCESS:
            ElMessage.success(res.message);
            newComment.value = ""; // 清空输入框
            fetchComments(); // 刷新评论列表
            break;
          default:
            ElMessage.error("提交失败，请稍后再试");
            break;
        }
      });
    }
  };

watch(() => props.curSong, (newMessage, oldMessage) => {
    console.log("新歌来咯");
    selectedComment.value = null;
    fetchComments(1)
},{ deep: true });//深度监听
  </script>
  
  <style scoped>
  .comment-section {
    display: flex;
    padding: 1.0vh;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    transition: 0.3s ease-in-out, transform 0.2s;
  }
  .comment {
    border-bottom: .2vh solid #454545;
    padding: .5vh 1vh;
  }
  .comment-content {
    display: flex;
    flex-direction: column;
  }
  .comment-text {
    font-size: 1.4vh;
    color: #e0e0e0;
  }
  .comment-meta {
    display: flex;
    justify-content: space-between;
    font-size: 1.2vh;
    color: gray;
  }
  .replies {
    margin-left: .20vh;
    border-left: .2vh solid #d36868;;
    padding-left: 1vh;
    font-size: 1.3vh;
    color: #e0e0e0;
  }
  .comment-input {
    /* margin-top: 2vh; */
    padding: .2vh 2vh;
  }
  :deep(.comment-input .el-textarea__inner){
    padding: 1vh;
    border-radius: 1.6vh;
    min-height: 6vh;
    max-height: 12vh;
    background-color: #2a2a2a;
    box-shadow: 0 .1vh .1vh .01vh #00000024 inset;
    font-size: 1.4vh;
    resize: none;
  }
  :deep(.comment-input .el-textarea__inner:focus){
    box-shadow: 0 0 0 .1vh #525252 inset;
  }
  .no-comments {
    text-align: center;
    color: #888;
    height: 54vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .highlighted {
    box-sizing: border-box;
    background-color: #404040;
    border-bottom: none;
    border-radius: 1vh;
  }
  .reply-info {
    cursor: pointer;
    margin: 1vh 2vh;
    color: #888;
    font-size: 1.4vh;
    max-width: 18vh;
    box-sizing: border-box;
    padding: .4vh 1vh;
    border-radius: .5vh;
    transition: 0.3s ease-in-out, transform 0.2s;
  }
  .reply-info:hover {
    color: #888;
    background-color: #404040;
    font-size: 1.4vh;
    transition: 0.3s ease-in-out, transform 0.2s;
  }
  .reply-info::before { /* 基础状态定义 */
  content: "";
  transition: 0.3s ease-in-out, transform 0.2s;
}
.reply-info:hover::before {
  content: "取消";
  display: inline-block;
  margin-left: 1vh;
  border-radius: 2vh;
  transition: 0.3s ease-in-out, transform 0.2s;
}

.placeholder {
    flex: 1;
}


.r-bottom {
    margin-bottom: 2.4vh;
}
  </style>
  