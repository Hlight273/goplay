export namespace Song {
    export interface Song {
        id: number;
        isExternal: number;
        fileName: string;
        filePath: string;
        fileDuration: number;
        fileSize: number;
        fileMimeType: string;
        fileCoverPath:string;
        addedBy: number;
        addedAt: string;
        isActive: number;
    }

    export interface SongInfo {
        id: number;
        songName: string;
        songArtist: string;
        songDuration: number;
        songAlbum: string;
        songSize: number;
    }

    export interface SongContent {
        songInfo: SongInfo;
        coverBase64: string;
        songUrl: string;
    }

    export interface SongDetailDTO {
        song: Song;
        songInfo: SongInfo;
    }

    export interface Comment {
        id: number;
        parentId: number | null; // null 表示是一级评论
        songId: number;
        addedBy: number;
        addedByName: string;
        addedAt: string;
        contentText: string;
        likeCount: number;
        isActive: number;
        replies?: Comment[]; // 已加载的二级评论
        totalReplies?: number; // 该评论下的总二级评论数量
        loadedRepliesCount?: number; // 已经加载的二级评论数量
      }
      
}