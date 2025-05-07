<template>
  <div ref="container" class="dissolve-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, defineProps, onBeforeUnmount } from "vue";
import * as THREE from "three";
import gsap from "gsap";

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const props = defineProps<{
  isVisible: boolean;
  backgroundType: "pureColor" | "image" | "gif" | "video";
  noiseTexture: string;
  backgroundSource?: string;
}>();

const container = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);

let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let material: THREE.ShaderMaterial;
let mesh: THREE.Mesh;
let animationFrameId: number;
let backgroundTexture: THREE.Texture | THREE.VideoTexture | null = null;
let videoElement: HTMLVideoElement | null = null;

const baseColor = new THREE.Color(0x000000);
const edgeColor = new THREE.Color(0xff0000);
const glowColor = new THREE.Color(0xff6079);

const initThreeJS = () => {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;
  
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas.value!, 
    alpha: true,
    antialias: !isMobile,
    powerPreference: isMobile ? "low-power" : "high-performance",
    preserveDrawingBuffer: !isMobile
  });
  
  renderer.setPixelRatio(isMobile ? 1 : window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
};

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

const createShaderMaterial = (noiseTexture: THREE.Texture) => {
  const fragmentShader = `
    precision ${isMobile ? 'mediump' : 'highp'} float;
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
    ${isMobile ? '' : `
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
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }`}

    void main() {
      vec2 uv = vUv;
      vec2 movingUV = fract(uv + noiseSpeed * globalTime);
      
      float noise = 0.0;
      ${isMobile ? `
      noise = texture2D(texture1, movingUV).r;
      ` : `
      float weights[4] = float[4](0.4, 0.3, 0.2, 0.1);
      for(int i = 0; i < 4; i++) {
        float scale = 1.0 + float(i) * 0.5;
        vec2 scaledUV = fract(movingUV * scale);
        noise += texture2D(texture1, scaledUV).r * weights[i];
      }
      
      vec2 noiseOffset = vec2(
        snoise(uv * 3.0 + globalTime * noiseSpeed),
        snoise(uv * 3.0 + globalTime * noiseSpeed + vec2(5.2, 1.3))
      ) * 0.02;
      
      noise = mix(noise, noise + snoise(movingUV * 10.0) * 0.1, 0.3);
      float microDetail = rand(movingUV * 100.0) * 0.1;
      noise = mix(noise, noise + microDetail, 0.5);
      `}
      
      float dissolveThreshold = time < 0.5 ? time * 2.0 : (1.0 - time) * 2.0;
      if (abs(time - 0.5) < 0.01) dissolveThreshold = 1.0;

      float edge = smoothstep(dissolveThreshold, dissolveThreshold + 0.01, noise);
      float glow = smoothstep(dissolveThreshold - 0.1, dissolveThreshold, noise) - 
                  smoothstep(dissolveThreshold, dissolveThreshold + 0.1, noise);
      
      vec3 finalColor = baseColor;
      finalColor = mix(finalColor, edgeColor, edge);
      finalColor += glowColor * glow * ${isMobile ? '2.0' : '3.0'};
      
      float alpha = smoothstep(dissolveThreshold - 0.01, dissolveThreshold + 0.01, noise);
      alpha = max(alpha, glow * 0.9);
      
      if (abs(time - 0.5) < 0.01) {
        alpha = 0.0;
        finalColor = baseColor;
      }
      
      gl_FragColor = vec4(finalColor, 1.0 - alpha);
    }
  `;

  material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      texture1: { value: noiseTexture },
      background: { value: backgroundTexture },
      baseColor: { value: baseColor },
      edgeColor: { value: edgeColor },
      glowColor: { value: glowColor },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      noiseSpeed: { value: new THREE.Vector2(isMobile ? 0.1 : 0.2, isMobile ? 0.05 : 0.1) },
      globalTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
};

const createMesh = () => {
  const geometry = new THREE.PlaneGeometry(2, 2);
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
};

const animate = () => {
  if (canvas.value?.style.display !== "none") {
    material.uniforms.globalTime.value += isMobile ? 0.003 : 0.005;
    renderer.render(scene, camera);
  }
  animationFrameId = requestAnimationFrame(animate);
};

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

const controlDissolveEffect = (isVisible: boolean) => {
  if (container.value) container.value.style.display = "block";
  if (canvas.value) canvas.value.style.display = "block";
  
  gsap.killTweensOf(material.uniforms.time);
  material.uniforms.time.value = isVisible ? 0 : 0.5;
  
  if (isVisible) {
    gsap.timeline()
      .to(material.uniforms.time, {
        value: 0.5,
        duration: isMobile ? 0.8 : 1,
        ease: "power2.Out"
      })
      .to(material.uniforms.time, {
        value: 0.5,
        duration: isMobile ? 0.2 : 0.3
      })
      .to(material.uniforms.time, {
        value: 1,
        duration: isMobile ? 1 : 1.3,
        ease: "power2.Out",
        onComplete: () => {
          if (canvas.value) canvas.value.style.display = "none";
          if (container.value) container.value.style.display = "none";
        }
      });
  } else {
    gsap.to(material.uniforms.time, {
      value: 0.2,
      duration: isMobile ? 0.15 : 0.2,
      ease: "power2.inOut",
      onComplete: () => {
        if (canvas.value) canvas.value.style.display = "none";
        if (container.value) container.value.style.display = "none";
      }
    });
  }
};

onMounted(() => {
  initThreeJS();
  createBackgroundTexture();
  
  const textureLoader = new THREE.TextureLoader();
  const noiseTexture = textureLoader.load(props.noiseTexture);
  
  createShaderMaterial(noiseTexture);
  createMesh();
  animate();
  
  let resizeTimeout: number;
  window.addEventListener("resize", () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(handleResize, 100);
  });
  
  if (canvas.value) canvas.value.style.display = "none";
  if (container.value) container.value.style.display = "none";
});

watch(() => props.isVisible, controlDissolveEffect);

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  cancelAnimationFrame(animationFrameId);
  
  if (videoElement) {
    videoElement.pause();
    videoElement.src = "";
    videoElement.load();
  }
  
  if (mesh) scene.remove(mesh);
  if (material) material.dispose();
  if (mesh?.geometry) mesh.geometry.dispose();
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
  display: none;
  pointer-events: none;
}

canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>