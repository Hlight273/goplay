<template>
  <div v-show="userPageOn" class="userPage" :class="{ 'dark-theme': isDarkTheme, 'dissolve-in': userPageOn }">
    <div class="content">
      <!-- 关闭按钮 -->
      <div class="close_btn" @click="commonStore.closeUserPage()">
        <el-icon><CircleCloseFilled /></el-icon>
      </div>
      
      <!-- 主题切换按钮 -->
      <div class="theme-toggle">
        <el-switch
          v-model="isDarkTheme"
          active-text="暗色"
          inactive-text="亮色"
          inline-prompt
        />
      </div>
      
      <!-- 用户信息卡片 -->
      <div class="info" :class="{ 'dark-info': isDarkTheme }">
        <div class="info-background"></div>
        <div class="user-profile">
          <div class="profile-left">
            <img :src="targetUserInfo.avatarUrl" alt="avator" class="avator">
            <span class="lvLabel"><VipTag :level="targetUserVipInfo.level"></VipTag></span>
          </div>
          <div class="profile-right">
            <span class="nickname stroke">{{ targetUserInfo.nickname }}</span>
            <span class="userId">#{{ targetUserInfo.id }}</span>
            
            <!-- 用户统计数据 -->
            <div class="header-stats">
              <div class="header-stat-item">
                <el-icon><Folder /></el-icon>
                <span>{{ myPlaylistInfos.length }}</span>
                <small>歌单</small>
              </div>
              <div class="header-stat-item">
                <el-icon><Star /></el-icon>
                <span>{{ targetUserInfo.hPoints || 0 }}</span>
                <small>积分</small>
              </div>
              <div class="header-stat-item">
                <el-icon><Medal /></el-icon>
                <span>{{ targetUserVipInfo.days || 0 }}</span>
                <small>会员天数</small>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 用户状态标签 -->
        <div class="user-status">
          <el-tag :type="targetUserInfo.isOnline ? 'success' : 'info'" size="small" effect="dark" class="status-tag">
            <el-icon class="status-icon"><component :is="targetUserInfo.isOnline ? 'CircleCheckFilled' : 'Clock'" /></el-icon>
            {{ targetUserInfo.isOnline ? '在线' : '离线' }}
          </el-tag>
        </div>
      </div>
      
      <!-- MBTI 音乐类型展示 - 只显示详细信息和标签 -->
      <div v-if="targetUserInfo.mbtiType" class="mbti-section" :class="{ 'dark-mbti': isDarkTheme }">
        <p>{{ mbtiInfo?.description }}</p>
        <div class="genre-tags">
          <el-tag 
            v-for="(genre, index) in mbtiInfo?.genres" 
            :key="index"
            :type="tagTypes[index % 4]"
            class="genre-tag"
            effect="light"
          >
            {{ genre }}
          </el-tag>
        </div>
      </div>
      
      <!-- 歌单列表 -->
      <div class="recommend-container" :class="{ 'dark-recommend': isDarkTheme }">
        <div class="recommend-header">
          <el-icon class="recommend-icon"><Headset /></el-icon>
          <h2 class="title">歌单列表</h2>
        </div>
        <div class="recommend-list hide_scroll_child">
          <div v-for="(playlistInfo, index) in myPlaylistInfos" :key="index" class="playlist-item">
            <PlaylistBlock :playlist-info="playlistInfo" :my-userinfo="targetUserInfo"/>
          </div>
        </div>
      </div>
      
      <!-- 如果没有歌单，显示空状态 -->
      <div v-if="myPlaylistInfos.length === 0" class="empty-state" :class="{ 'dark-empty': isDarkTheme }">
        <el-empty description="暂无歌单">
          <template #image>
            <el-icon class="empty-icon"><Headset /></el-icon>
          </template>
        </el-empty>
      </div>
    
    </div>
  </div>
</template>

<script lang="ts" setup>
import { userPlaylistInfo } from "@/api/user";
import { Playlist } from "@/interface/playlist";
import { useCommonStore } from "@/store/commonStore";
import { ResultCode } from "@/util/webConst";
import { storeToRefs } from "pinia";
import { onMounted, reactive, ref, computed, watch } from "vue";
import PlaylistBlock from '@/components/playlistBlock.vue'
import VipTag from '@/components/vipTag.vue';
import { MBTICodec, MBTIService } from '@/util/mbtiUtil';
import { CircleCloseFilled, CircleCheckFilled, Clock, Folder, Star, Medal, MagicStick, Headset } from '@element-plus/icons-vue';

const commonStore = useCommonStore();
const { userPageOn, targetUserInfo, targetUserVipInfo } = storeToRefs(commonStore);
const myPlaylistInfos = reactive<Playlist.PlaylistInfo[]>([]);
const isDarkTheme = ref(false);
const tagTypes = ['primary', 'success', 'warning', 'danger'];

// 计算MBTI信息
const mbtiInfo = computed(() => {
  if (!targetUserInfo.value.mbtiType) return null;
  
  const mbtiType = MBTICodec.decode(targetUserInfo.value.mbtiType);
  return MBTIService.getAllTypes()[mbtiType] || null;
});

watch(
  () => userPageOn.value,
  (newVal, oldVal) => {
    if(oldVal==undefined)return;
    if (newVal==true) {//每次进入用户主页 都要重新拉一遍用户列表
      userPlaylistInfo(targetUserInfo.value.id).then(
      (res)=>{   
        switch (res.code) {
          case ResultCode.SUCCESS:
            console.log("拉取歌单",res.oData);
            myPlaylistInfos.length = 0;
            Object.assign(myPlaylistInfos,res.oData);
            console.log("用户主页歌单更新",myPlaylistInfos);
            break;
          case ResultCode.EMPTY:          
            break;
          default:
            break;
        }
      });
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.userPage {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1900;
  top: 0;
  opacity: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  background-color: rgba(0, 0, 0, 0.3);
}

/* 主题切换按钮 */
.theme-toggle {
  position: absolute;
  top: 1.5vh;
  left: 1.5vh;
  z-index: 10;
}

/* 亮色主题 (默认) */
.userPage .content{
  position: relative;
  margin-top: -3vh;
  width: 95%;
  height: 90%;
  display: flex;
  align-items: center;
  flex-direction: column;
  background-color: #f5f5f6;
  border-radius: 1.5vh;
  border: .3vh solid #c2bde8;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0px -.7vh .3vh 0px rgb(128 125 155 / 61%) inset;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 关闭按钮 */
.userPage .content .close_btn {
  position: absolute;
  top: 1.5vh;
  right: 1.5vh;
  font-size: 2.4vh;
  color: #9da3d0;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5vh;
  height: 3.5vh;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
}

.userPage .content .close_btn:hover {
  color: #ff6b6b;
  transform: rotate(90deg);
  background-color: rgba(255, 255, 255, 0.4);
}

/* 用户信息卡片 */
.userPage .content .info {
  display: flex;
  height: 18vh;
  width: 100%;
  background-color: #a9c2ff;
  border-radius: 0 0 1.5vh 1.5vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-bottom: .3vh solid #cfbfef;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

.info-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #a9c2ff, #cfbfef);
  opacity: 0.8;
  z-index: 0;
}

/* 用户资料布局 */
.user-profile {
  display: flex;
  width: 90%;
  align-items: center;
  z-index: 1;
}

.profile-left {
  position: relative;
  margin-right: 2vh;
}

.profile-right {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  flex: 1;
}

/* 头部统计数据 */
.header-stats {
  display: flex;
  margin-top: 1vh;
  width: 100%;
  justify-content: flex-start;
  gap: 1vh;
}

.header-stat-item {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.4vh 1vh;
  border-radius: 1vh;
  color: white;
  font-size: 1.4vh;
}

.header-stat-item el-icon {
  font-size: 1.4vh;
  margin-right: 0.5vh;
}

.header-stat-item span {
  /* font-weight: bold; */
  margin: 0 0.4vh;
}

.header-stat-item small {
  font-size: 1.4vh;
  opacity: 0.8;
}

.userPage .content .info .avator {
  width: 8vh;
  height: 8vh;
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 3px solid white;
  z-index: 1;
  transition: all 0.3s ease;
  object-fit: cover;
}

.userPage .content .info .avator:hover {
  transform: scale(1.05);
}

.userPage .content .info .lvLabel{
  position: absolute;
  right: -1vh;
  bottom: 0;
  z-index: 2;
}

.userPage .content .info .nickname {
  font-size: 2.2vh;
  color: white;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1;
  margin-bottom: 0.5vh;
} 

.userPage .content .info .userId {
  font-size: 1.6vh;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Segoe UI', sans-serif;
  font-weight: bold;
  z-index: 1;
  margin-bottom: 0.5vh;
}

/* 用户状态标签 */
.user-status {
  position: absolute;
  top: 1.5vh;
  left: 1.5vh;
  z-index: 2;
  display: none;
}

.status-tag {
  border: none;
  display: flex;
  align-items: center;
}

.status-icon {
  margin-right: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

/* MBTI 部分 */
.mbti-section {
  width: 90%;
  padding: 2vh;
  background-color: #e7e8ed;
  border-radius: 1.5vh;
  margin-bottom: 2vh;
  margin-top: 2vh;
  border: .1vh solid #cfbfef;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.mbti-section p {
  color: #666;
  font-size: 1.4vh;
  margin-bottom: 1.5vh;
  line-height: 1.6;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 1vh;
}

.genre-tag {
  transition: all 0.3s ease;
  padding: 0.5vh 1.2vh;
  border-radius: 2vh;
}

.genre-tag:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 歌单列表 */
.recommend-container {
  margin-top: 1vh;
  width: 90%;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  background: #e7e8ed;
  border-radius: 1.5vh;
  padding: 2vh;
  border: .1vh solid #cfbfef;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.recommend-header {
  display: flex;
  align-items: center;
  margin-bottom: 1vh;
}

.recommend-icon {
  font-size: 2.2vh;
  margin-right: 0.8vh;
  color: #846887;
}

.recommend-container .title {
  margin: 0;
  font-size: 2vh;
  color: #846887;
}

.recommend-list {
  display: flex;
  gap: 2vh;
  padding: 2vh 0;
  flex-direction: row;
  flex-wrap: wrap;
  overflow: auto;
  max-height: 50vh;
  justify-content: center;
}

.playlist-item {
  position: relative;
  transition: all 0.3s ease;
}

.playlist-item:hover {
  transform: translateY(-5px);
}

/* 空状态样式 */
.empty-state {
  margin-top: 2vh;
  padding: 4vh;
  border-radius: 1.5vh;
  background-color: #e7e8ed;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.empty-icon {
  font-size: 5vh;
  color: #cfbfef;
  margin-bottom: 1vh;
}

/* 暗色主题 */
.dark-theme .content {
  background-color: #1a1a1a;
  border: .3vh solid #333;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0px -.7vh .3vh 0px rgba(0, 0, 0, 0.5) inset;
}

.dark-theme .close_btn {
  color: #ccc;
  background-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .close_btn:hover {
  color: #ff6b6b;
  background-color: rgba(255, 255, 255, 0.2);
}

.dark-theme .info.dark-info {
  background-color: #262626;
  border-bottom: .3vh solid #333;
}

.dark-theme .info.dark-info .info-background {
  background: linear-gradient(135deg, #262626, #333);
}

.dark-theme .header-stat-item {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ccc;
}

.dark-theme .mbti-section.dark-mbti {
  background-color: #2a2a2a;
  border: .1vh solid #333;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.dark-theme .mbti-section p {
  color: #999;
}

.dark-theme .recommend-container.dark-recommend {
  background-color: #2a2a2a;
  border: .1vh solid #333;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.dark-theme .recommend-icon,
.dark-theme .recommend-container .title {
  color: #ccc;
}

.dark-theme .empty-state.dark-empty {
  background-color: #2a2a2a;
  color: #666;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.dark-theme .empty-icon {
  color: #444;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.mbti-section, .recommend-container {
  animation: fadeIn 0.5s ease-out;
}

/* 添加页面进入动画 */
@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.userPage .content {
  animation: slideIn 0.4s ease-out;
}
</style>