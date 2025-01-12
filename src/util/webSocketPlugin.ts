import { App } from 'vue';
import {WebSocketService} from '@/util/webSocketService';

const websocketPlugin = {
    install(app: App, options: { url: string }) {
    // 使用传入的 URL 创建 WebSocketService 实例
    const webSocketService = new WebSocketService(options.url);
    
    // 挂载到全局属性上
    app.config.globalProperties.$ws = webSocketService;
    
    // 连接 WebSocket
    webSocketService.connect();

    // Optionally: Cleanup method on app unmount (e.g., disconnect)
    app.unmount = () => {
      webSocketService.disconnect();
    };
  },
};

export default websocketPlugin;