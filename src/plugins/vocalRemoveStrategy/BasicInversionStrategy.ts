import { BaseStrategy } from './BaseStrategy';

// BasicInversionStrategy.ts
export class BasicInversionStrategy extends BaseStrategy {
    private audioCtx?: AudioContext;
    private splitter?: ChannelSplitterNode;
    private inverter?: GainNode;
    private merger?: ChannelMergerNode;
    private source?: MediaElementAudioSourceNode;
    private gainNodes?: GainNode[];
  
    protected async performRemoval() {
        if (!this.mediaElement) return;
        
        this.cleanupNodes();
        
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
            this.audioCtx = new AudioContext();
            this.source = this.audioCtx.createMediaElementSource(this.mediaElement);
        }
        
        const channelCount = this.source?.channelCount;
        if (channelCount !== 2) {
            throw new Error('需要立体声音频(2声道)，当前声道数: ' + channelCount);
        }
        
        // 创建音频处理节点
        this.splitter = this.audioCtx.createChannelSplitter(2);
        this.merger = this.audioCtx.createChannelMerger(2);
        
        // 创建更多的处理节点
        const leftGain = this.audioCtx.createGain();
        const rightGain = this.audioCtx.createGain();
        const centerReducer = this.audioCtx.createGain();
        const leftDelay = this.audioCtx.createDelay();
        const rightDelay = this.audioCtx.createDelay();
        
        // 保存节点引用以便清理
        this.gainNodes = [leftGain, rightGain, centerReducer];
        
        // 设置参数
        leftGain.gain.value = 0.5;  // 左声道增益
        rightGain.gain.value = 0.5; // 右声道增益
        centerReducer.gain.value = -0.6; // 中置声道抵消强度
        leftDelay.delayTime.value = 0.002; // 2ms延迟
        rightDelay.delayTime.value = 0.002; // 2ms延迟
        
        // 建立连接
        this.source?.disconnect();
        this.source?.connect(this.splitter);
        
        // 左声道处理链
        this.splitter.connect(leftGain, 0);
        leftGain.connect(leftDelay);
        leftDelay.connect(this.merger, 0, 0);
        
        // 右声道处理链
        this.splitter.connect(rightGain, 1);
        rightGain.connect(rightDelay);
        rightDelay.connect(this.merger, 0, 1);
        
        // 中置声道抵消
        this.splitter.connect(centerReducer, 0);
        this.splitter.connect(centerReducer, 1);
        centerReducer.connect(this.merger, 0, 0);
        centerReducer.connect(this.merger, 0, 1);
        
        // 连接到输出
        this.merger.connect(this.audioCtx.destination);
    }
      
    protected async performRestore() {
        if (!this.audioCtx || !this.source) return;
      
        try {
            // 断开所有连接
            this.cleanupNodes();
            
            // 重新建立直接连接
            this.source.connect(this.audioCtx.destination);
        } catch (error) {
            console.warn('恢复原始连接时出错', error);
        }
    }

    private cleanupNodes() {
        try {
            // 按照依赖顺序断开连接
            this.merger?.disconnect();
            this.gainNodes?.forEach(node => node.disconnect());
            this.splitter?.disconnect();
            this.source?.disconnect();
            
            // 清空节点引用
            this.splitter = undefined;
            this.merger = undefined;
            this.gainNodes = undefined;
        } catch (error) {
            console.warn('清理节点时出错', error);
        }
    }

    protected additionalCleanup() {
        try {
            this.cleanupNodes();
            this.audioCtx?.close();
            this.audioCtx = undefined;
            this.source = undefined;
        } catch (error) {
            console.warn('清理资源时出错', error);
        }
    }
  
    protected getButtonLabel(): string {
      return this.isRemoved ? '🎶原音(基础)' : '🎙️去人声(基础)';
    }
  
   

   
  }