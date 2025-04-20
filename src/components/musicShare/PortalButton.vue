<template>
  <div class="portal-button-container" @click="$emit('click')" :class="{ 'active': isActive }">
    <canvas ref="portalCanvas" class="portal-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  primaryColor: {
    type: String,
    default: '#ffa6e9'
  },
  secondaryColor: {
    type: String,
    default: '#ffe6f5'
  },
  glowColor: {
    type: String,
    default: '#ff6e6e'
  }
});

defineEmits(['click']);

const portalCanvas = ref<HTMLCanvasElement | null>(null);
let gl: WebGLRenderingContext | null = null;
let animationFrameId: number | null = null;
let program: WebGLProgram | null = null;
let startTime = Date.now();

// 颜色字符串转RGB数组
const hexToRgb = (hex: string): number[] => {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
};

// WebGL相关函数
const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('无法创建着色器');
    return null;
  }
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
};

const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader | null, fragmentShader: WebGLShader | null) => {
  if (!vertexShader || !fragmentShader) return null;
  
  const program = gl.createProgram();
  if (!program) {
    console.error('无法创建程序');
    return null;
  }
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('程序链接错误:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
};

const initWebGL = () => {
  if (!portalCanvas.value) return;
  
  const canvas = portalCanvas.value;
  gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  
  if (!gl) {
    console.error('WebGL不可用');
    return;
  }
  
  const setCanvasSize = () => {
    const size = Math.min(60, window.innerWidth * 0.15);
    canvas.width = size;
    canvas.height = size;
    gl?.viewport(0, 0, canvas.width, canvas.height);
  };
  
  setCanvasSize();
  window.addEventListener('resize', setCanvasSize);
  
  const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_position * 0.5 + 0.5;
    }
  `;
  
  const fsSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform float u_time;
    uniform bool u_isActive;
    uniform vec3 u_primaryColor;
    uniform vec3 u_secondaryColor;
    uniform vec3 u_glowColor;
    
    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(v_texCoord, center);
      
      float angle = atan(v_texCoord.y - 0.5, v_texCoord.x - 0.5);
      float spiral = sin(dist * 40.0 - u_time * 6.0 + angle * 3.0) * 0.9 + 0.5;
      
      float alpha = smoothstep(0.5, 0.2, dist);
      
      if (dist > 0.5) {
        alpha = 0.0;
      }
      
      vec3 portalColor = u_isActive 
        ? u_primaryColor
        : (u_secondaryColor*u_primaryColor * 0.6);
        
      float pulse = sin(u_time) * 0.6 + 0.7;
      
      float glow = smoothstep(0.5, 0.2, dist) * pulse;
      portalColor = mix(portalColor, u_glowColor, glow * 0.5);
      
      portalColor = mix(portalColor, u_glowColor, spiral * 0.9);
      
      gl_FragColor = vec4(portalColor, alpha);
    }
  `;
  
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  program = createProgram(gl, vertexShader, fragmentShader);
  
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  const positions = [
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
     1.0,  1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  startRenderLoop();
};

const startRenderLoop = () => {
  if (!gl || !program) return;
  
  const render = () => {
    if (!gl || !program) return;
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const elapsedTime = (Date.now() - startTime) / 1000;
    gl.uniform1f(timeUniformLocation, elapsedTime);
    
    const isActiveUniformLocation = gl.getUniformLocation(program, 'u_isActive');
    gl.uniform1i(isActiveUniformLocation, props.isActive ? 1 : 0);
    
    const primaryColorLocation = gl.getUniformLocation(program, 'u_primaryColor');
    const secondaryColorLocation = gl.getUniformLocation(program, 'u_secondaryColor');
    const glowColorLocation = gl.getUniformLocation(program, 'u_glowColor');
    
    const primaryRgb = hexToRgb(props.primaryColor);
    const secondaryRgb = hexToRgb(props.secondaryColor);
    const glowRgb = hexToRgb(props.glowColor);
    
    gl.uniform3fv(primaryColorLocation, primaryRgb);
    gl.uniform3fv(secondaryColorLocation, secondaryRgb);
    gl.uniform3fv(glowColorLocation, glowRgb);
    
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    animationFrameId = requestAnimationFrame(render);
  };
  
  render();
};

const stopRenderLoop = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

onMounted(() => {
  initWebGL();
});

onBeforeUnmount(() => {
  stopRenderLoop();
  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.portal-button-container {
  position: fixed;
  right: 2vw;
  bottom: 65px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 9999;
  transition: transform 1s cubic-bezier(0.01, 0.26, 0.23, 0.99);
  box-shadow: none;
}

.portal-button-container:hover {
  transform: scale(1.15);
}

.portal-button-container.active {
  transform: rotate(45deg) scale(0.95);
}

.portal-canvas {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: transparent;
}
</style>