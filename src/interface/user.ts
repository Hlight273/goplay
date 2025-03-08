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
        nickname:string
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

    export const describtionUser = (userInfo:UserInfo):string => {
        if(userInfo.level == Level.Enum.普通 || Level.Enum[userInfo.level] == undefined) 
            return '';
        return Level.Enum[userInfo.level];
    }
    export const UserInfo_InitData:UserInfo = 
    { id: -1, 
        username: '', 
        avatarUrl: '', 
        level: 0 ,
        nickname: ''
    }

    export interface VipInfo {
        userId: number;
        level: number;
        startTime: string;
        endTime: string;
        days: number;
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

