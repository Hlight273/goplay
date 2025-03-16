<template>
    <div class="search-container">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>搜索："{{ keyword }}"</el-breadcrumb-item>
      </el-breadcrumb>
  
      <div v-loading="loading" class="result-list">
        <div v-for="playlist in searchResults">
          <PlaylistBlock :playlist-info="playlist" :my-userinfo="myUserinfo"/>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
//   import { searchPlaylists } from '@/api/search' // 需创建对应API接口
  import PlaylistBlock from '@/components/playlistBlock.vue'
import { Playlist } from '@/interface/playlist'

import { useCommonStore } from "@/store/commonStore";
import { storeToRefs } from 'pinia';
const commonStore = useCommonStore();
const { myUserinfo, myVipinfo } = storeToRefs(commonStore);
  
  const route = useRoute()
  const keyword = ref('')
  const searchResults = ref<Playlist.PlaylistInfo[]>([])
  const loading = ref(false)
  
  onMounted(async () => {
    keyword.value = route.query.q?.toString() || ''
    if (keyword.value) {
      loading.value = true
      try {
        //const res = await searchPlaylists(keyword.value) //这搜索回调
       // searchResults.value = res.oData
      } finally {
        loading.value = false
      }
    }
  })
  </script>
  
  <style scoped>
  .search-container {
    padding: 3vh;
  }
  
  .result-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 3vh;
    margin-top: 3vh;
  }
  </style>