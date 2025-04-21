import * as THREE from 'three';
import { Song } from '@/interface/song';
import { Share } from '@/interface/share';
import { formatDate } from '@/util/commonUtil';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * 音乐卡片渲染器 - 负责创建和渲染3D音乐卡片
 */
export class MusicCardRenderer {
  // 场景相关属性
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number = 0;
  private clock: THREE.Clock;
  
  // 卡片相关属性
  private card: THREE.Group;
  private cardFront!: THREE.Mesh;
  private cardBack!: THREE.Mesh;
  private cardEdges: THREE.Mesh[] = [];
  
  // 光照相关属性
  private frontLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private hemisphereLight!: THREE.HemisphereLight;
  private pointLight!: THREE.PointLight;
  
  // 粒子特效相关属性
  private particles: THREE.Points[] = [];
  
  // 卡片尺寸配置
  private readonly cardConfig = {
    width: 266.6,
    height: 400,
    depth: 8,
    cornerRadius: 140
  };

  /**
   * 构造函数
   * @param canvas 渲染目标Canvas元素
   * @param width 渲染宽度
   * @param height 渲染高度
   */
  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // 初始化场景
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    this.camera.position.z = 600;
    this.clock = new THREE.Clock();

    // 初始化渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // 初始化卡片组
    this.card = new THREE.Group();
    this.scene.add(this.card);
    
    // 添加光照
    this.setupLights();
  }

  /**
   * 设置场景光照
   */
  private setupLights(): void {
    // 环境光
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // 正面平行光
    this.frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.frontLight.position.set(0, 0, 1);
    this.scene.add(this.frontLight);
    
    // 半球光 - 提供柔和的环境光照
    this.hemisphereLight = new THREE.HemisphereLight(
      0xffffff, // 天空色
      0x444444, // 地面色
      0.8       // 强度
    );
    this.hemisphereLight.position.set(0, 0, 1);
    this.scene.add(this.hemisphereLight);

    // 点光源 - 提供红色调的点光源
    this.pointLight = new THREE.PointLight(0xff5555, 1, 1000);
    this.pointLight.position.set(0, 0, 200);
    this.scene.add(this.pointLight);
  }

  /**
   * 设置前光源参数
   * @param options 光源配置选项
   */
  public setFrontLight(options: { 
    intensity?: number; 
    color?: number; 
    position?: { x: number; y: number; z: number } 
  }): void {
    if (options.intensity !== undefined) {
      this.frontLight.intensity = options.intensity;
    }
    
    if (options.color !== undefined) {
      this.frontLight.color.set(options.color);
    }
    
    if (options.position) {
      this.frontLight.position.set(
        options.position.x,
        options.position.y,
        options.position.z
      );
    }
  }

  /**
   * 创建音乐卡片
   * @param songDetails 歌曲详情
   * @param share 分享信息
   */
public async createCard(songDetails: Song.SongContent, share: Share.MusicShareMessage): Promise<void> {
  // 保存当前的旋转状态
  const currentRotation = this.card.rotation.clone();
  const currentPosition = this.card.position.clone();
  const currentScale = this.card.scale.clone();
  
  // 清除现有卡片内容
  this.clearCard();
  
  // 创建卡片正面
  await this.createCardFront(songDetails, share);
  
  // 创建卡片背面
  await this.createCardBack();
  
  // 恢复旋转、位置和缩放状态
  this.card.rotation.copy(currentRotation);
  this.card.position.copy(currentPosition);
  this.card.scale.copy(currentScale);
  
  // 添加粒子特效
  //this.createParticleEffects();
}

  /**
   * 清除现有卡片内容并释放资源
   */
  private clearCard(): void {
    // 清除卡片子元素
    while(this.card.children.length > 0) {
      const child = this.card.children[0];
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
      this.card.remove(child);
    }
    
    // 清除粒子特效
    this.clearParticles();
  }

  /**
   * 清除粒子特效并释放资源
   */
  private clearParticles(): void {
    this.particles.forEach(particle => {
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) {
        if (Array.isArray(particle.material)) {
          particle.material.forEach(material => material.dispose());
        } else {
          particle.material.dispose();
        }
      }
      // 从父对象中移除粒子
      if (particle.parent) {
        particle.parent.remove(particle);
      } else {
        this.scene.remove(particle);
      }
    });
    this.particles = [];
  }

  /**
   * 创建卡片正面
   * @param songDetails 歌曲详情
   * @param share 分享信息
   */
  private async createCardFront(songDetails: Song.SongContent, share: Share.MusicShareMessage): Promise<void> {
    const frontTexture = await this.createFrontTexture(songDetails, share);
    const frontGeometry = new RoundedBoxGeometry(
      this.cardConfig.width, 
      this.cardConfig.height, 
      this.cardConfig.depth, 
      8, 
      this.cardConfig.cornerRadius
    );
    
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      roughness: 0.2,
      metalness: 0.2,
      emissive: new THREE.Color(0x222222),
      emissiveIntensity: 0.5,
    });

    this.cardFront = new THREE.Mesh(frontGeometry, frontMaterial);
    this.cardFront.position.z = 0;
    this.card.add(this.cardFront);
  }

  /**
   * 创建卡片背面
   */
  private async createCardBack(): Promise<void> {
    const backTexture = await this.createBackTexture();
    const backGeometry = new RoundedBoxGeometry(
      this.cardConfig.width, 
      this.cardConfig.height, 
      this.cardConfig.depth, 
      8, 
      this.cardConfig.cornerRadius
    );
    
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.3,
      metalness: 0.7,
      emissive: new THREE.Color(0x222222),
      emissiveIntensity: 0.2,
    });

    this.cardBack = new THREE.Mesh(backGeometry, backMaterial);
    this.cardBack.position.z = -this.cardConfig.depth;
    this.cardBack.rotation.y = Math.PI;
    this.card.add(this.cardBack);
  }

  /**
   * 创建粒子特效
   */
  private createParticleEffects(): void {
    // 创建左侧粒子
    this.createSideParticles('left');
    // 创建右侧粒子
    this.createSideParticles('right');
  }

  /**
   * 创建卡片侧边粒子
   * @param side 侧边位置 ('left' | 'right')
   */
  private createSideParticles(side: 'left' | 'right'): void {
    const particleCount = 100; // 增加粒子数量
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    
    // 调整粒子位置，使其更靠近卡片且在相机视野内
    const xPos = side === 'left' 
      ? -this.cardConfig.width / 2 - 5 
      : this.cardConfig.width / 2 + 5;
    
    for (let i = 0; i < particleCount; i++) {
      // 位置 - 确保粒子在相机视野范围内
      positions[i * 3] = xPos + (Math.random() - 0.5) * 10; // x - 减小水平分散范围
      positions[i * 3 + 1] = (Math.random() - 0.5) * this.cardConfig.height * 1.5; // y - 增加垂直分布范围
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30; // z - 减小深度范围，确保在相机视野内
      
      // 增大粒子尺寸，使其更容易被看到
      sizes[i] = Math.random() * 5 + 2;
      
      // 增强颜色亮度
      colors[i * 3] = 1; // R
      colors[i * 3 + 1] = Math.random() * 0.7 + 0.3; // G - 增加绿色分量
      colors[i * 3 + 2] = Math.random() * 0.3; // B
      
      // 增加透明度
      opacities[i] = Math.random() * 0.7 + 0.3;
      
      // 调整上升速度
      speeds[i] = Math.random() * 20 + 10;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    particleGeometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    
    // 创建着色器材质
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: this.createParticleTexture() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float opacity;
        attribute float speed;
        uniform float time;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          
          // 计算上升的位置
          vec3 newPosition = position;
          newPosition.y = mod(position.y + speed * time, 200.0) - 100.0;
          
          vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          // 使用纹理的alpha通道和自定义透明度
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          if (texColor.a < 0.1) discard; // 丢弃几乎透明的像素
          gl_FragColor = vec4(vColor, vOpacity * texColor.a);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false, // 修改为false，避免深度写入问题
      depthTest: true,   // 保持深度测试
      transparent: true
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    // 将粒子添加到卡片组而不是场景，这样它们会跟随卡片一起移动
    this.card.add(particles);
    this.particles.push(particles);
  }

  /**
   * 创建粒子纹理
   * @returns 粒子纹理
   */
  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64; // 增加纹理分辨率
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d')!;
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 创建更明显的径向渐变
    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    
    // 调整渐变颜色，使粒子更明显
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 200, 150, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; // 确保纹理更新
    return texture;
  }

  /**
   * 创建卡片正面纹理
   * @param song 歌曲信息
   * @param share 分享信息
   * @returns 纹理对象
   */
  private async createFrontTexture(song: Song.SongContent, share: Share.MusicShareMessage): Promise<THREE.Texture> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 533.33;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;
      
      // 绘制深色背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(1, '#0a0a0a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 加载卡牌边框图片
      const borderImg = new Image();
      borderImg.crossOrigin = 'anonymous';
      borderImg.onload = () => {
        // 绘制卡牌边框
        ctx.drawImage(borderImg, 0, 0, canvas.width, canvas.height);
        
        // 绘制歌曲封面
        const coverImg = new Image();
        coverImg.crossOrigin = 'anonymous';
        coverImg.onload = () => {
          this.drawCardContent(ctx, canvas, coverImg, song, share);
          const texture = new THREE.CanvasTexture(canvas);
          resolve(texture);
        };
        
        coverImg.onerror = () => {
          this.drawCardContent(ctx, canvas, null, song, share);
          const texture = new THREE.CanvasTexture(canvas);
          resolve(texture);
        };
        
        coverImg.src = this.getSongCover(song);
      };
      
      borderImg.onerror = () => {
        // 如果边框图片加载失败，使用默认样式
        this.drawDefaultCardStyle(ctx, canvas.width, canvas.height, song, share);
        const texture = new THREE.CanvasTexture(canvas);
        resolve(texture);
      };
      
      // 加载卡牌边框图片
      borderImg.src = require('@/assets/imgs/card_front.png');
    });
  }

  /**
   * 绘制卡片内容
   * @param ctx Canvas上下文
   * @param canvas Canvas元素
   * @param coverImg 封面图片
   * @param song 歌曲信息
   * @param share 分享信息
   */
  private drawCardContent(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    coverImg: HTMLImageElement | null, 
    song: Song.SongContent, 
    share: Share.MusicShareMessage
  ): void {
    // 中央区域的尺寸和位置
    const centerAreaWidth = canvas.width * 0.535;
    const centerAreaHeight = canvas.width * 0.535;
    const centerX = (canvas.width - centerAreaWidth) / 2;
    const centerY = canvas.height * 0.19;
    
    // 绘制封面图片到中央区域
    if (coverImg) {
      ctx.save();
      // 创建圆角矩形路径
      this.roundRect(ctx, centerX, centerY, centerAreaWidth, centerAreaHeight, 30);
      ctx.clip();
      ctx.drawImage(coverImg, centerX, centerY, centerAreaWidth, centerAreaHeight);
      ctx.restore();
    } else {
      // 如果封面加载失败，绘制默认封面
      ctx.save();
      this.roundRect(ctx, centerX, centerY, centerAreaWidth, centerAreaHeight, 30);
      ctx.clip();
      ctx.fillStyle = '#333333';
      ctx.fillRect(centerX, centerY, centerAreaWidth, centerAreaHeight);
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No Cover', centerX + centerAreaWidth/2, centerY + centerAreaHeight/2);
      ctx.restore();
    }
    
    // 绘制歌曲信息区域
    const infoAreaY = centerY + centerAreaHeight + 40;
    const infoAreaHeight = 60;
    
    // 绘制歌曲名称和艺术家
    ctx.fillStyle = '#cccccc';
    ctx.font = 'normal 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(song.songInfo?.songName+" - "+song.songInfo?.songArtist || '加载中...', canvas.width / 2, infoAreaY + 35);
    
    // 绘制分享信息
    const shareInfoY = infoAreaY + infoAreaHeight + 40;
    
    // 绘制分享者和时间
    ctx.fillStyle = '#999999';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${share.senderName || '用户' + share.senderId} - ${formatDate(share.shareTime)} - 分享`, canvas.width / 2, shareInfoY + 5);
    //console.log("texttttttttt",share.contentText);
    // 绘制分享内容
    if (share.contentText) {
      
      
      this.drawShareText(ctx, canvas.width, shareInfoY + 90, share.contentText);
    }
  }

  /**
   * 绘制分享文本
   * @param ctx Canvas上下文
   * @param canvasWidth Canvas宽度
   * @param startY 起始Y坐标
   * @param text 文本内容
   */
  private drawShareText(
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    startY: number, 
    text: string
  ): void {
    ctx.fillStyle = '#888888';
    ctx.font = 'italic 16px Arial';
    
    const maxWidth = canvasWidth * 0.8;
    const words = text.split('');
    let line = '';
    let y = startY;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(line, canvasWidth / 2, y);
        line = words[i];
        y += 24;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvasWidth / 2, y);
  }
  
  /**
   * 绘制圆角矩形
   * @param ctx Canvas上下文
   * @param x X坐标
   * @param y Y坐标
   * @param width 宽度
   * @param height 高度
   * @param radius 圆角半径
   */
  private roundRect(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  /**
   * 绘制默认卡牌样式
   * @param ctx Canvas上下文
   * @param width 宽度
   * @param height 高度
   * @param song 歌曲信息
   * @param share 分享信息
   */
  private drawDefaultCardStyle(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    song: Song.SongContent, 
    share: Share.MusicShareMessage
  ): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制边框
    ctx.strokeStyle = '#ff7272';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 20, 20, width - 40, height - 40, 15);
    ctx.stroke();
    
    // 绘制内部区域
    ctx.strokeStyle = '#884444';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 40, 40, width - 80, height - 80, 10);
    ctx.stroke();
    
    // 添加装饰线
    ctx.strokeStyle = '#ff7272';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(width - 50, 50);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(50, height - 50);
    ctx.lineTo(width - 50, height - 50);
    ctx.stroke();
    
    // 绘制卡片内容
    const coverImg = new Image();
    coverImg.onload = () => {
      this.drawCardContent(ctx, { width, height } as HTMLCanvasElement, coverImg, song, share);
    };
    coverImg.onerror = () => {
      this.drawCardContent(ctx, { width, height } as HTMLCanvasElement, null, song, share);
    };
    coverImg.src = this.getSongCover(song);
  }

  /**
   * 创建卡片背面纹理
   * @returns 纹理对象
   */
  private async createBackTexture(): Promise<THREE.Texture> {
    const textureLoader = new THREE.TextureLoader();
    return new Promise<THREE.Texture>((resolve) => {
      textureLoader.load(require('@/assets/imgs/card_back.png'), (texture) => {
        resolve(texture);
      }, undefined, () => {
        // 加载失败时创建默认背面纹理
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 800;
        const ctx = canvas.getContext('2d')!;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#333333');
        gradient.addColorStop(1, '#111111');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 5;
        
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, 50 + i * 30, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.fillStyle = '#ff7272';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("Let's Goplay", canvas.width / 2, canvas.height / 2);
        
        const defaultTexture = new THREE.CanvasTexture(canvas);
        resolve(defaultTexture);
      });
    });
  }

  /**
   * 获取歌曲封面URL
   * @param song 歌曲信息
   * @returns 封面URL
   */
  private getSongCover(song: Song.SongContent | undefined): string {
    if (!song) return require('@/assets/icons/default_album.png');
    return song.coverBase64 
      ? `data:image/png;base64,${song.coverBase64}` 
      : require('@/assets/icons/default_album.png');
  }

  /**
   * 渲染场景
   */
  public render(): void {
    // 更新粒子动画
    const elapsedTime = this.clock.getElapsedTime();
    this.particles.forEach(particle => {
      if (particle.material instanceof THREE.ShaderMaterial) {
        particle.material.uniforms.time.value = elapsedTime;
        // 确保材质更新
        particle.material.needsUpdate = true;
      }
    });
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 调整渲染器大小
   * @param width 宽度
   * @param height 高度
   */
  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    
    // 清理卡片资源
    if (this.cardFront) {
      this.cardFront.geometry.dispose();
      if (Array.isArray(this.cardFront.material)) {
        this.cardFront.material.forEach(material => material.dispose());
      } else {
        this.cardFront.material.dispose();
      }
    }
    
    if (this.cardBack) {
      this.cardBack.geometry.dispose();
      if (Array.isArray(this.cardBack.material)) {
        this.cardBack.material.forEach(material => material.dispose());
      } else {
        this.cardBack.material.dispose();
      }
    }
    
    this.cardEdges.forEach(edge => {
      edge.geometry.dispose();
      if (Array.isArray(edge.material)) {
        edge.material.forEach(material => material.dispose());
      } else {
        edge.material.dispose();
      }
    });
    
    // 清理粒子资源
    this.clearParticles();
    
    // 清理渲染器
    this.renderer.dispose();
  }

  /**
   * 让卡片原地旋转一圈
   * @param duration 动画持续时间(毫秒)
   * @returns Promise，动画完成时解决
   */
  public spinCard(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startRotation = this.card.rotation.y;
      const targetRotation = startRotation + Math.PI * 2;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数使动画更流畅
        const easeProgress = this.easeInOutQuart(progress);
        
        this.card.rotation.y = startRotation + (targetRotation - startRotation) * easeProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 确保最终旋转角度正确
          this.card.rotation.y = startRotation;
          resolve();
        }
      };
      
      animate();
    });
  }
    /**
   * 四次方缓动函数
   * @param x 进度值 (0-1)
   * @returns 缓动后的值
   */
  private easeInOutQuart(x: number): number {
    return x < 0.5 
      ? 8 * x * x * x * x 
      : 1 - Math.pow(-2 * x + 2, 4) / 2;
  }

  /**
   * 获取卡片旋转Y值
   */
  public getCardRotationY(): number {
    return this.card.rotation.y;
  }

  /**
   * 设置卡片旋转Y值
   */
  public setCardRotationY(y: number): void {
    this.card.rotation.y = y;
  }

  /**
   * 设置卡片旋转X值
   */
  public setCardRotationX(x: number): void {
    this.card.rotation.x = x;
  }

  /**
   * 设置卡片位置Y值
   */
  public setCardPositionY(y: number): void {
    this.card.position.y = y;
  }

  /**
   * 设置卡片缩放
   */
  public setCardScale(x: number, y: number, z: number): void {
    this.card.scale.set(x, y, z);
  }
}