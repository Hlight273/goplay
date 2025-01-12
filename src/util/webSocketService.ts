import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class WebSocketService {
  public client: Client;
  private subscriptionQueue: { destination: string; callback: (message: IMessage) => void }[] = [];
  private activeSubscriptions: StompSubscription[] = [];

  constructor(brokerURL: string) {
    console.log("开始构造WsService对象"+brokerURL);
    const socket = new SockJS(brokerURL);
    this.client = new Client({
      //如果是原生ws，直接用url brokerURL: brokerURL,这里sockjs改用webSocketFactory包装
      webSocketFactory: () => {
        return socket; 
      },
      connectHeaders: {
        //'token':localStorage.getItem("token") || ''
      },
      debug: (str) => { console.log(str); },
      onConnect: this.onConnect.bind(this),
      onStompError: this.onError.bind(this),
    });
  }

  connect(): void {
    this.client.activate();
  }

  disconnect(): void {
    this.client.deactivate();
  }

  public onConnect(frame: any): void {
    console.log('Connected:', frame);
    // 执行队列中的所有预定订阅
    this.subscriptionQueue.forEach(({ destination, callback }) => {
      this.subscribe(destination, callback);
    });
    this.subscriptionQueue = []; // 清空队列
  }

   // 新增支持预定订阅的逻辑
   subscribe(destination: string, callback: (message: IMessage) => void): void {
    if (this.client.connected) {
      console.log(`Subscribing to ${destination}`);
      const subscription = this.client.subscribe(destination, callback);
      this.activeSubscriptions.push(subscription); // 保存订阅对象，方便取消订阅
    } else {
      console.log(`Queueing subscription for ${destination}`);
      this.subscriptionQueue.push({ destination, callback }); // 将订阅请求加入队列
    }
  }

  private onError(error: any): void {
    console.error('STOMP Error:', error);
  }

  sendMessage(destination: string, body: string): void {
    this.client.publish({ destination, body });
  }
}
