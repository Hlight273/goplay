<template>
    <div ref="container" class="dissolve-container">
      <canvas ref="canvas"></canvas>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted, watch, defineProps, onBeforeUnmount } from "vue";
  import * as THREE from "three";
  import gsap from "gsap";
  
  // 定义组件属性
  const props = defineProps<{
    isVisible: boolean;
    backgroundType: "pureColor" | "image" | "gif" | "video"; // 背景类型
    noiseTexture: string; // 溶解贴图路径
    backgroundSource?: string; // 背景的资源路径
  }>();
  
  // DOM 引用
  const container = ref<HTMLElement | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);
  
  // Three.js 相关变量
  let scene: THREE.Scene;
  let camera: THREE.OrthographicCamera;
  let renderer: THREE.WebGLRenderer;
  let material: THREE.ShaderMaterial;
  let mesh: THREE.Mesh;
  let animationFrameId: number;
  
  // 纹理相关
  let backgroundTexture: THREE.Texture | THREE.VideoTexture | null = null;
  let videoElement: HTMLVideoElement | null = null;
  
  // 颜色定义
  const baseColor = new THREE.Color(0x000000);  // 纯黑色基础
  const edgeColor = new THREE.Color(0xff0000);  // 暗红色边缘
  const glowColor = new THREE.Color(0xff6079);  // 橙色发光
  
  // 初始化 Three.js 场景
  const initThreeJS = () => {
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建正交相机
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ 
      canvas: canvas.value!, 
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
  };
  
  // 创建背景纹理
  const createBackgroundTexture = () => {
    switch (props.backgroundType) {
      case "pureColor":
        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = 2;
        colorCanvas.height = 2;
        const ctx = colorCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#464646";
          ctx.fillRect(0, 0, 2, 2);
        }
        backgroundTexture = new THREE.CanvasTexture(colorCanvas);
        break;
        
      case "image":
      case "gif":
        if (props.backgroundSource) {
          backgroundTexture = new THREE.TextureLoader().load(props.backgroundSource);
        }
        break;
        
      case "video":
        if (props.backgroundSource) {
          videoElement = document.createElement("video");
          videoElement.src = props.backgroundSource;
          videoElement.loop = true;
          videoElement.muted = true;
          videoElement.play();
          
          backgroundTexture = new THREE.VideoTexture(videoElement);
          backgroundTexture.minFilter = THREE.LinearFilter;
          backgroundTexture.magFilter = THREE.LinearFilter;
          backgroundTexture.format = THREE.RGBFormat;
        }
        break;
    }
  };
  
  // 创建 Shader 材质
  const createShaderMaterial = (noiseTexture: THREE.Texture) => {
    material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      texture1: { value: noiseTexture },
      background: { value: backgroundTexture },
      baseColor: { value: baseColor },
      edgeColor: { value: edgeColor },
      glowColor: { value: glowColor },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      noiseSpeed: { value: new THREE.Vector2(0.2, 0.1) },  // 添加噪声移动速度
      globalTime: { value: 0 }  // 添加全局时间
    },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float time;
        uniform float globalTime;
        uniform vec2 noiseSpeed;
        uniform sampler2D texture1;
        uniform sampler2D background;
        uniform vec3 baseColor;
        uniform vec3 edgeColor;
        uniform vec3 glowColor;
        uniform vec2 resolution;
        varying vec2 vUv;

        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        // 添加柏林噪声辅助函数
        float mod289(float x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec2 mod289(vec2 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec3 permute(vec3 x) {
          return mod289(((x*34.0)+1.0)*x);
        }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                              0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                              -0.577350269189626,  // -1.0 + 2.0 * C.x
                              0.024390243902439); // 1.0 / 41.0
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;
          
          // 使用柏林噪声创建动态UV偏移
          float noiseScale = 3.0;
          vec2 noiseOffset = vec2(
            snoise(uv * noiseScale + globalTime * noiseSpeed),
            snoise(uv * noiseScale + globalTime * noiseSpeed + vec2(5.2, 1.3))
          ) * 0.02;
          
          // 添加动态UV动画
          vec2 movingUV = fract(uv + noiseSpeed * globalTime + noiseOffset);
          
          // 创建多层次采样
          float noise = 0.0;
          float weights[4] = float[4](0.4, 0.3, 0.2, 0.1);
          
          for(int i = 0; i < 4; i++) {
            float scale = 1.0 + float(i) * 0.5;
            vec2 scaledUV = fract(movingUV * scale);
            noise += texture2D(texture1, scaledUV).r * weights[i];
          }
          
          // 添加柏林噪声细节
          noise = mix(noise, noise + snoise(movingUV * 10.0) * 0.1, 0.3);
          
          float microDetail = rand(movingUV * 100.0) * 0.1;
          noise = mix(noise, noise + microDetail, 0.5);
          
          float dissolveThreshold;
          if (time < 0.5) {
            dissolveThreshold = time * 2.0;
          } else {
            dissolveThreshold = (1.0 - time) * 2.0;
          }

          // 确保在中间点时完全溶解
          if (abs(time - 0.5) < 0.01) {
            dissolveThreshold = 1.0;
          }

          // 更锐利的边缘
          float edge = smoothstep(dissolveThreshold, dissolveThreshold + 0.01, noise);
          
          // 增强发光效果
          float glow = smoothstep(dissolveThreshold - 0.1, dissolveThreshold, noise) - 
                      smoothstep(dissolveThreshold, dissolveThreshold + 0.1, noise);
          
          float innerGlow = smoothstep(dissolveThreshold - 0.01, dissolveThreshold, noise) - 
                          smoothstep(dissolveThreshold, dissolveThreshold + 0.01, noise);
          
          // 纯黑基础色，只在边缘发光
          vec3 finalColor = baseColor;
          finalColor = mix(finalColor, edgeColor, innerGlow * 1.0);
          finalColor += glowColor * glow * 3.0;
          
          // 调整透明度，保持发光效果
          float alpha = smoothstep(dissolveThreshold - 0.01, dissolveThreshold + 0.01, noise);
          alpha = max(alpha, glow * 0.9);
          
          // 确保在中间点时完全黑色
          if (abs(time - 0.5) < 0.01) {
            alpha = 0.0;
            finalColor = baseColor;
          }
          
          gl_FragColor = vec4(finalColor, 1.0 - alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  };
  
  // 创建网格
  const createMesh = () => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  };
  
  // 动画循环
  const animate = () => {
  if (canvas.value?.style.display !== "none") {
    try {
      material.uniforms.globalTime.value += 0.005; // 使用单一的更新速度
      renderer.render(scene, camera);
    } catch (e) {
      console.warn('渲染错误:', e);
    }
  }
  animationFrameId = requestAnimationFrame(animate);
};
  
  // 处理窗口大小变化
  const handleResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    
    camera.left = -1;
    camera.right = 1;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
    
    if (backgroundTexture) {
      backgroundTexture.needsUpdate = true;
    }
    
    if (material && material.uniforms.resolution) {
      material.uniforms.resolution.value.set(width, height);
    }
  };
  
  // 控制溶解效果
  const controlDissolveEffect = (isVisible: boolean) => {
  if (container.value) container.value.style.display = "block";
  if (canvas.value) canvas.value.style.display = "block";
  
  // 清除之前的动画防止冲突
  gsap.killTweensOf(material.uniforms.time);
  
  // 重置时间值，确保每次动画从正确的起点开始
  material.uniforms.time.value = isVisible ? 0 : 0.5;
  
  if (isVisible) {
    // 正向动画：透明 → 黑色 → 透明
    gsap.timeline()
      .to(material.uniforms.time, {
        value: 0.5,  // 先到达中间黑色状态
        duration: 1,
        ease: "power2.Out"
      })
      .to(material.uniforms.time, {
        value: 0.5,  // 保持黑色状态一段时间
        duration: 0.3
      })
      .to(material.uniforms.time, {
        value: 1,  // 然后继续到透明状态
        duration: 1.3,
        ease: "power2.Out",
        onComplete: () => {
          if (canvas.value) canvas.value.style.display = "none";
          if (container.value) container.value.style.display = "none";
        }
      });
  } else {
    // 反向动画：黑色 → 透明
    gsap.to(material.uniforms.time, {
      value: 0.2,
      duration: 0.2,
      ease: "power2.inOut",
      onComplete: () => {
        if (canvas.value) canvas.value.style.display = "none";
        if (container.value) container.value.style.display = "none";
      }
    });
  }
};
  
  // 组件挂载时初始化
  onMounted(() => {
    // 初始化 Three.js
    initThreeJS();
    
    // 创建背景纹理
    createBackgroundTexture();
    
    // 加载噪声纹理
    const textureLoader = new THREE.TextureLoader();
    const noiseTexture = textureLoader.load(props.noiseTexture);
    
    // 创建 Shader 材质
    createShaderMaterial(noiseTexture);
    
    // 创建网格
    createMesh();
    
    // 开始动画循环
    animate();
    
    // 添加窗口大小变化监听
    window.addEventListener("resize", handleResize);
    
    // 初始时隐藏 container 和 canvas
    if (canvas.value) canvas.value.style.display = "none";
    if (container.value) container.value.style.display = "none";
  });
  
  // 监听 isVisible 属性变化
  watch(() => props.isVisible, controlDissolveEffect);
  
  // 组件卸载前清理资源
  onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
    cancelAnimationFrame(animationFrameId);
    
    // 清理视频资源
    if (videoElement) {
      videoElement.pause();
      videoElement.src = "";
      videoElement.load();
    }
    
    // 清理 Three.js 资源
    if (mesh) scene.remove(mesh);
    if (material) material.dispose();
    if (mesh && mesh.geometry) mesh.geometry.dispose();
    if (backgroundTexture) backgroundTexture.dispose();
    
    renderer.dispose();
  });
  </script>
  
  <style scoped>
  .dissolve-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    z-index: 99999999999;
    display: none; /* 初始时隐藏 */
  }
  
  canvas {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  </style>
  