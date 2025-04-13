// import { BaseStrategy } from './BaseStrategy';
// import * as ort from 'onnxruntime-web';

// export class UvrOnnxStrategy extends BaseStrategy {
//   private session?: ort.InferenceSession;
//   private processedBlobUrl?: string;

//   protected getButtonLabel(): string {
//     return this.isRemoved ? '🎶原音(ONNX)' : '🎙️去人声(ONNX)';
//   }

//   protected async additionalCleanup() {
//     if (this.processedBlobUrl) {
//       URL.revokeObjectURL(this.processedBlobUrl);
//       this.processedBlobUrl = undefined;
//     }
//     this.session = undefined;
//   }

//   protected async performRemoval() {
//     if (!this.mediaElement || !this.originalSrc) {
//         console.error('缺少必要的媒体元素或源文件:', {
//             mediaElement: !!this.mediaElement,
//             originalSrc: this.originalSrc
//         });
//         return;
//     }

//     try {
//         console.log('开始加载 ONNX 模型...');
//         if (!this.session) {
//             this.session = await ort.InferenceSession.create('/aiModel/demucs.onnx');
//         }
//         console.log('ONNX 模型加载成功');

//         console.log('开始处理音频...');
//         const audioBuffer = await this.fetchAudio(this.originalSrc);
//         console.log('音频数据获取成功，长度:', audioBuffer.length);
        
//         // 获取双声道数据
//         const leftChannel = audioBuffer.getChannelData(0);
//         const rightChannel = audioBuffer.numberOfChannels > 1 
//             ? audioBuffer.getChannelData(1) 
//             : leftChannel; // 如果是单声道，复制左声道
        
//         // 创建交错的双声道数据
//         const stereoData = new Float32Array(leftChannel.length * 2);
//         for (let i = 0; i < leftChannel.length; i++) {
//             stereoData[i * 2] = leftChannel[i];
//             stereoData[i * 2 + 1] = rightChannel[i];
//         }
        
//         console.log('双声道转换完成，准备进行推理');

//         const inputTensor = new ort.Tensor('float32', stereoData, [1, 2, leftChannel.length]);
//         const results = await this.session.run({ mix: inputTensor });
        


//         // 检查输出结果
//         console.log('模型输出结果:', Object.keys(results));
        
//         // 获取伴奏部分
//         const accompaniment = results['accompaniment']?.data as Float32Array;
//         if (!accompaniment) {
//             throw new Error('模型输出格式不正确');
//         }

//         const blob = await this.audioBufferToBlob(accompaniment, audioBuffer.sampleRate);
//         this.processedBlobUrl = URL.createObjectURL(blob);
//         this.mediaElement.src = this.processedBlobUrl;
//         console.log('处理完成，已更新音频源');

//     } catch (error) {
//         console.error('人声分离处理失败:', error);
//         throw error;
//     }
// }

//   protected async performRestore() {
//     if (!this.mediaElement || !this.originalSrc) return;
//     this.mediaElement.src = this.originalSrc;
//   }

//   private async fetchAudio(url: string): Promise<AudioBuffer> {
//     const response = await fetch(url);
//     const arrayBuffer = await response.arrayBuffer();
//     const audioCtx = new AudioContext();
//     return await audioCtx.decodeAudioData(arrayBuffer);
//   }

//   private getMonoAudioData(audioBuffer: AudioBuffer): Float32Array {
//     const channel = audioBuffer.getChannelData(0);
//     return new Float32Array(channel);
//   }

//   private async audioBufferToBlob(data: Float32Array, sampleRate: number): Promise<Blob> {
//     const audioCtx = new OfflineAudioContext(1, data.length, sampleRate);
//     const buffer = audioCtx.createBuffer(1, data.length, sampleRate);
//     buffer.copyToChannel(data, 0);

//     const source = audioCtx.createBufferSource();
//     source.buffer = buffer;
//     source.connect(audioCtx.destination);
//     source.start();

//     const renderedBuffer = await audioCtx.startRendering();

//     return new Promise((resolve) => {
//       const wavBuffer = this.encodeWav(renderedBuffer);
//       resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
//     });
//   }

//   private encodeWav(buffer: AudioBuffer): ArrayBuffer {
//     const channelData = buffer.getChannelData(0);
//     const bufferLength = channelData.length * 2 + 44;
//     const arrayBuffer = new ArrayBuffer(bufferLength);
//     const view = new DataView(arrayBuffer);

//     const writeString = (offset: number, str: string) => {
//       for (let i = 0; i < str.length; i++) {
//         view.setUint8(offset + i, str.charCodeAt(i));
//       }
//     };

//     writeString(0, 'RIFF');
//     view.setUint32(4, bufferLength - 8, true);
//     writeString(8, 'WAVE');
//     writeString(12, 'fmt ');
//     view.setUint32(16, 16, true);
//     view.setUint16(20, 1, true);
//     view.setUint16(22, 1, true);
//     view.setUint32(24, buffer.sampleRate, true);
//     view.setUint32(28, buffer.sampleRate * 2, true);
//     view.setUint16(32, 2, true);
//     view.setUint16(34, 16, true);
//     writeString(36, 'data');
//     view.setUint32(40, channelData.length * 2, true);

//     let offset = 44;
//     for (let i = 0; i < channelData.length; i++) {
//       const sample = Math.max(-1, Math.min(1, channelData[i]));
//       view.setInt16(offset, sample * 0x7fff, true);
//       offset += 2;
//     }

//     return arrayBuffer;
//   }
// }
