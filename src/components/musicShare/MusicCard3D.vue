<template>
  <div class="music-card-3d-container">
    <div class="music-card-3d" ref="cardContainer">
      <canvas ref="cardCanvas" class="card-canvas"></canvas>
      <div class="card-controls">
        <button class="custom-button" @click.stop="$emit('play')">
          <VideoPlay />
        </button>
        <button class="custom-button" @click.stop="$emit('add-to-playlist')">
          <Plus />
        </button>
        <button class="custom-button" @click.stop="flipCard">
          <RefreshRight />
        </button>
        <button class="custom-button delete-button" @click.stop="showRemoveConfirm = true">
          <Delete />
        </button>
      </div>
    </div>
  </div>
  
  <!-- 自定义确认对话框 -->
  <div class="confirm-dialog" v-if="showRemoveConfirm">
    <div class="confirm-dialog-content">
      <p>确定要移除这个分享吗？</p>
      <div class="confirm-dialog-buttons">
        <button @click="removeShareItem" class="confirm-btn confirm-yes">确定</button>
        <button @click="showRemoveConfirm = false" class="confirm-btn confirm-no">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { VideoPlay, Plus, RefreshRight, Delete } from '@element-plus/icons-vue';
import { Share } from '@/interface/share';
import { Song } from '@/interface/song';
import { MusicCardRenderer } from '@/plugins/musicCardRenderPlugin';


const props = defineProps<{
  share: Share.MusicShareMessage,
  songDetails: Song.SongContent,
  active: boolean
}>();

const emit = defineEmits(['play', 'add-to-playlist', 'handle-share']);

const cardContainer = ref<HTMLElement | null>(null);
const cardCanvas = ref<HTMLCanvasElement | null>(null);
let renderer: MusicCardRenderer;
let isFlipped = ref(false);
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };
let animationFrameId: number;
const showRemoveConfirm = ref(false);

const removeShareItem = () => {
  emit('handle-share', props.share, false);
  showRemoveConfirm.value = false;
};

// 翻转卡片
const flipCard = () => {
  isFlipped.value = !isFlipped.value;
  const targetY = isFlipped.value ? Math.PI : 0;
  
  let startRotationY = renderer.getCardRotationY();
  let startTime = Date.now();
  let duration = 800;
  
  function animateFlip() {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);
    progress = easeOutQuart(progress);
    
    renderer.setCardRotationY(startRotationY + (targetY - startRotationY) * progress);
    
    if (progress < 1) {
      requestAnimationFrame(animateFlip);
    }
  }
  
  animateFlip();
};

// 缓动函数
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

// 初始化Three.js场景
const initThreeJS = async () => {
  if (!cardCanvas.value || !cardContainer.value) return;
  
  const width = cardContainer.value.clientWidth || 350;
  const height = cardContainer.value.clientHeight || 500;
  
  // 创建渲染器实例
  renderer = new MusicCardRenderer(cardCanvas.value, width, height);
  
  // 创建卡片
  await renderer.createCard(props.songDetails, props.share);

  // 设置前光源
  renderer.setFrontLight({
    intensity: 0.3,          // 调整光照强度
    color: 0xffffff,         // 调整光照颜色
    position: {              // 调整光源位置
      x: 0,
      y: 0.2,
      z: 1.2
    }
  });
  
  // 添加交互事件监听
  cardCanvas.value.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  cardCanvas.value.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchmove', onTouchMove);
  window.addEventListener('touchend', onTouchEnd);
  
  // 开始动画循环
  animate();
  
  // 设置初始位置和动画入场
  renderer.setCardRotationX(-0.5);
  renderer.setCardPositionY(-100);
  renderer.setCardScale(0.8, 0.8, 0.8);
  
  let startTime = Date.now();
  let duration = 1000;
  
  function animateEntry() {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);
    progress = easeOutQuart(progress);
    
    renderer.setCardRotationX(-0.5 + 0.5 * progress);
    renderer.setCardPositionY(-100 + 100 * progress);
    renderer.setCardScale(
      0.8 + 0.2 * progress,
      0.8 + 0.2 * progress,
      0.8 + 0.2 * progress
    );
    
    if (progress < 1) {
      requestAnimationFrame(animateEntry);
    }
  }
  
  animateEntry();
};

// 鼠标事件处理
const onMouseDown = (event: MouseEvent) => {
  isDragging = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  };
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging) return;
  
  const deltaMove = {
    x: event.clientX - previousMousePosition.x,
    y: event.clientY - previousMousePosition.y
  };
  
  if (isFlipped.value) {
    deltaMove.x = -deltaMove.x;
  }
  
  targetRotation.y += deltaMove.x * 0.01;
  targetRotation.x += deltaMove.y * 0.01;
  
  // 限制垂直旋转范围
  targetRotation.x = Math.max(-0.5, Math.min(0.5, targetRotation.x));
  
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  };
};

const onMouseUp = () => {
  isDragging = false;
};

// 触摸事件处理
const onTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    isDragging = true;
    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
};

const onTouchMove = (event: TouchEvent) => {
  if (!isDragging || event.touches.length !== 1) return;
  
  const deltaMove = {
    x: event.touches[0].clientX - previousMousePosition.x,
    y: event.touches[0].clientY - previousMousePosition.y
  };
  
  if (isFlipped.value) {
    deltaMove.x = -deltaMove.x;
  }
  
  targetRotation.y += deltaMove.x * 0.01;
  targetRotation.x += deltaMove.y * 0.01;
  
  // 限制垂直旋转范围
  targetRotation.x = Math.max(-0.5, Math.min(0.5, targetRotation.x));
  
  previousMousePosition = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
};

const onTouchEnd = () => {
  isDragging = false;
};

// 动画循环
const animate = () => {
  // 平滑过渡当前旋转到目标旋转
  currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
  currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
  
  // 应用旋转
  renderer.setCardRotationX(currentRotation.x);
  
  if (isFlipped.value) {
    renderer.setCardRotationY(Math.PI + currentRotation.y);
  } else {
    renderer.setCardRotationY(currentRotation.y);
  }
  
  // 渲染场景
  renderer.render();
  
  // 继续动画循环
  animationFrameId = requestAnimationFrame(animate);
};

// 窗口大小调整处理
const handleResize = () => {
  if (!cardContainer.value || !cardCanvas.value || !renderer) return;
  
  const width = cardContainer.value.clientWidth || 350;
  const height = cardContainer.value.clientHeight || 500;
  
  // 使用重构后的resize方法
  renderer.resize(width, height);
};

onMounted(() => {
  // 延迟初始化，确保DOM已完全加载
  setTimeout(() => {
    initThreeJS();
    handleResize();
    window.addEventListener('resize', handleResize);
  }, 100);
});

onBeforeUnmount(() => {
  // 清理事件监听器
  if (cardCanvas.value) {
    cardCanvas.value.removeEventListener('mousedown', onMouseDown);
    cardCanvas.value.removeEventListener('touchstart', onTouchStart);
  }
  
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
  window.removeEventListener('resize', handleResize);
  
  // 取消动画帧
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // 释放渲染器资源
  if (renderer) {
    renderer.dispose();
  }
});

// 监听活动状态变化
watch(() => props.active, (newVal) => {
  if (newVal && renderer) {
    // 当卡片变为活动状态时，添加一个小的旋转动画
    targetRotation.y += 0.3;
    setTimeout(() => {
      targetRotation.y -= 0.3;
    }, 300);
  }
});

// 监听歌曲详情变化
watch(() => props.songDetails, async () => {
  if (!renderer) return;
  await renderer.createCard(props.songDetails, props.share);
}, { deep: true });

// 监听分享信息变化
watch(() => props.share, async () => {
  if (!renderer) return;
  await renderer.createCard(props.songDetails, props.share);
}, { deep: true });

// 暴露给父组件的旋转方法
const spinCard = async () => {
  if (renderer) {
    await renderer.spinCard(800); // 800ms 完成旋转
  }
};

// 暴露方法给父组件
defineExpose({
  spinCard
});
</script>


<style scoped>
.music-card-3d-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  margin-top: -100px;
}

.music-card-3d {
  width: 350px;
  height: 500px;
  position: relative;
  user-select: none;
  display: block;
  overflow: visible;
}

.card-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}

.card-controls {
  position: absolute;
  bottom: -60px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  z-index: 10;
}

.card-controls :deep(.el-button) {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.card-controls :deep(.el-button:hover) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.card-controls :deep(.el-button:active) {
  transform: translateY(1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.custom-button {
  background-color: #4d4b51;
    color: #717171;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    padding: 5px;
    display: flex
;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 3px solid #252425;
    box-shadow: 0px -5px 4px 4px rgb(16 15 18 / 57%) inset;
}

.custom-button:hover {
  transform: translateY(-2px);
  border: 3px solid #d25454;
}

.custom-button:active {
  transform: translateY(1px);
  border: 3px solid #d25454;
  }

.delete-button {
  color: #8a5959;
}

.delete-button:hover {
  border: 3px solid #ff3a3a;
}

/* 自定义确认对话框样式 */
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.confirm-dialog-content {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid #3a3a3a;
}

.confirm-dialog-content p {
  margin-bottom: 20px;
  color: #e0e0e0;
  text-align: center;
  font-size: 16px;
}

.confirm-dialog-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.confirm-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.confirm-yes {
  background-color: #d25454;
  color: white;
}

.confirm-yes:hover {
  background-color: #e63e3e;
}

.confirm-no {
  background-color: #4d4b51;
  color: #e0e0e0;
}

.confirm-no:hover {
  background-color: #5d5b61;
}
</style>