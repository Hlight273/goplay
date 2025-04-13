import Player from 'xgplayer';

export interface VocalRemovalStrategy {
  process(player: Player): Promise<void>;
  cleanup(): void;
}

export abstract class BaseStrategy implements VocalRemovalStrategy {
  protected btn?: HTMLDivElement;
  protected mediaElement?: HTMLMediaElement;
  protected originalSrc?: string;
  protected isProcessing = false;
  protected isRemoved = false;
  protected player?: Player;

  async process(player: Player) {
    console.log('初始化策略:', this.constructor.name);
    this.player = player;
    this.mediaElement = player.video as HTMLMediaElement;
    
    if (!this.mediaElement) {
        console.error('未找到媒体元素');
        return;
    }

    // 等待音频加载完成
    if (this.mediaElement.readyState < 2) {
        console.log('等待音频加载...');
        await new Promise(resolve => {
            this.mediaElement?.addEventListener('loadeddata', resolve, { once: true });
        });
    }

    console.log('当前音频源:', this.mediaElement.src);
    this.originalSrc = this.mediaElement.src;
    this.createButton();
}

  cleanup() {
    if (this.btn) {
      this.btn.onclick = null;
      this.btn.remove();
      this.btn = undefined;
    }
    if (this.mediaElement && this.originalSrc) {
      this.mediaElement.src = this.originalSrc;
    }
    this.isProcessing = false;
    this.isRemoved = false;
    this.additionalCleanup();
  }

  protected abstract additionalCleanup(): void;
  protected abstract performRemoval(): Promise<void>;
  protected abstract performRestore(): Promise<void>;
  protected abstract getButtonLabel(): string;

  protected createButton() {
    const existingBtn = this.player?.root?.querySelector('.vocal-remover-btn');
    existingBtn?.remove();

    this.btn = document.createElement('div');
    this.btn.className = 'xgplayer-icon vocal-remover-btn';
    this.updateButtonText();
    
    // 添加新的样式
    Object.assign(this.btn.style, {
      cursor: 'pointer',
      color: 'rgb(255, 255, 255)',
      display: 'flex',
      alignItems: 'center',
      background: 'linear-gradient(45deg, rgb(33, 150, 243), rgb(76, 175, 80))',
      borderRadius: '20px',
      margin: '0px 8px',
      boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 5px',
      userSelect: 'none',
      width: '10px',
      height: '10px',
      padding: '2px',
      transform: 'translateY(0px)',
      position: 'relative',
      top: '14px',
      left: '14px'
  });

    // 添加悬停效果

    this.btn.onmouseover = () => {
      Object.assign(this.btn!.style, {
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        background: 'linear-gradient(45deg, #1976D2, #388E3C)'
      });
    };

    this.btn.onmouseout = () => {
      Object.assign(this.btn!.style, {
        transform: 'translateY(0)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        background: 'linear-gradient(45deg, #2196F3, #4CAF50)'
      });
    };

    this.btn.onclick = async () => {
      if (this.isProcessing) {
        //console.log('正在处理中，请等待...');
        return;
      }

      //console.log('开始处理:', this.isRemoved ? '恢复原音' : '去除人声');
      this.isProcessing = true;
      try {
        if (this.isRemoved) {
          await this.performRestore();
          //console.log('已恢复原音');
        } else {
          await this.performRemoval();
          //console.log('已完成人声处理');
        }
        this.isRemoved = !this.isRemoved;
      } catch (err) {
        //console.error('处理失败:', err);
      } finally {
        this.isProcessing = false;
        this.updateButtonText();
      }
    };

    this.player?.root?.querySelector('.xg-inner-controls')?.appendChild(this.btn);
  }

  protected updateButtonText() {
    if (!this.btn) return;
    
    if (this.isProcessing) {
        this.btn.innerHTML = `
            <div class="spinner" style="
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-top: 2px solid transparent;
                border-radius: 50%;
                margin-right: 8px;
                animation: spin 1s linear infinite;
            "></div>
            处理中...
        `;
        // 添加旋转动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    } else {
        const icon = this.isRemoved ? '●' : '○';
        const text = this.isRemoved ? '' : '';
        this.btn.innerHTML = `
            <span style="margin-right: 6px; font-size: 16px;">${icon}</span>
            <span>${text}</span>
        `;
    }
}
}