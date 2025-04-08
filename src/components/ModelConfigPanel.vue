<template>
    <div class="debug-panel" v-if="modelConfig.showPanel" v-debug-panel-drag>
      <div class="debug-panel-header">
        <h4>调试面板</h4>
        <div class="header-buttons">
          <el-button class="black_oil_btn" size="small" @click="exportConfig">导出配置</el-button>
          <el-icon class="drag-handle"><DCaret /></el-icon>
        </div>
      </div>
  
      <div class="param-group">
        <h4>模型旋转</h4>
        <span>X轴旋转: {{ modelConfig.model ? Number(modelConfig.model.rotation.x).toFixed(2) : 0 }}</span>
        <el-slider 
          :model-value="modelConfig.model ? modelConfig.model.rotation.x : 0"
          @update:model-value="(val:any) => updateModelRotation('x', val)"
          :min="-3.14" 
          :max="3.14" 
          :step="0.01" 
        />
        <span>Y轴旋转: {{ modelConfig.model ? Number(modelConfig.model.rotation.y).toFixed(2) : 0 }}</span>
        <el-slider 
          :model-value="modelConfig.model ? modelConfig.model.rotation.y : 0"
          @update:model-value="(val:any) => updateModelRotation('y', val)"
          :min="-3.14" 
          :max="3.14" 
          :step="0.01" 
        />
        <span>Z轴旋转: {{ modelConfig.model ? Number(modelConfig.model.rotation.z).toFixed(2) : 0 }}</span>
        <el-slider 
          :model-value="modelConfig.model ? modelConfig.model.rotation.z : 0"
          @update:model-value="(val:any) => updateModelRotation('z', val)"
          :min="-3.14" 
          :max="3.14" 
          :step="0.01" 
        />
      </div>
  
      <div class="param-group">
        <span>距离: {{ modelConfig.camera.distance }}</span>
        <el-slider 
          :model-value="modelConfig.camera.distance"
          @update:model-value="(val: any) => $emit('update:model-config', { ...modelConfig, camera: { ...modelConfig.camera, distance: val } })"
          :min="2" 
          :max="40" 
          :step="0.1" 
          @input="updateCamera"
        />
      </div>
  
      <div class="param-group">
        <span>相机位置:</span>
        <span>X:</span>
        <el-slider 
          :model-value="modelConfig.camera.position.x"
          @update:model-value="(val:any) => $emit('update:model-config', { 
            ...modelConfig, 
            camera: { 
              ...modelConfig.camera, 
              position: { ...modelConfig.camera.position, x: val }
            } 
          })"
          :min="-10" 
          :max="10" 
          :step="0.1" 
          @input="updateCamera"
        />
        <span>Y:</span>
        <el-slider 
          :model-value="modelConfig.camera.position.y"
          @update:model-value="(val:any) => $emit('update:model-config', { 
            ...modelConfig, 
            camera: { 
              ...modelConfig.camera, 
              position: { ...modelConfig.camera.position, y: val }
            } 
          })"
          :min="-10" 
          :max="10" 
          :step="0.1" 
          @input="updateCamera"
        />
      </div>
  
      <h4>光照控制</h4>
      <div class="param-group">
        <span>环境光强度: {{ modelConfig.lights.ambient }}</span>
        <el-slider 
          :model-value="modelConfig.lights.ambient"
          @update:model-value="(val:any) => $emit('update:model-config', { 
            ...modelConfig, 
            lights: { ...modelConfig.lights, ambient: val } 
          })"
          :min="0" 
          :max="10" 
          :step="0.1" 
          @input="updateLights"
        />
      </div>
      <div class="param-group">
        <span>平行光强度: {{ modelConfig.lights.directional }}</span>
        <el-slider 
          :model-value="modelConfig.lights.directional"
          @update:model-value="(val:any) => $emit('update:model-config', { 
            ...modelConfig, 
            lights: { ...modelConfig.lights, directional: val } 
          })"
          :min="0" 
          :max="10" 
          :step="0.1" 
          @input="updateLights"
        />
      </div>
      <div class="param-group">
        <span>平行光位置:</span>
        <el-slider 
          :model-value="modelConfig.lights.position.x"
          @update:model-value="(val:any) => $emit('update:model-config', { 
            ...modelConfig, 
            lights: { 
              ...modelConfig.lights, 
              position: { ...modelConfig.lights.position, x: val } 
            } 
          })"
          :min="-10" 
          :max="10" 
          :step="0.1" 
          @input="updateLights"
        />
        <el-slider 
          :model-value="modelConfig.lights.position.y"
          @update:model-value="(val:any) => $emit('update:model-config', { 
            ...modelConfig, 
            lights: { 
              ...modelConfig.lights, 
              position: { ...modelConfig.lights.position, y: val } 
            } 
          })"
          :min="-10" 
          :max="10" 
          :step="0.1" 
          @input="updateLights"
        />
        <el-slider 
          :model-value="modelConfig.lights.position.z"
          @update:model-value="(val:any) => $emit('update:model-config', { 
            ...modelConfig, 
            lights: { 
              ...modelConfig.lights, 
              position: { ...modelConfig.lights.position, z: val } 
            } 
          })"
          :min="-10" 
          :max="10" 
          :step="0.1" 
          @input="updateLights"
        />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits } from 'vue'
  import { DCaret } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import { copyToClipboard, createDraggable } from '@/util/commonUtil'
  import * as THREE from 'three'
  
  const props = defineProps<{
    modelConfig: {
      showPanel: boolean
      camera: {
        position: { x: number; y: number }
        distance: number
      }
      lights: {
        ambient: number
        directional: number
        position: { x: number; y: number; z: number }
      }
      model?: THREE.Group
    }
  }>()
  
  const emit = defineEmits<{
    (e: 'update-camera'): void
    (e: 'update-lights'): void
    (e: 'update-rotation', deltaX: number, deltaY: number): void
    (e: 'update:model-config', config: typeof props.modelConfig): void
  }>()
  
  const updateModelRotation = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!props.modelConfig.model) return
    
    // 直接设置模型的旋转
    props.modelConfig.model.rotation[axis] = value
    emit('update-rotation', 0, 0)
  }
  
  const updateCamera = () => {
    emit('update-camera')
  }
  
  const updateLights = () => {
    emit('update-lights')
  }
  
  const exportConfig = () => {
    const config = {
      camera: {
        position: props.modelConfig.camera.position,
        distance: props.modelConfig.camera.distance
      },
      model: props.modelConfig.model ? {
        rotation: {
          x: props.modelConfig.model.rotation.x,
          y: props.modelConfig.model.rotation.y,
          z: props.modelConfig.model.rotation.z
        }
      } : undefined,
      lights: props.modelConfig.lights
    }
    
    const clipConfig = JSON.stringify(config, null, 2)
    if (clipConfig) {
      copyToClipboard(clipConfig)
      ElMessage.success('配置已复制到剪贴板')
    }
  }
  
  const vDebugPanelDrag = createDraggable({
    handleClass: 'debug-panel-header',
    boundaryPadding: 0
  })
  </script>
  
  <style scoped>
  .debug-panel {
    position: fixed;
    right: 10px;
    top: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 8px;
    width: 300px;
    user-select: none;
    z-index: 1000;
  }
  
  .debug-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: all;
  }
  
  .param-group {
    margin: 10px 0;
  }
  
  .param-group span {
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
  }
  
  h4 {
    margin: 10px 0;
    color: #409EFF;
  }
  
  .header-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .header-buttons .el-button {
    padding: 4px 8px;
    font-size: 12px;
  }
  </style>