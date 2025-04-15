// vocalRemoverPlugin.ts
import Player from 'xgplayer';
import { BasicInversionStrategy } from './vocalRemoveStrategy/BasicInversionStrategy';
// import { UvrOnnxStrategy } from './vocalRemoveStrategy/UvrOnnxStrategy';

// 策略接口
interface VocalRemovalStrategy {
  process(player: Player): Promise<void>;
  cleanup(): void;
}

// 抽象基类
export abstract class BaseStrategy implements VocalRemovalStrategy {
  protected btn?: HTMLDivElement;
  protected mediaElement?: HTMLMediaElement;
  protected originalSrc?: string;
  protected isProcessing = false;
  protected isRemoved = false;
  protected player?: Player;

  async process(player: Player) {
    this.player = player;
    this.mediaElement = player.video as HTMLMediaElement;
    if (!this.mediaElement) return;

    this.originalSrc = this.mediaElement.src;
    this.createButton();
  }

  cleanup() {
    // 移除按钮及事件
    if (this.btn) {
      this.btn.onclick = null;
      this.btn.remove();
      this.btn = undefined;
    }
    
    // 恢复原始音源
    if (this.mediaElement && this.originalSrc) {
      this.mediaElement.src = this.originalSrc;
    }
    
    // 重置状态
    this.isProcessing = false;
    this.isRemoved = false;
    
    // 其他资源清理
    this.additionalCleanup();
  }

  protected abstract additionalCleanup(): void;
  protected abstract performRemoval(): Promise<void>;
  protected abstract performRestore(): Promise<void>;
  protected abstract getButtonLabel(): string;

  protected createButton() {
    // 移除已存在的按钮
    const existingBtn = this.player?.root?.querySelector('.vocal-remover-btn');
    existingBtn?.remove();

    this.btn = document.createElement('div');
    this.btn.className = 'xgplayer-icon vocal-remover-btn';
    this.updateButtonText();
    Object.assign(this.btn.style, {
      cursor: 'pointer',
      fontSize: '14px',
      padding: '0 6px',
      color: '#fff',
      display: 'flex',
      alignItems: 'center'
    });

    this.btn.onclick = async () => {
        if (this.isProcessing) {
            //console.log('正在处理中，请等待...');
            return;
        }

        //console.log('开始处理:', this.isRemoved ? '恢复原音' : '去除人声');
        //console.log('当前音频源:', this.mediaElement?.src);
        //console.log('原始音频源:', this.originalSrc);
        
        this.isProcessing = true;
        try {
            if (this.isRemoved) {
                await this.performRestore();
                //console.log('已恢复原音');
                //console.log('恢复后音频源:', this.mediaElement?.src);
            } else {
                await this.performRemoval();
                //console.log('已完成人声处理');
                //console.log('处理后音频源:', this.mediaElement?.src);
            }
            this.isRemoved = !this.isRemoved;
        } catch (err) {
            console.error('处理失败:', err);
            console.error('错误详情:', {
                mediaElement: !!this.mediaElement,
                originalSrc: !!this.originalSrc,
                currentSrc: this.mediaElement?.src,
                error: err
            });
        } finally {
            this.isProcessing = false;
            this.updateButtonText();
        }
    };

    this.player?.root?.querySelector('.xg-inner-controls')?.appendChild(this.btn);
  }

  protected updateButtonText() {
    if (!this.btn) return;
    this.btn.innerHTML = this.isProcessing 
      ? '<span class="spinner"></span> 处理中...'
      : this.getButtonLabel();
  }
}

export class VocalRemoverPlugin {
    private currentStrategy?: VocalRemovalStrategy;
    private strategyInitializers = {
      basic: async () => new BasicInversionStrategy(),
     // onnx: async () => new UvrOnnxStrategy()
    //   uvr: async () => new UVRStrategy(),
    //   spleeterWasm: async () => new SpleeterWasmStrategy()
    };
  
    constructor(private player: Player) {
        // 只监听 URL 变化事件
        player.on('url_change', () => {
            //console.log('URL变化，准备重新初始化策略');
            this.handleUrlChange();
        });
    }
  
    private handleUrlChange() {
      // 保留当前策略但重置状态
      if (this.currentStrategy) {
        this.currentStrategy.cleanup();
        this.currentStrategy.process(this.player);
      }
    }
  
    async applyStrategy(strategy: keyof typeof this.strategyInitializers = 'basic') {
        //console.log('开始应用策略:', strategy);
        
        // 清理当前策略
        if (this.currentStrategy) {
          //console.log('清理现有策略');
          this.currentStrategy.cleanup();
        }
        
        try {
          //this.showLoading();
          
          //console.log('初始化新策略');
          const initializer = this.strategyInitializers[strategy];
          this.currentStrategy = await initializer();
          
          //console.log('处理播放器');
          await this.currentStrategy.process(this.player);
          console.log('策略应用完成');
        } catch (err) {
          console.error(`策略 ${strategy} 应用失败:`, err);
        // 回退到基础策略
        this.currentStrategy = await this.strategyInitializers.basic();
        await this.currentStrategy.process(this.player);
      } finally {
        // 隐藏加载状态
        this.hideLoading();
      }
    }
  
    private showLoading() {
      const loading = document.createElement('div');
      loading.className = 'vocal-remover-loading';
      loading.innerHTML = '加载中...';
      Object.assign(loading.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        zIndex: '1000'
      });
      this.player.root?.appendChild(loading);
      setTimeout(() => loading.remove(), 3000); // 超时移除
    }
  
    private hideLoading() {
      const loading = this.player.root?.querySelector('.vocal-remover-loading');
      loading?.remove();
    }
  
    cleanup() {
      this.currentStrategy?.cleanup();
    }
  }
  
  export function useVocalRemover(player: Player, strategy: keyof VocalRemoverPlugin['strategyInitializers'] = 'basic') {
    const plugin = new VocalRemoverPlugin(player);
    plugin.applyStrategy(strategy);
    
    // 返回清理函数和策略切换方法
    return {
      cleanup: () => plugin.cleanup(),
      changeStrategy: (newStrategy: keyof VocalRemoverPlugin['strategyInitializers']) => 
        plugin.applyStrategy(newStrategy)
    };
  }