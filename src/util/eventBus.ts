import { Song } from "@/interface/song";
import mitt from "mitt";

// 定义枚举
export enum MEventTypes {
  PLAYER_READY = "PLAYER_READY",
  PLAY_NEW_SONG_ROOM = "PLAY_NEW_SONG_ROOM",
  PLAY_NEW_SONG_LOCAL = "PLAY_NEW_SONG_LOCAL",
  GOPLAYER_MODE_CHANGED = "GOPLAYER_MODE_CHANGED",
  SONG_LOADING_PROGRESS = "SONG_LOADING_PROGRESS",
  FILE_UPLOAD_PROGRESS = 'file-upload-progress',
}

// 使用枚举定义事件类型 无参用void，有参用别的
export type MEvents = {
  [MEventTypes.PLAYER_READY]: void;
  [MEventTypes.PLAY_NEW_SONG_ROOM]: Song.SongContent|null;
  [MEventTypes.PLAY_NEW_SONG_LOCAL]: Song.SongContent|null;
  [MEventTypes.GOPLAYER_MODE_CHANGED]: boolean;
  [MEventTypes.SONG_LOADING_PROGRESS]: {
    url: string;
    progress: number;
  };
  [MEventTypes.FILE_UPLOAD_PROGRESS]: {
    filename: string;
    progress: number;
  };
};


// 创建全局事件总线
export const eventBus = mitt<MEvents>();