<template>
    <div class="gradient-border2">
      <h1 class="title">RGB Gradient Border</h1>
    </div>
  </template>
  
  <script setup>

  </script>
  
  <style scoped>
  .gradient-border2 {
    padding: 20px;
    background-color: white; /* 内部背景色，可以根据需要调整 */
    border-radius: 8px;
    position: relative;
    overflow: hidden; /* 避免边框溢出 */
    border: 5px solid transparent; /* 设置 border 为透明 */
    position: relative;
    animation: borderAnimation 3s linear infinite; /* 动画效果 */
  }
  
  .title {
    text-align: center;
    position: relative; /* 相对定位，确保文字在最上层 */
    z-index: 1; /* 确保文本在渐变边框上方 */
  }
  
  /* 定义边框颜色变换的动画 */
  @keyframes borderAnimation {
    0% {
        border-color: red;
    }
    14% {
        border-color: yellow;
    }
    28% {
        border-color: green;
    }
    42% {
        border-color: cyan;
    }
    57% {
        border-color: blue;
    }
    71% {
        border-color: magenta;
    }
    85% {
        border-color: red;
    }
    100% {
        border-color: red; /* 重复开始颜色 */
    }
  }
  </style>