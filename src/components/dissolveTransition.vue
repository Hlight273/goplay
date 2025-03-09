<template>
    <div ref="container" class="dissolve-container">
      <canvas ref="canvas"></canvas>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted, watch, defineProps } from "vue";
  import * as THREE from "three";
  import gsap from "gsap";
  
  const props = defineProps<{
    isVisible: boolean;
    backgroundType: "pureColor" | "image" | "gif" | "video"; // 背景类型
    noiseTexture: string; //溶解贴图路径
    backgroundSource: string; // 背景的资源路径
  }>();
  
  const container = ref<HTMLElement | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);
  let material: THREE.ShaderMaterial,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.OrthographicCamera;
  let videoTexture: THREE.VideoTexture, texture: THREE.Texture;

  const baseColor = new THREE.Color(0xff4500); // 深灰色
  const edgeColor = new THREE.Color(0x464646); // 橘红色
  
  // 选择背景类型
  let backgroundTexture: THREE.Texture | THREE.VideoTexture | null = null;
  
  onMounted(() => {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
  
    // 创建 WebGL 渲染器
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value!, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
  
    // 设置背景颜色（透明背景）
    renderer.setClearColor(0x000000, 0);
  
    // 选择背景类型
    let backgroundTexture: THREE.Texture | THREE.VideoTexture | null = null;
  
    if (props.backgroundType === "pureColor") {
      const colorCanvas = document.createElement("canvas");
      colorCanvas.width = 2;
      colorCanvas.height = 2;
      const ctx = colorCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#464646";
        ctx.fillRect(0, 0, 2, 2);
      }
      backgroundTexture = new THREE.CanvasTexture(colorCanvas);
    } else if (props.backgroundType === "image" || props.backgroundType === "gif") {
      texture = new THREE.TextureLoader().load(props.backgroundSource);
      backgroundTexture = texture;
    } else if (props.backgroundType === "video") {
      const videoElement = document.createElement("video");
      videoElement.src = props.backgroundSource;
      videoElement.loop = true;
      videoElement.muted = true;
      videoElement.play();
      videoTexture = new THREE.VideoTexture(videoElement);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.format = THREE.RGBFormat;
      backgroundTexture = videoTexture;
    }
  
    // 载入噪声纹理
    const textureLoader = new THREE.TextureLoader();
    const _noiseTexture = textureLoader.load(props.noiseTexture);
  
    // 创建 Shader 材质
    material = new THREE.ShaderMaterial({
        uniforms: {
      time: { value: 0 },
      texture1: { value: _noiseTexture },
      background: { value: backgroundTexture },
      baseColor: { value: baseColor },
      edgeColor: { value: edgeColor }
    },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
      uniform float time;
      uniform sampler2D texture1;
      uniform sampler2D background;
      uniform vec3 baseColor;
      uniform vec3 edgeColor;
      varying vec2 vUv;

      void main() {
        float noise = texture2D(texture1, vUv).r;
        float dissolve;

        if (time < 0.5) {
          dissolve = smoothstep(time * 2.0, time * 2.0 + 0.05, noise);
        } else {
          dissolve = smoothstep((1.0 - time) * 2.0, (1.0 - time) * 2.0 + 0.02, noise);
        }

        vec3 bgColor = texture2D(background, vUv).rgb;

        // 边缘光颜色渐变
        vec3 finalColor = mix(edgeColor, baseColor, dissolve);

        float alpha = 1.0 - (dissolve*dissolve);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
      transparent: true,
    });
  
    // 创建平面几何体，覆盖整个页面
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  
    // 动画循环
    function animate() {
      requestAnimationFrame(animate);
      // 只在 canvas 可见时渲染
      if (canvas.value?.style.display !== "none") {
        renderer.render(scene, camera);
      }
    }
  
    // 监听页面显示，控制溶解效果
    watch(
      () => props.isVisible,
      (newVal) => {
        if (container.value) container.value.style.display = "block";
        if (canvas.value) canvas.value.style.display = "block";
  
        // 清除之前的动画防止冲突
        gsap.killTweensOf(material.uniforms.time);
  
        if (newVal) {
          // 正向动画：透明 → 背景显示 → 透明
          gsap
            .timeline()
            .to(material.uniforms.time, {
              value: 1,
              duration: 2,
              ease: "power2.easeOut",
              onComplete: () => {
                // 动画完成后隐藏 container 和 canvas
                if (canvas.value) canvas.value.style.display = "none";
                if (container.value) container.value.style.display = "none";
              },
            });
        } else {
          // 直接反向动画：背景显示 → 透明
          gsap.to(material.uniforms.time, {
            value: 0,
            duration: 2,
            ease: "power2.easeOut",
            onComplete: () => {
              // 动画完成后隐藏 container 和 canvas
              if (canvas.value) canvas.value.style.display = "none";
              if (container.value) container.value.style.display = "none";
            },
          });
        }
      }
    );
  
    animate();
    window.addEventListener("resize", onResize);
  
    // 初始时隐藏 container 和 canvas
    if (canvas && canvas.value) canvas.value.style.display = "none";
    if (container && container.value) container.value.style.display = "none";
  });
  
  // 处理窗口大小变化
  function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
  
    // 更新渲染器大小
    renderer.setSize(width, height);
  
    // 更新相机的投影矩阵
    camera.left = -1;
    camera.right = 1;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
  
    // 更新背景纹理的尺寸，确保背景始终覆盖整个画布
    if (backgroundTexture instanceof THREE.Texture) {
      backgroundTexture.needsUpdate = true;
    }
  }
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
  