<template>
  <span class="vip-lv">
    <svg class="vip-tag" viewBox="0 0 100 30">
      <defs>
        <filter :id="`outer-shadow-${uid}`">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="dilated" /> <!-- 此半径可增大描边宽度 -->
          <feFlood :flood-color="strokeColor" result="flood" />
          <feComposite in2="dilated" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text :class="`level-${level}`" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" :filter="`url(#outer-shadow-${uid})`">
        lv{{ level }}
      </text>
    </svg>
  </span>
    
</template>

<script lang="ts" setup>
import { Color } from 'three';
import { defineProps, computed } from 'vue';

import { getCurrentInstance } from 'vue'
const uid  = getCurrentInstance()?.uid;

// 定义组件的 props
const props = defineProps<{
  level: number;
}>();

// 计算描边颜色
const strokeColor = computed(() => {
  switch (props.level) {
    case 1:
      return '#00c954'; 
    case 2:
      return '#2391ff';
    case 3:
      return '#ea2222';
    default:
      return '#6e6e6e';
  }
});
</script>

<style scoped>
.vip-lv {
  position: relative;
    width: 9vh;
    height: 2.55vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: -2vh;
    font-family: math;
    font-weight: bolder;
}
.vip-tag {
  top: .1vh;
  position: absolute;
}

.level-1 {
    fill: #ffffff; /* 文字填充颜色 */
}

.level-2 {
    fill: #ffffff; /* 文字填充颜色 */
}

.level-3 {
    fill: #ffffff; /* 文字填充颜色 */
}

.level-0 {
    fill: #ffffff; /* 文字填充颜色 */
}
</style>