export namespace Song {
    export interface Song {
        id: number;           // 歌曲 ID
        roomId: number;      // 所属房间 ID
        songUrl: string;     // 歌曲的URL
        addedBy: number;      // 添加者的用户 ID
    }
}