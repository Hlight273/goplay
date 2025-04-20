import * as THREE from 'three';
import { Song } from '@/interface/song';
import { Share } from '@/interface/share';
import { formatDate } from '@/util/commonUtil';

export class MusicCardRenderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  card: THREE.Group;
  cardFront!: THREE.Mesh;
  cardBack!: THREE.Mesh;
  cardEdges: THREE.Mesh[] = [];
  animationFrameId: number = 0;
  frontLight!: THREE.DirectionalLight;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    this.camera.position.z = 600;

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.addLights();
    this.card = new THREE.Group();
    this.scene.add(this.card);
  }

  private addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // 新增：正面平行光
    this.frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.frontLight.position.set(0, 0, 1);
    this.scene.add(this.frontLight);

    const pointLight = new THREE.PointLight(0xff5555, 1, 1000);
    pointLight.position.set(0, 0, 200);
    this.scene.add(pointLight);
  }

  public setFrontLight(options: {
    intensity?: number;
    color?: number | string;
    position?: { x?: number; y?: number; z?: number };
  }) {
    if (options.intensity !== undefined) {
      this.frontLight.intensity = options.intensity;
    }
    if (options.color !== undefined) {
      this.frontLight.color.set(options.color);
    }
    if (options.position) {
      const { x, y, z } = options.position;
      if (x !== undefined) this.frontLight.position.x = x;
      if (y !== undefined) this.frontLight.position.y = y;
      if (z !== undefined) this.frontLight.position.z = z;
    }
  }

  public async createCard(songDetails: Song.SongContent, share: Share.MusicShareMessage) {
    // 清除现有的卡片内容
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

    const cardWidth = 300;
    const cardHeight = 400;
    const cardDepth = 8;

    const frontTexture = await this.createFrontTexture(songDetails, share);
    const frontGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      roughness: 0.3,
      metalness: 0.7,
      emissive: new THREE.Color(0x222222),
      emissiveIntensity: 0.2,
    });

    this.cardFront = new THREE.Mesh(frontGeometry, frontMaterial);
    this.cardFront.position.z = 0;
    this.card.add(this.cardFront);

    const backTexture = await this.createBackTexture();
    const backGeometry = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.3,
      metalness: 0.7,
      emissive: new THREE.Color(0x222222),
      emissiveIntensity: 0.2,
    });

    this.cardBack = new THREE.Mesh(backGeometry, backMaterial);
    this.cardBack.position.z = -cardDepth;
    this.cardBack.rotation.y = Math.PI;
    this.card.add(this.cardBack);

    this.cardEdges = this.createCardEdges(cardWidth, cardHeight, cardDepth);
    this.cardEdges.forEach(edge => this.card.add(edge));
  }

  private createCardEdges(width: number, height: number, depth: number): THREE.Mesh[] {
    const edges: THREE.Mesh[] = [];
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.3,
      metalness: 0.8,
      emissive: new THREE.Color(0x222222),
      emissiveIntensity: 0.1,
    });
    
    const topEdgeGeometry = new THREE.BoxGeometry(width, depth, depth);
    const topEdge = new THREE.Mesh(topEdgeGeometry, edgeMaterial);
    topEdge.position.set(0, height/2 + depth/2, -depth/2);
    edges.push(topEdge);
    
    const bottomEdgeGeometry = new THREE.BoxGeometry(width, depth, depth);
    const bottomEdge = new THREE.Mesh(bottomEdgeGeometry, edgeMaterial);
    bottomEdge.position.set(0, -height/2 - depth/2, -depth/2);
    edges.push(bottomEdge);
    
    const leftEdgeGeometry = new THREE.BoxGeometry(depth, height + depth*2, depth);
    const leftEdge = new THREE.Mesh(leftEdgeGeometry, edgeMaterial);
    leftEdge.position.set(-width/2 - depth/2, 0, -depth/2);
    edges.push(leftEdge);
    
    const rightEdgeGeometry = new THREE.BoxGeometry(depth, height + depth*2, depth);
    const rightEdge = new THREE.Mesh(rightEdgeGeometry, edgeMaterial);
    rightEdge.position.set(width/2 + depth/2, 0, -depth/2);
    edges.push(rightEdge);
    
    return edges;
  }

  private async createFrontTexture(song: Song.SongContent, share: Share.MusicShareMessage): Promise<THREE.Texture> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#2a2a2a');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const coverImg = new Image();
      coverImg.crossOrigin = 'anonymous';
      coverImg.onload = () => {
        const coverSize = 400;
        const coverX = (canvas.width - coverSize) / 2;
        const coverY = 80;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(coverX - 5, coverY - 5, coverSize + 10, coverSize + 10);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.drawImage(coverImg, coverX, coverY, coverSize, coverSize);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(song.songInfo?.songName || '加载中...', canvas.width / 2, coverY + coverSize + 50);
        
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '24px Arial';
        ctx.fillText(song.songInfo?.songArtist || '请稍候', canvas.width / 2, coverY + coverSize + 90);
        
        ctx.fillStyle = '#dddddd';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`分享者: ${share.senderName || '用户' + share.senderId}`, 50, coverY + coverSize + 140);
        ctx.fillText(`分享时间: ${formatDate(share.shareTime)}`, 50, coverY + coverSize + 170);
        
        if (share.contentText) {
          ctx.fillStyle = '#cccccc';
          ctx.font = 'italic 22px Arial';
          
          const maxWidth = canvas.width - 100;
          const words = share.contentText.split('');
          let line = '';
          let y = coverY + coverSize + 220;
          
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
              ctx.fillText(line, 50, y);
              line = words[i];
              y += 30;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, 50, y);
        }
        
        ctx.strokeStyle = '#ff7272';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(50, 50);
        ctx.lineTo(canvas.width - 50, 50);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(50, canvas.height - 50);
        ctx.lineTo(canvas.width - 50, canvas.height - 50);
        ctx.stroke();
        
        const texture = new THREE.CanvasTexture(canvas);
        resolve(texture);
      };
      
      coverImg.onerror = () => {
        const texture = new THREE.CanvasTexture(canvas);
        resolve(texture);
      };
      
      coverImg.src = this.getSongCover(song);
    });
  }

  private async createBackTexture(): Promise<THREE.Texture> {
    const textureLoader = new THREE.TextureLoader();
    return new Promise<THREE.Texture>((resolve) => {
      textureLoader.load(require('@/assets/imgs/card_back.png'), (texture) => {
        resolve(texture);
      }, undefined, () => {
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

  private getSongCover(song: Song.SongContent | undefined): string {
    if (!song) return require('@/assets/icons/default_album.png');
    return song.coverBase64 
      ? `data:image/png;base64,${song.coverBase64}` 
      : require('@/assets/icons/default_album.png');
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    
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
    
    this.renderer.dispose();
  }
}