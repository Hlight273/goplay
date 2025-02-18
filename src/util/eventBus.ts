import mitt from "mitt";

// 定义枚举
export enum MEventTypes {
  PLAYER_READY = "PLAYER_READY",
}

// 使用枚举定义事件类型 无参用void，有参用别的
export type MEvents = {
  [MEventTypes.PLAYER_READY]: void;
};


// 创建全局事件总线
export const eventBus = mitt<MEvents>();