<template>
  <div class="animation-control-panel" v-show="visible">
    <div class="panel-header">
      <span>动作控制面板</span>
      <el-button type="text" @click="$emit('update:visible', false)">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <div class="animation-buttons">
      <el-button 
        v-for="(frames, name) in actionFrames" 
        :key="name"
        :type="currentAnimation === name ? 'primary' : 'default'"
        @click="playAnimation(name)"
      >
        {{ getActionDisplayName(name) }}
      </el-button>
    </div>
    <div class="animation-info" v-if="currentAnimation">
      <p>当前动作: {{ getActionDisplayName(currentAnimation) }}</p>
      <p>帧数: {{ currentFrame }} / {{ getMaxFrames() }}</p>
      <p>时间: {{ animationTime.toFixed(2) }}s</p>
      <el-slider 
        v-model="animationProgress" 
        :min="0" 
        :max="100" 
        @change="seekAnimation"
      ></el-slider>
    </div>
    <div class="animation-settings">
      <div class="setting-item">
        <span>过渡时间:</span>
        <el-slider 
          v-model="transitionDuration" 
          :min="0" 
          :max="2" 
          :step="0.1"
          :format-tooltip="(value: any) => `${value}s`"
        ></el-slider>
      </div>
      <div class="setting-item">
        <span>播放速度:</span>
        <el-slider 
          v-model="playbackSpeed" 
          :min="0.1" 
          :max="2" 
          :step="0.1"
          :format-tooltip="(value: any) => `${value}x`"
          @change="updatePlaybackSpeed"
        ></el-slider>
      </div>
      <div class="control-item">
        <span>绝对帧位置: {{ absoluteFrame }} / 250</span>
        <el-slider 
          v-model="absoluteFrameValue" 
          @change="updateAbsoluteFrame" 
          :min="0" 
          :max="250" 
          :step="1"
          :show-tooltip="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';

const props = defineProps<{
  actionFrames: Record<string, { start: number, end: number }>,
  currentAnimation: string | null,
  currentFrame: number,
  animationTime: number,
  visible: boolean,
  absoluteFrame: Number
}>();

const emit = defineEmits<{
  (e: 'play-animation', name: string): void,
  (e: 'seek-animation', progress: number): void,
  (e: 'update:visible', visible: boolean): void,
  (e: 'update-transition', duration: number): void,
  (e: 'update-speed', speed: number): void,
  (e: 'set-absolute-frame', progress: number): void
}>();

const absoluteFrameValue = ref(props.absoluteFrame || 0)
// 动画过渡时间（秒）
const transitionDuration = ref(0.5);
// 播放速度
const playbackSpeed = ref(1.0);
// 动画进度（百分比）
const animationProgress = computed(() => {
  if (!props.currentAnimation) return 0;
  
  const frames = props.actionFrames[props.currentAnimation];
  if (!frames) return 0;
  
  const totalFrames = frames.end - frames.start;
  const currentLocalFrame = props.currentFrame;
  
  return Math.min(100, Math.max(0, (currentLocalFrame / totalFrames) * 100));
});

// 获取动作的显示名称
const getActionDisplayName = (name: string) => {
  const displayNames: Record<string, string> = {
    'idle': '待机',
    'forehead': '扶额头',
    'pray': '双手合十',
    'casual': '休闲站立',
    'cute': '可爱站立'
  };
  
  return displayNames[name] || name;
};

// 获取当前动作的最大帧数
const getMaxFrames = () => {
  if (!props.currentAnimation) return 0;
  
  const frames = props.actionFrames[props.currentAnimation];
  if (!frames) return 0;
  
  return frames.end - frames.start;
};

// 播放动画
const playAnimation = (name: string) => {
  emit('play-animation', name);
};

// 跳转到动画的特定进度
const seekAnimation = (progress: number) => {
  emit('seek-animation', progress);
};

// 监听过渡时间变化
watch(transitionDuration, (newDuration) => {
  emit('update-transition', newDuration);
});
// 监听绝对帧变化
watch(() => props.absoluteFrame, (newFrame) => {
  absoluteFrameValue.value = newFrame
})
// 更新绝对帧
const updateAbsoluteFrame = (value: number) => {
  emit('set-absolute-frame', value)
}

// 更新播放速度
const updatePlaybackSpeed = (speed: number) => {
  emit('update-speed', speed);
};
</script>

<style scoped>
.animation-control-panel {
  position: fixed;
  right: 20px;
  top: 80px;
  width: 300px;
  background: rgba(53, 55, 59, 0.9);
  border-radius: 8px;
  padding: 15px;
  color: white;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
}

.animation-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.animation-info {
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.animation-settings {
  margin-top: 15px;
}

.setting-item {
  margin-bottom: 10px;
}

.setting-item span {
  display: block;
  margin-bottom: 5px;
}

.animation-control {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 2000;
  padding: 16px;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.control-header h3 {
  margin: 0;
}

.control-content {
  max-height: 400px;
  overflow-y: auto;
}

.control-item {
  margin-bottom: 16px;
}

.animation-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

</style>