import { Song } from "./song";

export namespace Playlist{
    export interface Playlist {
        id: number;               // 歌单ID
        userId: number;          // 用户ID
        title: string;            // 歌单标题
        description: string;      // 歌单描述
        coverUrl: string | null; // 歌单封面URL (可能为空)
        addedAt: string;         // 添加时间 (timestamp 以字符串形式)
        updateAt: string;        // 更新时间 (timestamp 以字符串形式)
        isActive: number;        // 是否激活 (1表示激活，0表示不激活)
        isPublic: number;        // 是否公开 (1表示公开，0表示私密)
    }

    export interface PlaylistSong {
        id: number;              // 关联ID
        playlistId: number;
        songId: number;         // 歌曲ID
        addedBy: number;        // 添加该歌曲的用户ID
        addedAt: string;        // 添加时间 (timestamp 以字符串形式)
        addedUsername: string;  // 添加该歌曲的用户名
        isActive: number;       // 是否激活 (1表示激活，0表示不激活)
    }

    export interface PlaylistInfo {
        playlist: Playlist;              
        songContentList: Song.SongContent[];             
    }

    export interface PlaylistForm {     
        id: number;
        title: string;
        description: string;
        coverUrl: string | null;
        isPublic: number;
    }

    export const playlistInfo_InitData:Playlist.PlaylistInfo = {
        playlist: {
            id: -1,
            userId: 0,
            title: '',
            description: '',
            coverUrl: null,
            addedAt: '',
            updateAt: '',
            isActive: 0,
            isPublic: 0
        },
        songContentList: []
    }

    export const playlistForm_InitData:Playlist.PlaylistForm = {
        id: -1,
        title: '',
        description: '',
        coverUrl: '',
        isPublic: 0,
      }
}
