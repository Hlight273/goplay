<template>
    <div class="model-wrapper" v-draggable>
        <div :class="['model-container', !devMode ? 'hiding' : '']">
            <!-- 模型显示部分 -->
            <div class="model-content" v-show="isVisible">
                <canvas ref="canvas"></canvas>
            </div>

             <!-- 讲解气泡 -->
             <div class="speech-bubble" v-show="showSpeechBubble && isVisible" :class="{ 'fade-out': isFadingOut }">
                {{ currentPageDescription }}
            </div>
            
            <div class="drag-handle">
                <el-icon><DCaret /></el-icon>
            </div>

            <div v-if="!isServerRelease && devMode" class="settings-btn" @click="toggleConfigPanel">
                <el-icon><Setting /></el-icon>
            </div>

            <div v-if="!isServerRelease && devMode" class="animation-btn" @click="toggleAnimationControl">
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
import { ref, onMounted, watch, onBeforeUnmount,  computed } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Hide, View, Setting, DCaret, VideoPlay } from '@element-plus/icons-vue'
import { createDraggable } from '@/util/commonUtil'
import ModelConfigPanel from './ModelConfigPanel.vue'
import ModelAnimationControl from './ModelAnimationControl.vue'
import { isServerRelease } from '@/util/webConst'
import { AnimationController, type AnimationConfig } from '@/util/animationUtil'

const props = defineProps<{
  currentTab: string
}>()

// 添加对话框相关状态
const showSpeechBubble = ref(false)
const currentPageDescription = computed(() => {
  const tabDescriptions: Record<string, string> = {
    'recommend': '在主页，你可以发现各种精选音乐和热门歌曲推荐！',
    'room': '加入或创建房间，与朋友一起实时分享音乐！',
    'community': '在音乐村，在这里你可以与其他音乐爱好者交流，分享你的音乐爱好！',
    'playlist': '这是我的歌单页面，你可以管理自己创建的歌单并上传歌曲！',
    'admin': '...不用我多说了吧.',
    'setting': '个人设置，在里面管理账号信息和充值！'
  }
  return tabDescriptions[props.currentTab] || '欢迎使用Let\'s Goplay音乐平台！'
})

// 响应式状态
const devMode = ref(false)
const canvas = ref<HTMLCanvasElement | null>(null)
const isVisible = ref(true)
const showAnimationControl = ref(false)
const currentAnimationName = ref<string | null>(null)
const currentFrame = ref(0)
const animationTime = ref(0)
const absoluteFrame = ref(0)

// Three.js 相关变量
let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let cameraContainer: THREE.Object3D
let ambientLight: THREE.AmbientLight
let directionalLight: THREE.DirectionalLight
let model: THREE.Group
let animationController: AnimationController
let animationFrameId: number | null = null

// 配置
const defaultConfig = {
  "camera": {
    "position": {
      "x": 7.8,
      "y": -0.2
    },
    "distance": 20.9
  },
  "model": {
    "rotation": {
      "x": 0.29,
      "y": 0.93,
      "z": -0.14
    }
  },
  "lights": {
    "ambient": 3.1,
    "directional": 0.6,
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
    position: { ...defaultConfig.camera.position },
    distance: defaultConfig.camera.distance
  },
  lights: { ...defaultConfig.lights },
  model: null as THREE.Group | null
})

// 画布尺寸
const canvasX = 800
const canvasY = 800

// 动作配置 - 只包含过渡动画的帧范围
const actionFrames = {
  'pray': { start: 80, end: 135 },      // 双手合十到休闲站立
  'casual': { start: 135, end: 201 },   // 休闲站立到可爱站立
  'cute': { start: 201, end: 250 }      // 休闲站立到可爱站立
}

// 动作序列
const actionSequence = ['pray', 'casual', 'cute']

// 动画配置
const animationConfig: AnimationConfig = {
  actionFrames,
  actionSequence
}

// 方法
const toggleConfigPanel = () => modelConfig.value.showPanel = !modelConfig.value.showPanel
const toggleAnimationControl = () => showAnimationControl.value = !showAnimationControl.value

// 切换模型显示/隐藏
const toggleVisible = () => isVisible.value = !isVisible.value


// 加载配置方法
const loadConfig = (config: typeof defaultConfig & { model?: { rotation: { x: number, y: number, z: number } } }) => {
  // 更新 modelConfig
  modelConfig.value = {
    ...modelConfig.value,
    camera: {
      position: { ...config.camera.position },
      distance: config.camera.distance
    },
    lights: { ...config.lights }
  }
  
  applyConfig()
}

// 应用配置到场景
const applyConfig = () => {
  // 如果场景已经初始化，立即应用配置
  if (camera && cameraContainer) {
    // 更新相机容器位置（实现平移）
    cameraContainer.position.x = modelConfig.value.camera.position.x
    cameraContainer.position.y = modelConfig.value.camera.position.y
    
    // 更新相机距离
    camera.position.z = modelConfig.value.camera.distance
  }

  if (ambientLight && directionalLight) {
    ambientLight.intensity = modelConfig.value.lights.ambient
    directionalLight.intensity = modelConfig.value.lights.directional
    directionalLight.position.set(
      modelConfig.value.lights.position.x,
      modelConfig.value.lights.position.y,
      modelConfig.value.lights.position.z
    )
  }

  // 应用模型旋转
  if (model && modelConfig.value.model?.rotation) {
    model.rotation.set(
      modelConfig.value.model.rotation.x,
      modelConfig.value.model.rotation.y,
      modelConfig.value.model.rotation.z
    )
  }
}

// 初始化场景
const init = async () => {
  if (!canvas.value) return

  // 初始化场景
  scene = new THREE.Scene()
  
  // 初始化相机
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
  cameraContainer = new THREE.Object3D()
  scene.add(cameraContainer)
  cameraContainer.add(camera)
  camera.position.set(0, 0, defaultConfig.camera.distance)
  camera.lookAt(0, 0, 0)

  // 初始化渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true,
    precision: 'highp',
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasX, canvasY)

  // 初始化光照
  ambientLight = new THREE.AmbientLight(0xffffff, defaultConfig.lights.ambient)
  directionalLight = new THREE.DirectionalLight(0xffffff, defaultConfig.lights.directional)
  directionalLight.position.set(
    defaultConfig.lights.position.x,
    defaultConfig.lights.position.y,
    defaultConfig.lights.position.z
  )
  scene.add(ambientLight, directionalLight)

  // 加载配置
  loadConfig(defaultConfig)

  // 加载模型
  await loadModel()

  // 开始动画循环
  animate()
}

// 加载模型
const loadModel = async () => {
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
    
    // 优化模型材质
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // 启用阴影
        object.castShadow = true
        object.receiveShadow = true
        
        // 如果有材质，提高材质质量
        if (object.material) {
          if (object.material.map) {
            object.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy()
          }
        }
      }
    })
    
    scene.add(model)
    
    // 初始化动画控制器
    animationController = new AnimationController(
      model,
      gltf.animations,
      animationConfig,
      updateAnimationState
    )
    
    return true
  } catch (error) {
    console.error('模型加载失败:', error)
    return false
  }
}

// 更新动画状态的回调函数
const updateAnimationState = (data: {
  currentAnimationName: string | null
  currentFrame: number
  absoluteFrame: number
  animationTime: number
}) => {
  currentAnimationName.value = data.currentAnimationName
  currentFrame.value = data.currentFrame
  absoluteFrame.value = data.absoluteFrame
  animationTime.value = data.animationTime
}

// 动画循环
const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  
  // 更新动画控制器
  if (animationController) {
    animationController.update()
  }
  
  renderer.render(scene, camera)
}

// 动画控制方法
const playAnimation = (animationName: string) =>  animationController?.playAnimation(animationName)

const seekAnimation = (progress: number) => animationController?.seekAnimation(progress)

const setAnimationFrame = (frame: number) =>  animationController?.setAnimationFrame(frame)

const setAbsoluteFrame = (absoluteFrameValue: number) => animationController?.setAbsoluteFrame(absoluteFrameValue)

const updateTransitionDuration = (duration: number) => animationController?.updateTransitionDuration(duration)

const updatePlaybackSpeed = (speed: number) =>  animationController?.updatePlaybackSpeed(speed)


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


const bubbleTimerId = ref<number | null>(null);
const isFadingOut = ref(false);
watch(() => props.currentTab, (newTab, oldTab) => {
    if (newTab !== oldTab) {
    // 每次切换标签页时，播放下一个动作
    animationController?.playNextAction()
    
    // 如果正在淡出，先重置状态
    isFadingOut.value = false
    
    // 显示气泡
    showSpeechBubble.value = true
    
    // 清除之前的计时器
    if (bubbleTimerId.value !== null) {
      clearTimeout(bubbleTimerId.value)
      bubbleTimerId.value = null
    }
    
    // 设置新的计时器
    bubbleTimerId.value = window.setTimeout(() => {
      // 开始淡出动画
      isFadingOut.value = true
      
      // 等待动画完成后隐藏气泡
      setTimeout(() => {
        showSpeechBubble.value = false
        isFadingOut.value = false
        bubbleTimerId.value = null
      }, 300) // 动画持续时间
    }, 3000)
  }
})

// 生命周期钩子
onMounted(() => {
  init()
})

onBeforeUnmount(() => {
  // 清理资源
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }

  // 清除气泡计时器
  if (bubbleTimerId.value !== null) {
    clearTimeout(bubbleTimerId.value)
    bubbleTimerId.value = null
  }
  
  if (renderer) {
    renderer.dispose()
  }
  
  if (scene) {
    // 清理场景中的对象
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })
  }
})

// 拖动支持
const vDraggable = createDraggable({
  handleClass: 'drag-handle',
  boundaryPadding: 10
})
</script>

<style scoped>
/* 基础布局 */
.model-wrapper {
  position: fixed;
  left: 33px;
  bottom: 58px;
  z-index: 1000;
}

.model-container {
  position: relative;
  width: 250px;
  height: 40px;
  border: 2px solid #c09ffc;
  border-radius: 20px;
  background: #35373b;
  box-shadow: 0px -4px 2px 0px rgb(144 82 141 / 49%) inset;
  padding-bottom: 5px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.model-container.hiding {
  width: 77px;
  height: 35px;
}

/* 模型内容区域 */
.model-content {
  position: relative;
  bottom: 400px;
  width: 250px;
  height: 400px;
  pointer-events: none;
}

canvas {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 控制按钮通用样式 */
.drag-handle,
.hide-btn,
.settings-btn,
.animation-btn {
    position: absolute;
    display: flex
;
    align-items: center;
    justify-content: center;
    border-radius: 1.6vh;
    cursor: pointer;
    pointer-events: all;
    transition: all 0.3s;
    background: #c074c4;
    border: 0.2vh solid #5f68c0;
    box-shadow: 0px -0.2vh 0.2vh 0px rgb(37 40 114 / 89%) inset;
    color: #e3d0ff;
}

/* 拖动手柄 */
.drag-handle {
  right: 8px;
  top: 8px;
  width: 20px;
  height: 20px;
  cursor: move;
}

/* 隐藏按钮 */
.hide-btn {
  left: 8px;
  top: 6px;
  width: 25px;
  height: 25px;
}

/* 设置按钮 */
.settings-btn {
  left: 48px;
  bottom: 8px;
  width: 25px;
  height: 25px;
}

/* 动画控制按钮 */
.animation-btn {
  left: 88px;
  bottom: 8px;
  width: 25px;
  height: 25px;
}

/* 悬停效果 */
.drag-handle:hover,
.hide-btn:hover,
.settings-btn:hover,
.animation-btn:hover {
  background: #7d7bb0;
}

.speech-bubble {
  position: absolute;
  top: -285px;
  left: 143px;
  transform: translateX(-50%);
  background-image: url('@/assets/imgs/chat.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  color: #333;
  padding: 12px 20px 26px 20px;
  width: 117px;
  min-height: 60px;
  z-index: 1001;
  font-size: 10px;
  line-height: 1.4;
  text-align: center;
  animation: fadeIn 0.3s ease-in-out;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: lighter;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.speech-bubble.fade-out {
  opacity: 0;
}

/* 移除原来的三角形指示器，因为图片可能已经包含了 */
.speech-bubble:after {
  display: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>