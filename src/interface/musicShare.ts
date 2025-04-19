export namespace MusicShare{
    export interface MusicShareMessage {
        senderId: number;
        receiverId: number;
        songId: number;
        contentText: string;
        musicTitle: string;
        shareTime: string;
      }
}