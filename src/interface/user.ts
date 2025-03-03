import { userInfo } from "@/api/user";

export namespace User {
    export interface User {
        id: number;
        username: string;
        password: string
    }

    export interface UserInfo {
        id: number;
        username: string
        avatarUrl: string
        room_id?: number
        privilege?: number
        level: number
    }
    
    export interface UserId {
        userId: number;
    }

    export interface UserLoginInfo {
        username: string
        password: string
    }

    export interface LocalUserInfo {
        userid: number
        username: string
        token: string
    }

    export const descForUser = (userInfo:UserInfo):string => {
        if(userInfo.level == Level.Enum.普通 || Level.Enum[userInfo.level] == undefined) 
            return '';
        return Level.Enum[userInfo.level];
    }
}
export namespace Privilege {
    export enum Enum {
        房主 = 1,
        管理员 = 2,
        成员 = 3,
    }
}
export namespace Level {
    export enum Enum {
        普通 = 0,
        负责人 = 1,
        管理员 = 2,
    }
}

