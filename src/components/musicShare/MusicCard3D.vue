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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { VideoPlay, Plus, RefreshRight } from '@element-plus/icons-vue';
import { Share } from '@/interface/share';
import { Song } from '@/interface/song';
import { MusicCardRenderer } from '@/plugins/musicCardRenderPlugin';

const props = defineProps<{
  share: Share.MusicShareMessage,
  songDetails: Song.SongContent,
  active: boolean
}>();

defineEmits(['play', 'add-to-playlist']);

const cardContainer = ref<HTMLElement | null>(null);
const cardCanvas = ref<HTMLCanvasElement | null>(null);
let renderer: MusicCardRenderer;
let isFlipped = ref(false);
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };

// 翻转卡片
const flipCard = () => {
  isFlipped.value = !isFlipped.value;
  const targetY = isFlipped.value ? Math.PI : 0;
  
  let startRotationY = renderer.card.rotation.y;
  let startTime = Date.now();
  let duration = 800;
  
  function animateFlip() {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);
    progress = easeOutQuart(progress);
    
    renderer.card.rotation.y = startRotationY + (targetY - startRotationY) * progress;
    
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
  
  renderer = new MusicCardRenderer(cardCanvas.value, width, height);
  await renderer.createCard(props.songDetails, props.share);

  renderer.setFrontLight({
    intensity: 0.2,          // 调整光照强度
    color: 0xffffff,         // 调整光照颜色
    position: {              // 调整光源位置
      x: 0,
      y: 0,
      z: 1
    }
  });
  
  cardCanvas.value.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  cardCanvas.value.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchmove', onTouchMove);
  window.addEventListener('touchend', onTouchEnd);
  
  animate();
  
  renderer.card.rotation.x = -0.5;
  renderer.card.position.y = -100;
  renderer.card.scale.set(0.8, 0.8, 0.8);
  
  let startTime = Date.now();
  let duration = 1000;
  
  function animateEntry() {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / duration, 1);
    progress = easeOutQuart(progress);
    
    renderer.card.rotation.x = -0.5 + 0.5 * progress;
    renderer.card.position.y = -100 + 100 * progress;
    renderer.card.scale.set(
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
  currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
  currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
  
  renderer.card.rotation.x = currentRotation.x;
  
  if (isFlipped.value) {
    renderer.card.rotation.y = Math.PI + currentRotation.y;
  } else {
    renderer.card.rotation.y = currentRotation.y;
  }
  
  renderer.render();
  
  requestAnimationFrame(animate);
};

// 窗口大小调整处理
const handleResize = () => {
  if (!cardContainer.value || !cardCanvas.value || !renderer) return;
  
  const width = cardContainer.value.clientWidth || 350;
  const height = cardContainer.value.clientHeight || 500;
  
  cardCanvas.value.width = width;
  cardCanvas.value.height = height;
  
  renderer.camera.aspect = width / height;
  renderer.camera.updateProjectionMatrix();
  
  renderer.renderer.setSize(width, height, false);
};

onMounted(() => {
  setTimeout(() => {
    initThreeJS();
    handleResize();
    window.addEventListener('resize', handleResize);
  }, 100);
});

onBeforeUnmount(() => {
  if (cardCanvas.value) {
    cardCanvas.value.removeEventListener('mousedown', onMouseDown);
    cardCanvas.value.removeEventListener('touchstart', onTouchStart);
  }
  
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  window.removeEventListener('touchmove', onTouchMove);
  window.removeEventListener('touchend', onTouchEnd);
  window.removeEventListener('resize', handleResize);
  
  if (renderer) {
    renderer.dispose();
  }
});

watch(() => props.active, (newVal) => {
  if (newVal && renderer && renderer.card) {
    targetRotation.y += 0.3;
    setTimeout(() => {
      targetRotation.y -= 0.3;
    }, 300);
  }
});

watch(() => props.songDetails, async () => {
  if (!renderer || !renderer.card) return;
  await renderer.createCard(props.songDetails, props.share);
}, { deep: true });

watch(() => props.share, async () => {
  if (!renderer || !renderer.card) return;
  await renderer.createCard(props.songDetails, props.share);
}, { deep: true });
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
  gap: 20px;
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
    color: #d25454;
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
</style>