<template>
  <div class="portal-button-container" @click="handleClick" :class="{ 'active': isActive, 'fallback': !webglSupported }">
    <canvas v-if="webglSupported" ref="portalCanvas" class="portal-canvas"></canvas>
    <div v-else class="portal-fallback"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const webglSupported = ref(true);

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

const emit = defineEmits(['click']);

const handleClick = () => {
  emit('click');
};

const portalCanvas = ref<HTMLCanvasElement | null>(null);
let gl: WebGLRenderingContext | null = null;
let animationFrameId: number | null = null;
let program: WebGLProgram | null = null;
let startTime = Date.now();

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

const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
};

const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader | null, fragmentShader: WebGLShader | null) => {
  if (!vertexShader || !fragmentShader) return null;
  
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  
  return program;
};

const initWebGL = () => {
  if (!portalCanvas.value) return;
  
  const canvas = portalCanvas.value;
  try {
    gl = canvas.getContext('webgl', { 
      alpha: true, 
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: true
    });
    
    if (!gl) {
      webglSupported.value = false;
      return;
    }
  } catch (e) {
    webglSupported.value = false;
    return;
  }
  
  const setCanvasSize = () => {
    const size = isMobile ? 40 : Math.min(60, window.innerWidth * 0.15);
    canvas.width = Math.floor(size);
    canvas.height = Math.floor(size);
    gl?.viewport(0, 0, canvas.width, canvas.height);
  };
  
  setCanvasSize();
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(setCanvasSize, 100);
  });
  
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
      float spiral = sin(dist * ${isMobile ? '15.0' : '30.0'} - u_time * ${isMobile ? '2.0' : '4.0'} + angle * ${isMobile ? '1.5' : '2.0'}) * ${isMobile ? '0.5' : '0.7'} + 0.5;
      float alpha = smoothstep(0.5, 0.2, dist);
      if (dist > 0.5) alpha = 0.0;
      vec3 portalColor = u_isActive ? u_primaryColor : (u_secondaryColor * u_primaryColor * 0.6);
      float pulse = sin(u_time * ${isMobile ? '0.3' : '0.6'}) * ${isMobile ? '0.2' : '0.4'} + ${isMobile ? '0.6' : '0.8'};
      float glow = smoothstep(0.5, 0.2, dist) * pulse;
      portalColor = mix(portalColor, u_glowColor, glow * 0.5);
      portalColor = mix(portalColor, u_glowColor, spiral * 0.7);
      gl_FragColor = vec4(portalColor, alpha);
    }
  `;
  
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  program = createProgram(gl, vertexShader, fragmentShader);
  
  if (!program) {
    webglSupported.value = false;
    return;
  }
  
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  
  startRenderLoop();
};

const startRenderLoop = () => {
  if (!gl || !program) return;
  
  let lastTime = 0;
  const targetFPS = isMobile ? 30 : 60;
  const frameInterval = 1000 / targetFPS;

  const render = (currentTime: number) => {
    if (!gl || !program) return;

    const deltaTime = currentTime - lastTime;
    if (deltaTime < frameInterval) {
      animationFrameId = requestAnimationFrame(render);
      return;
    }
    lastTime = currentTime - (deltaTime % frameInterval);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (Date.now() - startTime) / 1000);
    gl.uniform1i(gl.getUniformLocation(program, 'u_isActive'), props.isActive ? 1 : 0);
    
    gl.uniform3fv(gl.getUniformLocation(program, 'u_primaryColor'), hexToRgb(props.primaryColor));
    gl.uniform3fv(gl.getUniformLocation(program, 'u_secondaryColor'), hexToRgb(props.secondaryColor));
    gl.uniform3fv(gl.getUniformLocation(program, 'u_glowColor'), hexToRgb(props.glowColor));
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    animationFrameId = requestAnimationFrame(render);
  };
  
  animationFrameId = requestAnimationFrame(render);
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
  bottom:130px;
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
  background: transparent !important;
  -webkit-tap-highlight-color: transparent;
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
  background: transparent !important;
  -webkit-tap-highlight-color: transparent;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.portal-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--primary-color, #ffa6e9), var(--secondary-color, #ffe6f5));
  opacity: 0.8;
}

@media (max-width: 768px) {
  .portal-button-container {
    right: 10px;
    bottom: 75px;
    width: 40px;
    height: 40px;
    transition: transform 0.3s ease;
  }
}
</style>