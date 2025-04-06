<template>
  <div v-if="isAdmin" class="admin-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-select v-model="searchType" class="search-type">
        <el-option label="歌单" value="playlist" />
        <el-option label="歌曲" value="song" />
        <el-option label="用户" value="user" />
      </el-select>
      
      <el-input 
        v-model="searchKeyword"
        :placeholder="getPlaceholder"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="handleSearch"/>
        </template>
      </el-input>

      <el-input
        v-model="searchId"
        placeholder="输入ID直接搜索"
        clearable
        @keyup.enter="handleSearch"
        class="id-input"
      />
    </div>
    <!-- 搜索结果区域 -->
    <div v-loading="loading" class="result-area">
      <!-- 歌单搜索结果 -->
      <div v-if="searchType === 'playlist'" class="list-container">
        <el-table :data="playlistResults">
          <el-table-column prop="playlist.id" label="ID" width="80" />
          <el-table-column prop="playlist.title" label="歌单名称" />
          <el-table-column prop="playlist.description" label="描述" />
          <el-table-column prop="playlist.userId" label="创建者" />
          <el-table-column prop="playlist.addedAt" label="创建时间">
            <template #default="scope">
              {{formatDate(scope.row.playlist.addedAt)}}
            </template>
          </el-table-column>
          <el-table-column prop="playlist.isActive" label="状态">
            <template #default="scope">
              {{ scope.row.playlist.isActive === 1 ? '已上架' : '已下架' }}
            </template>
          </el-table-column>
          <!-- 歌单搜索结果表格中的操作列 -->
          <el-table-column fixed="right" label="操作" width="300">
            <template #default="scope">
              <el-button 
                :type="scope.row.playlist.isActive === 1 ? 'danger' : 'success'"
                size="small" 
                @click="handlePlaylistActiveChange(scope.row.playlist)"
              >
                {{ scope.row.playlist.isActive === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="openPlaylistDetail(scope.row)"
              >
                查看
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="openPlaylistDialog(scope.row.playlist)"
              >
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 歌曲搜索结果 -->
      <div v-if="searchType === 'song'" class="list-container">
        <el-table :data="songResults">
          <el-table-column prop="song.id" label="ID" width="80" />
          <el-table-column prop="songInfo.songName" label="歌曲名称" />
          <el-table-column prop="songInfo.songArtist" label="艺术家" />
          <el-table-column prop="songInfo.songAlbum" label="专辑" />
          <el-table-column prop="songInfo.songDuration" label="时长">
            <template #default="scope">
              {{ Math.floor(scope.row.songInfo.songDuration / 60) }}:{{ (scope.row.songInfo.songDuration % 60).toString().padStart(2, '0') }}
            </template>
          </el-table-column>
          <el-table-column prop="song.isActive" label="状态">
            <template #default="scope">
              {{ scope.row.song.isActive === 1 ? '已上架' : '已下架' }}
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="200">
            <template #default="scope">
              <el-button 
                :type="scope.row.song.isActive === 1 ? 'danger' : 'success'"
                size="small" 
                @click="handleSongActiveChange(scope.row)"
              >
                {{ scope.row.song.isActive === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="openSongDialog(scope.row)"
              >
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 在歌曲搜索结果后面添加用户搜索结果 -->
      <!-- 用户搜索结果 -->
      <div v-if="searchType === 'user'" class="list-container">
        <el-table :data="userResults">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="level" label="等级">
            <template #default="scope">
              {{ Level.Enum[scope.row.level] }}
            </template>
          </el-table-column>
          <el-table-column prop="isActive" label="状态">
            <template #default="scope">
              {{ scope.row.isActive === 1 ? '正常' : '已禁用' }}
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="200">
            <template #default="scope">
              <el-button 
                :type="scope.row.isActive === 1 ? 'danger' : 'success'"
                size="small" 
                @click="handleUserActiveChange(scope.row)"
              >
                {{ scope.row.isActive === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button
                type="primary"
                size="small"
                @click="openUserLevelDialog(scope.row)"
              >
                修改权限
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
       <!-- 添加用户权限修改弹窗 -->
  <el-dialog 
    v-model="userLevelDialogVisible" 
    title="修改用户权限" 
    width="30%"
  >
    <el-form :model="userLevelForm" label-width="100px">
        <el-form-item label="当前权限">
          <span>{{ Level.Enum[userLevelForm.currentLevel] }}</span>
        </el-form-item>
        <el-form-item label="新权限">
          <el-select v-model="userLevelForm.newLevel">
            <el-option
              v-for="(label, value) in Level.Enum"
              :key="Number(value)"
              :label="label"
              :value="Number(value)"
              v-if="typeof value === 'number'"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userLevelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdateUserLevel">确定</el-button>
      </template>
    </el-dialog>

      <!-- 歌单编辑弹窗 -->
      <el-dialog v-model="playlistDialogVisible" title="编辑歌单信息" @close="resetPlaylistForm">
        <el-form :model="playlistFormData" ref="playlistFormRef" label-width="80px">
          <el-form-item label="歌单标题" :rules="[{ required: true, message: '请输入歌单标题', trigger: 'blur' }]">
            <el-input v-model="playlistFormData.title" />
          </el-form-item>
          <el-form-item label="歌单描述" :rules="[{ required: true, message: '请输入歌单描述', trigger: 'blur' }]">
            <el-input v-model="playlistFormData.description" type="textarea" />
          </el-form-item>
          <el-form-item label="是否公开">
            <el-switch v-model="playlistFormData.isPublic" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="playlistDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpdatePlaylist">确定</el-button>
        </template>
      </el-dialog>

      <!-- 歌曲编辑弹窗 -->
      <el-dialog v-model="songDialogVisible" title="编辑歌曲信息" @close="resetSongForm">
        <el-form :model="songFormData" ref="songFormRef" label-width="80px">
          <el-form-item label="歌曲名称" :rules="[{ required: true, message: '请输入歌曲名称', trigger: 'blur' }]">
            <el-input v-model="songFormData.songName" />
          </el-form-item>
          <el-form-item label="艺术家" :rules="[{ required: true, message: '请输入艺术家', trigger: 'blur' }]">
            <el-input v-model="songFormData.songArtist" />
          </el-form-item>
          <el-form-item label="专辑" :rules="[{ required: true, message: '请输入专辑名称', trigger: 'blur' }]">
            <el-input v-model="songFormData.songAlbum" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="songDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpdateSong">确定</el-button>
        </template>
      </el-dialog>


      <!-- 添加歌单详情弹窗 -->
      <el-dialog 
        v-model="playlistDetailVisible" 
        title="歌单详情" 
        width="90%"
        :close-on-click-modal="false"
        class="playlist-detail-dialog"
      >
        <div v-if="selectedPlaylist" class="playlist-detail">
          <div class="infobox">
            <img :src='(selectedPlaylist.playlist.coverUrl!=null&&selectedPlaylist.playlist.coverUrl!="")?
                (getPlaylistCoverURL(selectedPlaylist.playlist.coverUrl)):
                require("@/assets/icons/audio_folder.png")' class="playlist-cover mini-cover" />
            <div class="column">
              <h3>{{ selectedPlaylist.playlist.title }}</h3>
              <span>简介：{{ selectedPlaylist.playlist.description }}</span>
            </div>
            <div class="creater">
              <span>{{ formatDate(selectedPlaylist.playlist.addedAt) }}</span>
            </div>
          </div>
          <GoSongList 
            :my-user-info="myUserInfo" 
            :playlist-info="selectedPlaylist"
            :is-room-playlist="false"
          />
        </div>
      </el-dialog>
    </div>
  </div>

  <div v-else>
    <el-empty description="无权限访问" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { User, Level } from '@/interface/user'
import { Playlist } from '@/interface/playlist'
import { Song } from '@/interface/song'
import { 
  searchAdminPlaylists, 
  searchAdminSongs, 
  searchAdminUsers,
  activatePlaylist,
  deactivatePlaylist,
  activateSong,
  deactivateSong,
  updatePlaylistAdmin,
  updateSongAdmin,
takedownSong,
takedownPlaylist
} from '@/api/admin'
import { getPlaylistCoverURL } from '@/api/static'
import GoSongList from '@/components/goSongList.vue'
import { ResultCode } from '@/util/webConst'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/util/commonUtil'
import { 
  activateUser,
  deactivateUser
} from '@/api/admin'
type SearchType = 'playlist' | 'song' | 'user'
const searchType = ref<SearchType>('playlist')
const searchKeyword = ref('')
const searchId = ref('')
const loading = ref(false)

const playlistResults = ref<Playlist.PlaylistInfo[]>([])
const songResults = ref<Song.SongDetailDTO[]>([])
const userResults = ref<User.UserInfo[]>([])

const myUserInfo = ref<User.UserInfo>({...User.UserInfo_InitData})
const isAdmin = ref(true) // 假设有权限检查逻辑

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 计算属性
const getPlaceholder = computed(() => {
  const map: Record<SearchType, string> = {
    'playlist': '搜索歌单名称',
    'song': '搜索歌曲名称',
    'user': '搜索用户名/昵称'
  }
  return map[searchType.value]
})

const noResults = computed(() => {
  switch(searchType.value) {
    case 'playlist': return playlistResults.value.length === 0
    case 'song': return songResults.value.length === 0
    case 'user': return userResults.value.length === 0
    default: return true
  }
})

// 搜索处理
const handleSearch = () => {
  loading.value = true
  
  const params = {
    keyword: searchKeyword.value,
    id: searchId.value ? parseInt(searchId.value) : undefined,
    page: currentPage.value,
    pageSize: pageSize.value
  }

  switch(searchType.value) {
    case 'playlist':
      searchAdminPlaylists(params).then((res) => {
        if(res.code === ResultCode.SUCCESS) {
          console.log("xx",res);
          
          playlistResults.value = res.data.playlistInfos//过滤掉没有歌曲的歌单
            .filter(playlist => playlist.playlist!=null&&playlist.songContentList.length>0)
          total.value = res.data.total
          ElMessage.success("查询成功，已过滤空的歌单")
        }else if(res.code === ResultCode.EMPTY) {
          playlistResults.value = []
          total.value = 0
          ElMessage.info("查询为空")
        }
        loading.value = false
      })
      break
    case 'song':
      searchAdminSongs(params).then((res) => {
        if(res.code === ResultCode.SUCCESS) {
          songResults.value = res.data.songs
          total.value = res.data.total
        }
        loading.value = false
      })
      break
    case 'user':
      searchAdminUsers(params).then((res) => {
        if(res.code === ResultCode.SUCCESS) {
          userResults.value = res.data.users
          total.value = res.data.total
        }
        loading.value = false
      })
      break
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  handleSearch()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  handleSearch()
}

// 操作处理
const handlePlaylistTakedown = (playlistId: number) => {
  ElMessageBox.confirm('确定要下架该歌单吗？').then(() => {
    takedownPlaylist(playlistId).then((res) => {
      if(res.code === ResultCode.SUCCESS) {
        ElMessage.success('下架成功')
        handleSearch() // 刷新列表
      }
    })
  }).catch(() => {
    // 用户取消操作
  })
}

const handleSongTakedown = (songId: number) => {
  ElMessageBox.confirm('确定要下架该歌曲吗？').then(() => {
    takedownSong(songId).then((res) => {
      if(res.code === ResultCode.SUCCESS) {
        ElMessage.success('下架成功')
        handleSearch() // 刷新列表
      }
    })
  }).catch(() => {
    // 用户取消操作
  })
}

// const handleUserBan = (userId: number) => {
//   ElMessageBox.confirm('确定要禁用该用户吗？').then(() => {
//     banUser(userId).then((res) => {
//       if(res.code === ResultCode.SUCCESS) {
//         ElMessage.success('操作成功')
//         handleSearch() // 刷新列表
//       }
//     })
//   }).catch(() => {
//     // 用户取消操作
//   })
// }

// 编辑相关的状态
const playlistDialogVisible = ref(false)
const songDialogVisible = ref(false)
const playlistFormData = ref<Playlist.PlaylistForm>({...Playlist.playlistForm_InitData})
const songFormData = ref({
  id: 0,
  songName: '',
  songArtist: '',
  songAlbum: ''
})

// 打开编辑弹窗
const openPlaylistDialog = (playlist: Playlist.Playlist) => {
  playlistFormData.value = {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    coverUrl: playlist.coverUrl,
    isPublic: playlist.isPublic
  }
  playlistDialogVisible.value = true
}

const openSongDialog = (songDetail: Song.SongDetailDTO) => {
  songFormData.value = {
    id: songDetail.song.id,
    songName: songDetail.songInfo.songName,
    songArtist: songDetail.songInfo.songArtist,
    songAlbum: songDetail.songInfo.songAlbum
  }
  songDialogVisible.value = true
}

// 重置表单
const resetPlaylistForm = () => {
  playlistFormData.value = {...Playlist.playlistForm_InitData}
}

const resetSongForm = () => {
  songFormData.value = {
    id: 0,
    songName: '',
    songArtist: '',
    songAlbum: ''
  }
}

// 提交更新
const submitUpdatePlaylist = () => {
  updatePlaylistAdmin(playlistFormData.value.id, playlistFormData.value).then(res => {
    if(res.code === ResultCode.SUCCESS) {
      ElMessage.success('更新成功')
      playlistDialogVisible.value = false
      handleSearch() // 刷新列表
    }
  })
}

const submitUpdateSong = () => {
  updateSongAdmin(songFormData.value.id, {
    songName: songFormData.value.songName,
    songArtist: songFormData.value.songArtist,
    songAlbum: songFormData.value.songAlbum
  }).then(res => {
    if(res.code === ResultCode.SUCCESS) {
      ElMessage.success('更新成功')
      songDialogVisible.value = false
      handleSearch() // 刷新列表
    }
  })
}

// 处理上下架
const handlePlaylistActiveChange = (playlist: Playlist.Playlist) => {
  const action = playlist.isActive === 1 ? deactivatePlaylist : activatePlaylist
  const actionName = playlist.isActive === 1 ? '下架' : '上架'
  
  ElMessageBox.confirm(`确定要${actionName}该歌单吗？`).then(() => {
    action(playlist.id).then((res) => {
      if(res.code === ResultCode.SUCCESS) {
        ElMessage.success(`${actionName}成功`)
        handleSearch() // 刷新列表
      }
    })
  }).catch(() => {
    // 用户取消操作
  })
}

const handleSongActiveChange = (songDetail: Song.SongDetailDTO) => {
  const action = songDetail.song.isActive === 1 ? deactivateSong : activateSong
  const actionName = songDetail.song.isActive === 1 ? '下架' : '上架'
  
  ElMessageBox.confirm(`确定要${actionName}该歌曲吗？`).then(() => {
    action(songDetail.song.id).then((res) => {
      if(res.code === ResultCode.SUCCESS) {
        ElMessage.success(`${actionName}成功`)
        handleSearch() // 刷新列表
      }
    })
  }).catch(() => {
    // 用户取消操作
  })
}

// 在 script setup 中添加
const handleUserActiveChange = (user: User.UserInfo) => {
  const action = user.isActive === 1 ? deactivateUser : activateUser
  const actionName = user.isActive === 1 ? '禁用' : '启用'
  
  ElMessageBox.confirm(`确定要${actionName}该用户吗？`).then(() => {
    action(user.id).then((res) => {
      if(res.code === ResultCode.SUCCESS) {
        ElMessage.success(`${actionName}成功`)
        handleSearch() // 刷新列表
      }
    })
  }).catch(() => {
    // 用户取消操作
  })
}

// 歌单详情相关
const playlistDetailVisible = ref(false)
const selectedPlaylist = ref<Playlist.PlaylistInfo | null>(null)

const openPlaylistDetail = (playlist: Playlist.PlaylistInfo) => {
  selectedPlaylist.value = playlist
  playlistDetailVisible.value = true
}

import { updateUserLevel } from '@/api/admin'

// 添加用户权限修改相关的状态
const userLevelDialogVisible = ref(false)
const userLevelForm = ref({
  userId: 0,
  currentLevel: 0,
  newLevel: 0
})

// 打开用户权限修改弹窗
const openUserLevelDialog = (user: User.UserInfo) => {
  userLevelForm.value = {
    userId: user.id,
    currentLevel: user.level,
    newLevel: user.level
  }
  userLevelDialogVisible.value = true
}

// 提交用户权限修改
const submitUpdateUserLevel = () => {
  if (userLevelForm.value.currentLevel === userLevelForm.value.newLevel) {
    ElMessage.info('权限未发生变化')
    return
  }

  ElMessageBox.confirm('确定要修改该用户的权限吗？').then(() => {
    updateUserLevel(userLevelForm.value.userId, userLevelForm.value.newLevel)
      .then(res => {
        if (res.code === ResultCode.SUCCESS) {
          ElMessage.success('权限修改成功')
          userLevelDialogVisible.value = false
          handleSearch() // 刷新列表
        }
      })
  }).catch(() => {
    // 用户取消操作
  })
}
</script>

<style scoped>
.admin-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-type {
  width: 120px;
}

.id-input {
  width: 200px;
}

.result-area {
  min-height: 400px;
    max-height: 75vh;
    overflow-y: scroll;
}

.result-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.user-list {
  margin-top: 20px;
}

.list-container {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 删除不需要的样式 */
.result-list,
.song-list,
.user-list {
  margin-top: 20px;
}

.playlist-detail-dialog :deep(.el-dialog__body) {
  padding: 10px 20px;
}

.playlist-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.playlist-detail .infobox {
  display: flex;
  margin-bottom: 20px;
}

.playlist-detail .infobox .mini-cover {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  border: 2px solid #cdc6eb;
  margin: 4px;
}

.playlist-detail .infobox .column {
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 5px;
  margin-left: 20px;
  width: 60%;
}

.playlist-detail .infobox .column h3 {
  color: #907676;
  font-size: 18px;
  font-weight: lighter;
  padding: 5px 10px;
  border-radius: 16px;
  max-width: 90%;
}

.playlist-detail .infobox .column span {
  margin-left: 10px;
  color: #ae99a5;
  font-size: 14px;
  padding: 4px 8px;
  background: #f2f2f2;
  border-radius: 15px;
  border: 1px solid #d4c3da;
}

.playlist-detail .infobox .creater {
  position: absolute;
  font-size: 14px;
  right: 20px;
  top: 20px;
  color: #d1c7c7;
}
</style>