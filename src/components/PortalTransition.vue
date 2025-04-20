<template>
    <div class="portal-transition" v-show="isVisible || isFadingOut">
      <canvas ref="portalCanvas" class="portal-canvas"></canvas>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
  
  const props = defineProps({
    isVisible: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 1000
    },
    portalTexture: {
      type: String,
      default: ''
    },
    portalColor: {
      type: String,
      default: '#8e44ad'
    },
    distortionIntensity: {
      type: Number,
      default: 5.0
    }
  });
  
  const portalCanvas = ref<HTMLCanvasElement | null>(null);
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let texture: WebGLTexture | null = null;
  let animationId: number | null = null;
  let startTime: number = 0;
  let lastTime: number = 0;
  let globalTime: number = 0;
  let isFadingOut = ref(false);
  let fadeOutStartTime = 0;
  const fadeOutDuration = 500;
  
  // 缓存uniform位置
  let uniformLocations = {
    time: null as WebGLUniformLocation | null,
    globalTime: null as WebGLUniformLocation | null,
    opacity: null as WebGLUniformLocation | null,
    resolution: null as WebGLUniformLocation | null,
    portalColor: null as WebGLUniformLocation | null,
    distortionIntensity: null as WebGLUniformLocation | null,
    image: null as WebGLUniformLocation | null
  };
  
  // 缓存attribute位置
  let attributeLocations = {
    position: -1,
    texCoord: -1
  };
  
  // 缓存缓冲区
  let buffers = {
    position: null as WebGLBuffer | null,
    texCoord: null as WebGLBuffer | null
  };
  
  // 顶点着色器
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
      v_texCoord = a_texCoord;
    }
  `;
  
  // 片元着色器
  const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_globalTime;
    uniform float u_opacity;
    uniform vec2 u_resolution;
    uniform vec3 u_portalColor;
    uniform float u_distortionIntensity;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 uv = v_texCoord;
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(uv, center);
      
      float angle = atan(uv.y - center.y, uv.x - center.x);
      float rotationSpeed = (1.0 - dist) * u_distortionIntensity;
      angle += u_globalTime * (1.0 + rotationSpeed);
      
      float distortionStrength = 0.3 * u_time;
      float inwardPull = dist * (1.0 - pow(u_time, 0.5)) * distortionStrength;
      dist -= inwardPull;
      
      uv = center + vec2(cos(angle) * dist, sin(angle) * dist);
      
      float edgeGlow = smoothstep(0.5, 0.2, dist) * 
                       smoothstep(0.0, 0.3, dist) *
                       u_time * 2.0;
      
      vec4 texColor = texture2D(u_image, uv);
      vec4 portalColor = vec4(u_portalColor, 1.0);
      
      gl_FragColor = mix(texColor, portalColor, edgeGlow);
      
      float centerGlow = smoothstep(0.15, 0.0, dist) * u_time * 1.5;
      gl_FragColor = mix(gl_FragColor, vec4(1.0), centerGlow);
      
      gl_FragColor.a *= u_opacity * (1.0 - inwardPull * 0.5);
    }
  `;
  
  // 创建着色器
  const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('着色器编译错误:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };
  
  // 创建程序
  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;
    
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
  
  // 初始化缓冲区
  const initBuffers = () => {
    if (!gl || !program) return;
  
    // 创建并设置顶点位置缓冲区
    buffers.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW);
  
    // 创建并设置纹理坐标缓冲区
    buffers.texCoord = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0, 1, 0, 0, 1, 1, 1
    ]), gl.STATIC_DRAW);
  
    // 获取attribute位置
    attributeLocations.position = gl.getAttribLocation(program, 'a_position');
    attributeLocations.texCoord = gl.getAttribLocation(program, 'a_texCoord');
  
    // 获取uniform位置
    uniformLocations.time = gl.getUniformLocation(program, 'u_time');
    uniformLocations.globalTime = gl.getUniformLocation(program, 'u_globalTime');
    uniformLocations.opacity = gl.getUniformLocation(program, 'u_opacity');
    uniformLocations.resolution = gl.getUniformLocation(program, 'u_resolution');
    uniformLocations.portalColor = gl.getUniformLocation(program, 'u_portalColor');
    uniformLocations.distortionIntensity = gl.getUniformLocation(program, 'u_distortionIntensity');
    uniformLocations.image = gl.getUniformLocation(program, 'u_image');
  };
  
  // 设置顶点属性
  const setupVertexAttributes = () => {
    if (!gl || !program) return;
  
    // 设置顶点位置属性
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.enableVertexAttribArray(attributeLocations.position);
    gl.vertexAttribPointer(attributeLocations.position, 2, gl.FLOAT, false, 0, 0);
  
    // 设置纹理坐标属性
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texCoord);
    gl.enableVertexAttribArray(attributeLocations.texCoord);
    gl.vertexAttribPointer(attributeLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
  };
  
  // 设置uniform值
  const setupUniforms = (time: number, opacity: number) => {
    if (!gl) return;
  
    gl.uniform1f(uniformLocations.time, time);
    gl.uniform1f(uniformLocations.globalTime, globalTime);
    gl.uniform1f(uniformLocations.opacity, opacity);
    gl.uniform1f(uniformLocations.distortionIntensity, props.distortionIntensity);
    
    gl.uniform2f(
      uniformLocations.resolution,
      portalCanvas.value!.width,
      portalCanvas.value!.height
    );
  
    const colorHex = props.portalColor.replace('#', '');
    const r = parseInt(colorHex.substring(0, 2), 16) / 255;
    const g = parseInt(colorHex.substring(2, 4), 16) / 255;
    const b = parseInt(colorHex.substring(4, 6), 16) / 255;
    gl.uniform3f(uniformLocations.portalColor, r, g, b);
  };
  
  // 渲染一帧
  const renderFrame = (progress: number, opacity: number) => {
    if (!gl || !program) return;
  
    resizeCanvas();
    
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);
    
    setupVertexAttributes();
    setupUniforms(progress, opacity);
    
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniformLocations.image, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  
  // 初始化WebGL
  const initWebGL = () => {
    if (!portalCanvas.value) return;
    
    gl = portalCanvas.value.getContext('webgl', { alpha: true });
    if (!gl) {
      console.error('无法初始化WebGL');
      return;
    }
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;
    
    program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;
    
    gl.useProgram(program);
    
    initBuffers();
    
    // 创建和设置纹理
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    const image = new Image();
    image.onload = () => {
      gl?.bindTexture(gl.TEXTURE_2D, texture);
      gl?.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    };
    image.onerror = () => {
      const pixel = new Uint8Array([128, 0, 128, 255]);
      gl?.bindTexture(gl.TEXTURE_2D, texture);
      gl?.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    };
    
    if (props.portalTexture) {
      image.src = props.portalTexture;
    } else {
      const pixel = new Uint8Array([128, 0, 128, 255]);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    }
  };
  
  // 更新全局时间
  const updateGlobalTime = (timestamp: number) => {
    if (lastTime === 0) {
      lastTime = timestamp;
    }
    const deltaTime = (timestamp - lastTime) / 1000; // 转换为秒
    lastTime = timestamp;
    globalTime += deltaTime;
  };
  
  // 渲染函数
  const render = (timestamp: number) => {
    if (!gl || !program) return;
    
    updateGlobalTime(timestamp);
    
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / props.duration, 1.0);
    
    renderFrame(progress, 1.0);
    
    if (progress < 1.0) {
      animationId = requestAnimationFrame(render);
    } else {
      if (!props.isVisible) {
        startFadeOut();
      } else {
        animationId = requestAnimationFrame(renderStatic);
      }
    }
  };
  
  // 渲染静态状态
  const renderStatic = (timestamp: number) => {
    if (!gl || !program) return;
    
    updateGlobalTime(timestamp);
    renderFrame(1.0, 1.0);
    
    if (props.isVisible) {
      animationId = requestAnimationFrame(renderStatic);
    } else {
      startFadeOut();
    }
  };
  
  // 开始淡出动画
  const startFadeOut = () => {
    isFadingOut.value = true;
    fadeOutStartTime = performance.now();
    animationId = requestAnimationFrame(renderFadeOut);
  };
  
  // 渲染淡出效果
  const renderFadeOut = (timestamp: number) => {
    if (!gl || !program) return;
    
    updateGlobalTime(timestamp);
    
    const elapsed = timestamp - fadeOutStartTime;
    const fadeProgress = Math.min(elapsed / fadeOutDuration, 1.0);
    
    renderFrame(1.0, 1.0 - fadeProgress);
    
    if (fadeProgress < 1.0) {
      animationId = requestAnimationFrame(renderFadeOut);
    } else {
      isFadingOut.value = false;
      animationId = null;
    }
  };
  
  // 调整画布大小
  const resizeCanvas = () => {
    if (!portalCanvas.value || !gl) return;
    
    const canvas = portalCanvas.value;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  };
  
  // 开始动画
  const startAnimation = () => {
    if (!gl) return;
    
    isFadingOut.value = false;
    startTime = performance.now();
    lastTime = 0;
    globalTime = 0;
    
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    animationId = requestAnimationFrame(render);
  };
  
  // 监听可见性变化
  watch(() => props.isVisible, (newValue) => {
    if (newValue) {
      startAnimation();
    } else if (!isFadingOut.value) {
      if (animationId) {
        // 如果动画正在进行，让它继续，最终会调用淡出
      } else {
        startFadeOut();
      }
    }
  });
  
  // 组件挂载时初始化
  onMounted(() => {
    initWebGL();
    if (props.isVisible) {
      startAnimation();
    }
    window.addEventListener('resize', resizeCanvas);
  });
  
  // 组件卸载前清理
  onBeforeUnmount(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    window.removeEventListener('resize', resizeCanvas);
  });
  
  // 暴露方法
  defineExpose({
    startAnimation
  });
  </script>
  
  <style scoped>
  .portal-transition {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    pointer-events: none;
  }
  
  .portal-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  </style>