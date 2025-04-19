import { Client, IMessage, StompHeaders, StompSubscription } from '@stomp/stompjs';
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

  private activeDisconnect = false;

  private needHeart = true;
  private heartbeatInterval: number | null = null;
  
  constructor(brokerURL: string, userId:number, roomId:number, _needHeart?:boolean, _isPM?:boolean) {
    console.log("<<new WsService>>"+brokerURL);
    this.url = brokerURL;
    this.userId = userId;
    this.roomId = roomId;
    this.client = this.createClient(this.url, this.userId, this.roomId, _needHeart??false, _isPM??false)
  }

  createClient(brokerURL:string, userId:number, roomId:number, _needHeart?:boolean, _isPM?:boolean):Client{
    this.needHeart = _needHeart || false;
    const socket = new SockJS(brokerURL);
    var cl = new Client({
      //如果是原生ws，直接用url brokerURL: brokerURL,这里sockjs改用webSocketFactory包装
      webSocketFactory: () => {
        return socket; 
      },
      // debug: (str) => { console.log(str); },
      onConnect: this.onConnect.bind(this),
      onStompError: this.onError.bind(this),
      onWebSocketClose: this.onDisconnect.bind(this),
    });
    if(_needHeart){
      cl.connectHeaders = {
        userId:  userId.toString(),// 这里传递用户ID
        roomId: roomId.toString(),  // 这里传递房间ID
        //'token':localStorage.getItem("token") || ''
      };
    }
    if(_isPM){
      cl.connectHeaders = {
        userId: userId.toString(),
      };
    }
    return cl;
  }

  connect(): void {
    this.activeDisconnect = false;
    this.client.activate();
  }

  disconnect(): void {
    this.activeDisconnect = true;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.client.deactivate();
    this.cleanupSubscriptions();
  
  }

  public onConnect(frame: any): void {
    console.log('📞📞连接成功📞📞:'/*, frame*/);
    this.retryCount = 0
    //心跳包
    if(this.needHeart){
      this.sendHeartbeat(); //先发送一次心跳包
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat(); // 发送心跳包
      }, 30000);
    }
   
    // **自动恢复所有已备份的订阅**
    if (this.subscriptionQueue.length == 0 && this.backupSubscriptions.length > 0) {
      //console.log("♻️📌 恢复之前的订阅");
      this.backupSubscriptions.forEach(({ destination, callback }) => {
        this.subscribe(destination, callback);
      });
    }

    // 处理等待中的订阅队列
    if (this.subscriptionQueue.length > 0) {
      //console.log("♻️📌 处理等待队列中的订阅");
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
      //console.log(`☑ 存储端点 ${destination}`);
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

  private onDisconnect(): void {
    console.log('⚠WebSocket已断开连接⚠');


    if (this.activeDisconnect) {
      console.log("🔌 主动断开，不重连");
      return; // ✅ 如果是主动断开，则不进行重连
    }

    if(this.retryCount>=this.MAX_RETRY_COUNT){
      console.log(`重连次数已达上限！！终止重连${this.retryCount}`);
      return;
    }
      
    this.retryCount++;
    console.log(`WebSocket重置中♻️...${this.retryCount}/${this.MAX_RETRY_COUNT}次...`);
    this.client = this.createClient(this.url, this.userId, this.roomId)
    this.connect();
  }

  private cleanupSubscriptions(): void {
    console.log("🧹 清理所有订阅");
    this.activeSubscriptions.forEach(sub => sub.unsubscribe());
    this.activeSubscriptions = []; // 清空活动订阅
  }

  private sendHeartbeat(): void {
    this.sendMessage("/app/heartbeat", '0',{
      userId: this.userId.toString(),
      roomId: this.roomId.toString(),
    });
  }

  sendMessage(destination: string, body: string, headers?:StompHeaders): void {
    this.client.publish({ destination, body, ...(headers ? { headers } : {}) });
  }
}
