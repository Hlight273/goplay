<template>
  <div class="line userlist">
    <div v-if="userInfoList" v-for="userinfo in userInfoList">
      <el-dropdown :ref="(el:any) => setDropdownRef(userinfo.id, el)" placement="bottom" :hide-on-click="false" trigger="click" class="userDropdown">
        <div class="userDisplay_mini">
          <el-icon class="permissionIcon" v-show="userinfo.privilege==1"><Avatar color="#ffa46f" /></el-icon>
          <el-icon class="permissionIcon" v-show="userinfo.privilege==2"><Avatar color="#3fc271" /></el-icon>
          <img :src="userinfo.avatarUrl" alt="avator" class="avator">
          <span>{{ userinfo.id==userId?'我':userinfo.nickname }}</span>
          <!-- 在线状态 -->
          <div class="online-status" :class="{ 'online': userinfo.isOnline === 1, 'offline': userinfo.isOnline === 0 || userinfo.isOnline === undefined }"></div>
        </div>
        <template #dropdown>
          <div class="playerInfoPanel">
            <div class="info">
              <img :src="userinfo.avatarUrl" alt="avator" class="avator">
              <div class="infoRight">
                <span class="userName">{{ userinfo.nickname }}</span>
                <span class="userPri">权限：{{getPrivilegeName(userinfo)}}</span>
                <span class="userId">#{{ userinfo.id }}</span>
              </div>
            </div>
            <div class="btns">
              <el-button class="super_submit" v-show="userinfo.id!=userId && HasOwnerPower(myUserInfo)"
                @click="handleOwnerTransfer(userinfo.id)"
                color="#7365ff">移交房主</el-button>
              
              <el-button class="super_submit" v-show="userinfo.id!=userId && HasOwnerPower(myUserInfo) && !HasRoomAdminPower(userinfo)"
                @click="handleSetAdmin(userinfo.id)"
                color="#7365ff">设为管理员</el-button>

              <el-button class="super_submit" v-show="userinfo.id!=userId && HasOwnerPower(myUserInfo) && HasRoomAdminPower(userinfo)"
                @click="handleRemoveAdmin(userinfo.id)"
                color="#7365ff">移除权限</el-button>

              <el-button class="super_submit" color="#7365ff" @click="handleViewProfile(userinfo)">查看主页</el-button>
            </div>
          </div>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { Avatar } from '@element-plus/icons-vue';
import { type DropdownInstance } from 'element-plus';
import { User } from '@/interface/user';
import { Privilege } from '@/interface/user';
import { getPrivilegeName, HasOwnerPower, HasRoomAdminPower } from '@/api/user';
import { useCommonStore } from "@/store/commonStore";
import { roomOwnerTransPrivilege, roomMemberPrivilege } from '@/api/room';
import { ElMessage } from 'element-plus';

const commonStore = useCommonStore();

const props = defineProps({
  userInfoList: {
    type: Array as () => User.UserInfo[],
    required: true,
    default: () => []
  },
  myUserInfo: {
    type: Object as () => User.UserInfo,
    required: true
  },
  roomCode: {
    type: String,
    required: true
  }
});

const userId = Number(localStorage.getItem("userid"));

// 存储所有 dropdown 实例,动态设置 ref，为了打开主页时关闭dropdown
const dropdownRefs = ref<Record<number, DropdownInstance>>({});
const setDropdownRef = (id: number, el: DropdownInstance) => {
  if (el) {
    dropdownRefs.value[id] = el;
  }
};

// 直接在组件内处理用户操作
const handleOwnerTransfer = (targetUserId: number) => {
  roomOwnerTransPrivilege(props.roomCode, userId, targetUserId)
    .then(res => {
      ElMessage.success(res.message || '房主权限移交成功');
    })
    .catch(err => {
      ElMessage.error('操作失败：' + (err.message || '未知错误'));
    });
};

const handleSetAdmin = (targetUserId: number) => {
  roomMemberPrivilege(props.roomCode, targetUserId, Privilege.Enum.管理员, userId)
    .then(res => {
      ElMessage.success(res.message || '设置管理员成功');
    })
    .catch(err => {
      ElMessage.error('操作失败：' + (err.message || '未知错误'));
    });
};

const handleRemoveAdmin = (targetUserId: number) => {
  roomMemberPrivilege(props.roomCode, targetUserId, Privilege.Enum.成员, userId)
    .then(res => {
      ElMessage.success(res.message || '移除权限成功');
    })
    .catch(err => {
      ElMessage.error('操作失败：' + (err.message || '未知错误'));
    });
};

const handleViewProfile = (userinfo: User.UserInfo) => {
  commonStore.openUserPage_byUserInfo(userinfo);
  const dropdown = dropdownRefs.value[userinfo.id];
  if (dropdown) {
    dropdown.handleClose(); // 调用 Element Plus 的关闭方法
  }
};
</script>

<style scoped>
/* 在线用户框 */
.userDisplay_mini {
  cursor: pointer;
  position: relative;
  padding: .6vh;
  margin: 0 .5vh;
  height: 6.5vh;
  width: 6.5vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border-radius: .5vh;
  border: 0.01vh solid #fbedff;
  box-shadow: 0px -.7vh .2vh 0px rgb(101 95 156 / 30%) inset;
}
.userDisplay_mini>img{
  height: 4vh;
  width: 4vh;
  border-radius: 3vh;
  box-shadow: 0px 0px .4vh .1vh rgb(135 136 150 / 40%);
}
.userDisplay_mini>span{
  margin-top: .3vh;
  width: 8vh;
  line-height: 1.6vh;
  font-size: 1.1vh;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  text-align: center;
}
.permissionIcon {
  position: absolute;
  top: -.15vh;
  left: .2vh;
  padding: .1vh;
  font-size: 1.4vh;
  background-color: #ffffff;
  border-radius: 5vh;
  border: 1px #e9e9e9 solid;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, 0.2);
}

.line.userlist {
  justify-content: center;
  height: 7.5vh;
}

/* 点头像的 用户弹出框 */
.playerInfoPanel {
  display: flex;
  flex-direction: column;
  border: .17vh solid #eae1ff;
  border-bottom: 1vh solid #abbccd;
  border-radius: 2vh;
  background-color: white;
  box-shadow: 1vh -5.4vh .7vh -5.7vh #511a3d inset;
  border-top: .1vh solid #eae5ff;
}
.playerInfoPanel .info {
  position: relative;
  display: flex;
  width: 20vh;
  height: 10vh;
  margin: 1vh;
  background-color: #dfdfdf;
  border-radius: 2vh;
  align-items: center;
}
.playerInfoPanel .info .avator{
  margin-left: .5vh;
  height: 6.2vh;
  width: 6.2vh;
  border-radius: 9.5vh;
  box-shadow: 0px 0px 3px 0px rgba(0, 0, 0, .3);
}
.playerInfoPanel .info .infoRight {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding-top: 1.5vh;
}
.playerInfoPanel .info .infoRight .userName {
  height: 2vh;
  line-height: 2vh;
  background-color: #7365ff;
  margin:.5vh;
  padding: 0 .5vh;
  border-radius: 5vh;
  color: white;
  font-size: 1.4vh;
  font-weight: bold;
}
.playerInfoPanel .info .infoRight .userPri {
  height: 2vh;
  line-height: 2vh;
  background-color: #5f626d;
  margin: -.2vh .5vh;
  padding: 0 .5vh;
  border-radius: 5vh;
  color: white;
  font-size: 1.4vh;
}
.playerInfoPanel .info .infoRight .userId {
  height: 2vh;
  line-height: 2vh;
  position: absolute;
  right: 1.2vh;
  bottom: 1vh;
  font-size: 2vh;
  color: #c6c6c6;
  font-family: Segoe UI Black;
  font-weight: bold;
}
.playerInfoPanel .btns {
  display: flex;
  height: 8vh;
  width: 22vh;
  flex-wrap: wrap;
}

.online-status {
  position: absolute;
  bottom: 0.5vh;
  right: 0.5vh;
  width: 1vh;
  height: 1vh;
  border-radius: 50%;
  border: 0.1vh solid #ffffff;
  box-shadow: 0 0 0.2vh rgba(0, 0, 0, 0.3);
}

.online-status.online {
  background-color: #4CAF50; /* 在线状态为绿色 */
  animation: pulse 2s infinite;
}

.online-status.offline {
  background-color: #9e9e9e; /* 离线状态为灰色 */
}

.online-status {
  position: absolute;
  bottom: 0.5vh;
  right: 0.5vh;
  width: 1vh;
  height: 1vh;
  border-radius: 50%;
  border: 0.1vh solid #ffffff;
  box-shadow: 0 0 0.2vh rgba(0, 0, 0, 0.3);
}

.online-status.online {
  background-color: #4CAF50; /* 在线状态为绿色 */
  animation: pulse 2s infinite;
}

.online-status.offline {
  background-color: #9e9e9e; /* 离线状态为灰色 */
}

/* 在线状态 */
.userOnline {
  display: inline-block;
  padding: 0 0.5vh;
  border-radius: 0.5vh;
  font-size: 1.2vh;
  margin-top: 0.3vh;
  color: white;
}

.userOnline.online {
  background-color: #4CAF50;
}

.userOnline.offline {
  background-color: #9e9e9e;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    box-shadow: 0 0 0 0.5vh rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}
</style>