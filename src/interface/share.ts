export namespace Share {
  export interface MusicShareMessage {
    shareId: number;
    senderId: number;
    receiverId: number;
    songId: number;
    curStatus: string;
    contentText: string;
    senderName: string;
    senderAvatar: string;
    shareTime: string;
  }
}