import { Song } from "@/interface/song";
import mitt from "mitt";

// 定义枚举
export enum MEventTypes {
  PLAYER_READY = "PLAYER_READY",
  PLAY_NEW_SONG_ROOM = "PLAY_NEW_SONG_ROOM",
  PLAY_NEW_SONG_LOCAL = "PLAY_NEW_SONG_LOCAL",
  GOPLAYER_MODE_CHANGED = "GOPLAYER_MODE_CHANGED"
}

// 使用枚举定义事件类型 无参用void，有参用别的
export type MEvents = {
  [MEventTypes.PLAYER_READY]: void;
  [MEventTypes.PLAY_NEW_SONG_ROOM]: Song.SongContent|null;
  [MEventTypes.PLAY_NEW_SONG_LOCAL]: Song.SongContent|null;
  [MEventTypes.GOPLAYER_MODE_CHANGED]: boolean;
};


// 创建全局事件总线
export const eventBus = mitt<MEvents>();