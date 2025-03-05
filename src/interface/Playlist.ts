import { Song } from "./song";

export namespace Playlist{
    export interface Playlist {
        id: number;               // 歌单ID
        user_id: number;          // 用户ID
        title: string;            // 歌单标题
        description: string;      // 歌单描述
        cover_url: string | null; // 歌单封面URL (可能为空)
        added_at: string;         // 添加时间 (timestamp 以字符串形式)
        update_at: string;        // 更新时间 (timestamp 以字符串形式)
        is_active: number;        // 是否激活 (1表示激活，0表示不激活)
        is_public: number;        // 是否公开 (1表示公开，0表示私密)
    }

    export interface PlaylistSong {
        id: number;              // 关联ID
        playlist_id: number;
        song_id: number;         // 歌曲ID
        added_by: number;        // 添加该歌曲的用户ID
        added_at: string;        // 添加时间 (timestamp 以字符串形式)
        added_username: string;  // 添加该歌曲的用户名
        is_active: number;       // 是否激活 (1表示激活，0表示不激活)
    }

    export interface PlaylistInfo {
        playlist: Playlist;              
        songContentList: Song.SongContent[];             
    }
}
