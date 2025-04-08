<template>
    <div class="model-wrapper" v-draggable>
        <div :class="['model-container', !devMode?'hiding':'']">
            <!-- 模型显示部分 -->
            <div class="model-content" v-show="isVisible">
                <canvas ref="canvas"></canvas>
            </div>
            
            <div class="drag-handle">
                <el-icon><DCaret /></el-icon>
            </div>

            <div v-if="!isServerRelease&&devMode" class="settings-btn" @click="modelConfig.showPanel = !modelConfig.showPanel">
                <el-icon><Setting /></el-icon>
            </div>

            <div v-if="!isServerRelease&&devMode" class="animation-btn" @click="showAnimationControl = !showAnimationControl">
                <el-icon><VideoPlay /></el-icon>
            </div>

            <div class="hide-btn" @click="toggleVisible">
                <el-icon><Hide v-if="isVisible"/><View v-else/></el-icon>
            </div>
        </div>
    </div>

    <ModelConfigPanel 
        v-model:model-config="modelConfig"
        @update-camera="updateCamera"
        @update-lights="updateLights"
        @update-rotation="updateRotation"
    />
    <ModelAnimationControl
        v-model:visible="showAnimationControl"
        :action-frames="actionFrames"
        :current-animation="currentAnimationName"
        :current-frame="currentFrame"
        :absolute-frame="absoluteFrame"
        :animation-time="animationTime"
        @play-animation="playAnimation"
        @seek-animation="seekAnimation"
        @set-animation-frame="setAnimationFrame"
        @set-absolute-frame="setAbsoluteFrame"
        @update-transition="updateTransitionDuration"
        @update-speed="updatePlaybackSpeed"
    />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Hide, View, Setting, DCaret, VideoPlay } from '@element-plus/icons-vue'
import { createDraggable } from '@/util/commonUtil'
import ModelConfigPanel from './ModelConfigPanel.vue'
import ModelAnimationControl from './ModelAnimationControl.vue'
import { isServerRelease } from '@/util/webConst'

const props = defineProps<{
  currentTab: string
}>()

const devMode = ref(false)

const canvas = ref<HTMLCanvasElement | null>(null)
const isVisible = ref(true)
const showAnimationControl = ref(false)
const currentAnimationName = ref<string | null>(null)
const currentFrame = ref(0)
const animationTime = ref(0)
const absoluteFrame = ref(0) // 添加绝对帧计数
let transitionDuration = 0.5 // 动画过渡时间（秒）
let playbackSpeed = 1.0 // 播放速度

let mixer: THREE.AnimationMixer
let model: THREE.Group
let animations: THREE.AnimationClip[] = []
let currentAnimation: THREE.AnimationAction | null = null
let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let cameraContainer: THREE.Object3D
let ambientLight: THREE.AmbientLight
let directionalLight: THREE.DirectionalLight
// 配置
const defaultConfig = {
  "camera": {
    "position": {
      "x": 6.1,
      "y": -0.2
    },
    "distance": 16.6
  },
  "model": {
    "rotation": {
      "x": 0.48,
      "y": 0.82,
      "z": -0.24
    }
  },
  "lights": {
    "ambient": 2.7,
    "directional": 0.8,
    "position": {
      "x": 1.6,
      "y": -0.6,
      "z": -0.1
    }
  }
}

const modelConfig = ref({
  showPanel: false,
  camera: {
    position: defaultConfig.camera.position,
    distance: defaultConfig.camera.distance
  },
  lights: defaultConfig.lights,
  model: null as THREE.Group | null
})

// 画布尺寸
const canvasX = 800
const canvasY = 800

// 动作配置 - 只包含过渡动画的帧范围
const actionFrames = {

  'pray': { start: 80, end: 135 },      // 双手合十到休闲站立
  'casual': { start: 135, end: 201 },     // 休闲站立到可爱站立
  'cute': { start: 201, end: 250 }         // 休闲站立到可爱站立
}

// 动作序列
const actionSequence = [ 'pray', 'casual', 'cute'];
let currentActionIndex = 0; // 从第一个动作开始
let isPlayingReverse = false; // 是否反向播放

// 加载配置方法
const loadConfig = (config: typeof defaultConfig & { model?: { rotation: { x: number, y: number, z: number } } }) => {
  // 更新 modelConfig
  modelConfig.value = {
    ...modelConfig.value,
    camera: {
      position: config.camera.position,
      distance: config.camera.distance
    },
    lights: config.lights
  }
  
  // 如果场景已经初始化，立即应用配置
  if (camera && cameraContainer) {
    // 更新相机容器位置（实现平移）
    cameraContainer.position.x = config.camera.position.x
    cameraContainer.position.y = config.camera.position.y
    
    // 更新相机距离
    camera.position.z = config.camera.distance
  }

  if (ambientLight && directionalLight) {
    ambientLight.intensity = config.lights.ambient
    directionalLight.intensity = config.lights.directional
    directionalLight.position.set(
      config.lights.position.x,
      config.lights.position.y,
      config.lights.position.z
    )
  }

  // 应用模型旋转
  if (model && config.model?.rotation) {
    model.rotation.set(
      config.model.rotation.x,
      config.model.rotation.y,
      config.model.rotation.z
    )
  }
}

// 切换模型显示/隐藏
const toggleVisible = () => {
  isVisible.value = !isVisible.value
}

// 初始化场景
const init = async () => {
  if (!canvas.value) return

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)

  // 创建相机容器
  cameraContainer = new THREE.Object3D()
  scene.add(cameraContainer)
  cameraContainer.add(camera)

  // 初始化相机基本位置
  camera.position.set(0, 0, defaultConfig.camera.distance)
  camera.lookAt(0, 0, 0)

  // 加载配置
  loadConfig(defaultConfig)

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true, // 启用抗锯齿
    precision: 'highp', // 使用高精度
    powerPreference: 'high-performance' // 优先使用高性能模式
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasX, canvasY)

  // 光照初始化
  ambientLight = new THREE.AmbientLight(0xffffff, modelConfig.value.lights.ambient)
  directionalLight = new THREE.DirectionalLight(0xffffff, modelConfig.value.lights.directional)
  directionalLight.position.set(
    modelConfig.value.lights.position.x,
    modelConfig.value.lights.position.y,
    modelConfig.value.lights.position.z
  )
  scene.add(ambientLight, directionalLight)

  // 加载模型
  const loader = new GLTFLoader()
    try {
    const gltf = await loader.loadAsync('/model/二次元卡通动漫风格青春和服少女_glb.glb')
    model = gltf.scene
    modelConfig.value.model = model
    
    // 应用初始旋转
    if (defaultConfig.model?.rotation) {
        model.rotation.set(
        defaultConfig.model.rotation.x,
        defaultConfig.model.rotation.y,
        defaultConfig.model.rotation.z
        )
    }
    
    animations = gltf.animations
    mixer = new THREE.AnimationMixer(model)
    scene.add(model)
    
    // 初始化动画 - 修改为直接设置为第一个动作的结束帧，并准备好播放第二个动作
    jumpToActionEnd(actionSequence[0])
    // 设置当前动作索引为0，这样第一次切换标签页时会播放第二个动作
    currentActionIndex = 0
    isPlayingReverse = false
    } catch (error) {
    console.error('模型加载失败:', error)
    }

  // 动画循环
  animate()
}

// 动画循环
const animate = () => {
  requestAnimationFrame(animate)
  if (mixer) {
    const deltaTime = 0.016 * playbackSpeed
    mixer.update(deltaTime)
    
    if(currentAnimation && currentAnimationName.value) {
      // 更新当前帧和时间信息
      animationTime.value = currentAnimation.time
      const fps = 30
      currentFrame.value = Math.floor(currentAnimation.time * fps)
      
      // 计算绝对帧位置
      const frames = actionFrames[currentAnimationName.value as keyof typeof actionFrames]
      if (frames) {
        absoluteFrame.value = frames.start + currentFrame.value
      }
    }
  }
  renderer.render(scene, camera)
}

// 播放动画
const playAnimation = (animationName: string, reverse = false) => {
  if (!mixer || !animations || animations.length === 0) return
  
  // 获取动作帧范围
  const frames = actionFrames[animationName as keyof typeof actionFrames]
  if (!frames) return
  
  // 获取主动画
  const clip = animations[0] // 假设只有一个动画 Armature
  if (!clip) return
  
  // 停止当前动画（如果有）
  if (currentAnimation) {
    currentAnimation.stop()
  }
  
  // 创建一个新的动画片段，只包含指定的帧范围
  const subClip = THREE.AnimationUtils.subclip(clip, animationName, frames.start, frames.end)
  
  // 创建新的动画动作
  const newAction = mixer.clipAction(subClip)
  
  // 设置动画循环模式和结束行为
  newAction.loop = THREE.LoopOnce // 只播放一次
  newAction.clampWhenFinished = true // 播放结束后保持最后一帧
  
  // 记录当前动画名称
  currentAnimationName.value = animationName
  currentAnimation = newAction
  
  // 设置播放方向
  if (reverse) {
    newAction.timeScale = -1 * playbackSpeed // 反向播放
    newAction.time = subClip.duration // 从结尾开始
  } else {
    newAction.timeScale = playbackSpeed // 正向播放
    newAction.time = 0 // 从开头开始
  }
  
  // 播放动画
  newAction.play()
  
  // 更新混合器，使动画立即生效
  mixer.update(0)
}

// 直接跳到指定动作的结束帧
const jumpToActionEnd = (animationName: string) => {
  const frames = actionFrames[animationName as keyof typeof actionFrames]
  if (!frames || !animations || animations.length === 0) return
  
  const clip = animations[0]
  if (!clip) return
  
  const subClip = THREE.AnimationUtils.subclip(clip, animationName, frames.start, frames.end)
  const action = mixer.clipAction(subClip)
  
  // 停止当前动画（如果有）
  if (currentAnimation) {
    currentAnimation.stop()
  }
  
  // 设置新动画
  action.loop = THREE.LoopOnce
  action.clampWhenFinished = true
  currentAnimation = action
  currentAnimationName.value = animationName
  
  // 直接设置到结束帧
  action.time = subClip.duration
  action.play()
  mixer.update(0)
}

// 播放下一个动作
const playNextAction = () => {
  if (isPlayingReverse) {
    // 反向播放时，先更新索引再播放
    currentActionIndex--;
    if (currentActionIndex < 0) {
      // 到达序列开头，改为正向播放
      currentActionIndex = 0;
      isPlayingReverse = false;
    }
  } else {
    // 正向播放时，先更新索引再播放
    currentActionIndex++;
    if (currentActionIndex >= actionSequence.length) {
      // 到达序列末尾，改为反向播放
      currentActionIndex = actionSequence.length - 1;
      isPlayingReverse = true;
    }
  }
  
  // 确定当前要播放的动作
  const currentAction = actionSequence[currentActionIndex];
  
  // 根据播放方向决定是正向还是反向播放
  playAnimation(currentAction, isPlayingReverse);
}

// 跳转到动画的特定进度
const seekAnimation = (progress: number) => {
  if (!currentAnimation || !currentAnimationName.value) return
  
  const frames = actionFrames[currentAnimationName.value as keyof typeof actionFrames]
  if (!frames) return
  
  const fps = 30
  const startTime = frames.start / fps
  const endTime = frames.end / fps
  const duration = endTime - startTime
  
  // 计算目标时间
  const targetTime = startTime + (duration * (progress / 100))
  
  // 设置动画时间
  currentAnimation.time = targetTime
  
  // 更新混合器，使动画立即生效
  mixer.update(0)
}

// 更新动画过渡时间
const updateTransitionDuration = (duration: number) => {
  transitionDuration = duration
}

// 更新播放速度
const updatePlaybackSpeed = (speed: number) => {
  playbackSpeed = speed
  
  if (currentAnimation) {
    currentAnimation.timeScale = isPlayingReverse ? -speed : speed
  }
}

const setAnimationFrame = (frame: number) => {
  if (!currentAnimation || !currentAnimationName.value) return
  
  const frames = actionFrames[currentAnimationName.value as keyof typeof actionFrames]
  if (!frames) return
  
  const fps = 30
  const totalFrames = frames.end - frames.start
  
  // 确保帧数在有效范围内
  const clampedFrame = Math.max(0, Math.min(frame, totalFrames))
  
  // 计算目标时间
  const targetTime = clampedFrame / fps
  
  // 设置动画时间
  currentAnimation.time = targetTime
  
  // 更新混合器，使动画立即生效
  mixer.update(0)
}

// 设置绝对帧位置
const setAbsoluteFrame = (absoluteFrameValue: number) => {
  if (!currentAnimation || !currentAnimationName.value) return
  
  const frames = actionFrames[currentAnimationName.value as keyof typeof actionFrames]
  if (!frames) return
  
  // 确保帧数在有效范围内
  const clampedAbsoluteFrame = Math.max(frames.start, Math.min(absoluteFrameValue, frames.end))
  
  // 计算相对帧
  const relativeFrame = clampedAbsoluteFrame - frames.start
  
  // 计算目标时间
  const fps = 30
  const targetTime = relativeFrame / fps
  
  // 设置动画时间
  currentAnimation.time = targetTime
  
  // 更新混合器，使动画立即生效
  mixer.update(0)
}

// 调整相机
const updateCamera = () => {
  if (!camera || !camera.parent) return
  
  // 更新相机容器的位置（实现平移）
  camera.parent.position.x = modelConfig.value.camera.position.x
  camera.parent.position.y = modelConfig.value.camera.position.y
  
  // 更新相机距离
  camera.position.z = modelConfig.value.camera.distance
}

// 更新光照
const updateLights = () => {
  if (ambientLight && directionalLight) {
    ambientLight.intensity = modelConfig.value.lights.ambient
    directionalLight.intensity = modelConfig.value.lights.directional
    directionalLight.position.set(
      modelConfig.value.lights.position.x,
      modelConfig.value.lights.position.y,
      modelConfig.value.lights.position.z
    )
  }
}

// 更新模型旋转
const updateRotation = (deltaX: number, deltaY: number) => {
  // 这个函数可以为空，因为旋转已经在ModelConfigPanel中处理
}

// 监听标签页变化
watch(() => props.currentTab, (newTab, oldTab) => {
  if (newTab !== oldTab) {
    // 每次切换标签页时，播放下一个动作
    playNextAction()
  }
})

onMounted(() => {
  init()
})

// 拖动支持
const vDraggable = createDraggable({
  handleClass: 'drag-handle',
  boundaryPadding: 10
})
</script>

<style scoped>
.model-wrapper {
  position: fixed;
  left: 1px;
  bottom: 58px;
  z-index: 1000;
}

.model-container {
  position: relative;
  width: 250px;
  height: 40px;
  border: 2px solid #d8d8d8;
  box-shadow: 0px -6px 1px 0px rgb(63 6 50 / 49%) inset;
  padding-bottom: 5px;
  background: #35373b;
  border-radius: 20px;
  font-weight: bold;
}
.model-container.hiding {
    width: 100px;
    height: 37px;
}

.model-content {
  pointer-events: none;
  bottom: 400px;
  position: relative;
  width: 250px;
  height: 400px;
  /* background: #00000035; */
}

canvas {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.drag-handle {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  pointer-events: all;
  backdrop-filter: blur(4px);
  transition: all 0.3s;
  cursor: move;
    width: 20px;
    height: 20px;
    /* left: 8px; */
    /* bottom: 8px; */
    background: #c95b82;
    border-radius: 1.6vh;
    border: 0.2vh solid #7f567b;
    box-shadow: 0px -0.2vh 0.2vh 0px rgb(38 4 4 / 47%) inset;
    color: #e3d0ff;
}

.drag-handle:hover {
  background: rgba(255, 255, 255, 0.4);
}

.hide-btn, .settings-btn, .animation-btn {
  position: absolute;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: all;
  backdrop-filter: blur(4px);
  transition: all 0.3s;
}

.hide-btn {
    width: 25px;
    height: 25px;
    left: 8px;
    bottom: 8px;
    background: #c95b82;
    border-radius: 1.6vh;
    border: 0.2vh solid #7f567b;
    box-shadow: 0px -0.2vh 0.2vh 0px rgb(38 4 4 / 47%) inset;
    color: #e3d0ff;
}

.settings-btn {
  left: 48px;
  bottom: 8px;
}

.animation-btn {
  left: 88px;
  bottom: 8px;
}

.hide-btn:hover, .settings-btn:hover, .animation-btn:hover {
  background: #853c43;
  background: #c95b82;
}
</style>