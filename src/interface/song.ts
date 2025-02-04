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
}