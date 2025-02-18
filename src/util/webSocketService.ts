import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export class WebSocketService {
  public client: Client;
  private url: string;
  private userId: number;
  private roomId: number;
  private subscriptionQueue: { destination: string; callback: (message: IMessage) => void }[] = [];
  private backupSubscriptions: { destination: string; callback: (message: IMessage) => void }[] = []; // 备份存储
  private activeSubscriptions: StompSubscription[] = [];
  private retryCount:number = 0;
  public MAX_RETRY_COUNT =20;
  
  constructor(brokerURL: string, userId:number, roomId:number) {
    console.log("👷‍♂<<构造WsService对象>>"+brokerURL);
    this.url = brokerURL;
    this.userId = userId;
    this.roomId = roomId;
    this.client = this.createClient(this.url, this.userId, this.roomId)
  }

  createClient(brokerURL:string, userId:number, roomId:number):Client{
    const socket = new SockJS(brokerURL);
    return new Client({
      //如果是原生ws，直接用url brokerURL: brokerURL,这里sockjs改用webSocketFactory包装
      webSocketFactory: () => {
        return socket; 
      },
      connectHeaders: {
        userId:  userId.toString(),// 这里传递用户ID
        roomId: roomId.toString(),  // 这里传递房间ID
        //'token':localStorage.getItem("token") || ''
      },
      disconnectHeaders: {
        userId:  userId.toString(),
        roomId: roomId.toString(),
      },
      // debug: (str) => { console.log(str); },
      onConnect: this.onConnect.bind(this),
      onStompError: this.onError.bind(this),
      onWebSocketClose: this.onDisconnect.bind(this),
    });
  }

  connect(): void {
    this.client.activate();
  }

  disconnect(): void {
    this.client.deactivate();
  }

  public onConnect(frame: any): void {
    console.log('📞📞连接成功📞📞:', frame);
    // **自动恢复所有已备份的订阅**
    if (this.subscriptionQueue.length == 0 && this.backupSubscriptions.length > 0) {
      console.log("♻️📌 恢复之前的订阅");
      this.backupSubscriptions.forEach(({ destination, callback }) => {
        this.subscribe(destination, callback);
      });
    }

    // 处理等待中的订阅队列
    if (this.subscriptionQueue.length > 0) {
      console.log("♻️📌 处理等待队列中的订阅");
      this.subscriptionQueue.forEach(({ destination, callback }) => {
        this.subscribe(destination, callback);
      });
      //console.log(this.subscriptionQueue);
    }
  }

   // 新增支持预定订阅的逻辑
   subscribe(destination: string, callback: (message: IMessage) => void): void {
    if (this.client.connected) {
      console.log(`☑☑ 订阅端点 ${destination}`);
      const subscription = this.client.subscribe(destination, callback);
      this.activeSubscriptions.push(subscription); // 保存订阅对象，方便取消订阅
    } else {
      console.log(`☑ 存储端点 ${destination}`);
      this.subscriptionQueue.push({ destination, callback }); // 将订阅请求加入队列，未处于活跃状态直接用原生的订阅会失败
    }
    // **确保所有订阅都存入备份**
    if (!this.backupSubscriptions.some(sub => sub.destination === destination)) {
      this.backupSubscriptions.push({ destination, callback });
    }
  }

  private onError(error: any): void {
    console.error('⚠STOMP错误⚠:', error);
  }

  private  onDisconnect(): void {
    console.log('⚠WebSocket已断开连接⚠');
    this.disconnect();

    if(this.retryCount>=this.MAX_RETRY_COUNT){
      console.log(`重连次数已达上限！！终止重连${this.retryCount}`);
      return;
    }
      
    this.retryCount++;
    console.log(`WebSocket重置中♻️...${this.retryCount}/${this.MAX_RETRY_COUNT}次...`);
    this.client = this.createClient(this.url, this.userId, this.roomId)
    this.connect();
  }

  sendMessage(destination: string, body: string): void {
    this.client.publish({ destination, body });
  }
}
