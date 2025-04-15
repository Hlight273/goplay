<template>
    <div class="fancy-loader-container">
      <div class="fancy-loader">
      
        <!-- 中间的立方体动画 -->
        <div class="cube-container">
            <div class="cube">
            <div class="cube-face front"></div>
            <div class="cube-face back"></div>
            <div class="cube-face right"></div>
            <div class="cube-face left"></div>
            <div class="cube-face top"></div>
            <div class="cube-face bottom"></div>
            </div>
        </div>
        <!-- 右下角的加载指示器 -->
        <div class="loading-indicator">
          <div class="spinner">
            <div class="spinner-ring"></div>
          </div>
          <div class="loading-text">
            <span class="loading-label">{{ text }}</span>
            <span class="percentage">{{ percentage }}%</span>
            <span class="dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  percentage: {
    type: Number,
    default: 0
  },
  text: {
    type: String,
    default: '加载中'
  }
});
</script>
  
  <style scoped>
  /* 保持原有的容器样式 */
  .fancy-loader-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
  
  .fancy-loader {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    padding: 65px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
    animation: fadeIn 0.5s ease-out;
    overflow: hidden;
  }
  
  
  .music-notes {
    position: absolute;
    top: -20px;
    right: -20px;
  }
  
  .music-notes span {
    position: absolute;
    color: var(--el-color-primary);
    font-size: 24px;
    animation: float 2s infinite;
  }
  
  .music-notes span:nth-child(1) {
    animation-delay: 0s;
  }
  
  .music-notes span:nth-child(2) {
    animation-delay: 0.5s;
    left: 20px;
  }
  
  .music-notes span:nth-child(3) {
    animation-delay: 1s;
    left: 40px;
  }
  
  /* 右下角加载指示器样式 */
  .loading-indicator {
    position: absolute;
    bottom: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    position: relative;
  }
  
  .percentage {
    font-weight: bold;
  }
  
  .dots {
    display: flex;
    gap: 2px;
  }
  
  .spinner-ring {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(var(--el-color-primary-rgb), 0.2);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: 
    spin 1s linear infinite,
    colorShift 3s ease-in-out infinite;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-primary);
  font-size: 14px;
  animation: colorShift 3s ease-in-out infinite;
}

.dot {
  width: 4px;
  height: 4px;
  background: var(--el-color-primary);
  border-radius: 50%;
  animation: 
    dotFade 1.4s infinite,
    colorShift 3s ease-in-out infinite;
}
  
  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }
  
  /* 动画定义 */
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes blink {
    0%, 45%, 55%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.1); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0); opacity: 0; }
    25% { opacity: 1; }
    50% { transform: translateY(-20px) rotate(10deg); opacity: 0; }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes dotFade {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* 响应式调整 */
  @media screen and (max-width: 768px) {
    .cat-container {
      width: 150px;
      height: 150px;
    }
    
    .loading-indicator {
      bottom: 15px;
      right: 15px;
    }
    
    .loading-text {
      font-size: 12px;
    }
  }

  .cube-container {
  perspective: 1000px;
  width: 60px;
  height: 60px;
  animation: bounce 1.5s ease-in-out infinite;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: rotate 3s linear infinite;
}

.cube-face {
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--el-color-primary);
  animation: colorShift 3s ease-in-out infinite;
}

.front  { 
  transform: rotateY(0deg) translateZ(30px); 
  opacity: 0.9;
  animation: colorShift 3s ease-in-out infinite;
}

.back   { 
  transform: rotateY(180deg) translateZ(30px);
  opacity: 0.7;
  filter: brightness(0.85);
  animation: colorShift 3s ease-in-out infinite 0.5s;
}

.right  { 
  transform: rotateY(90deg) translateZ(30px);
  opacity: 0.8;
  filter: brightness(0.9);
  animation: colorShift 3s ease-in-out infinite 1s;
}

.left   { 
  transform: rotateY(-90deg) translateZ(30px);
  opacity: 0.8;
  filter: brightness(0.95);
  animation: colorShift 3s ease-in-out infinite 1.5s;
}

.top    { 
  transform: rotateX(90deg) translateZ(30px);
  opacity: 0.85;
  filter: brightness(1.05);
  animation: colorShift 3s ease-in-out infinite 2s;
}

.bottom { 
  transform: rotateX(-90deg) translateZ(30px);
  opacity: 0.75;
  filter: brightness(0.8);
  animation: colorShift 3s ease-in-out infinite 2.5s;
}

@keyframes rotate {
  0% { transform: rotateX(0deg) rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes colorShift {
  0% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(30deg); }
  100% { filter: hue-rotate(0deg); }
}
  </style>