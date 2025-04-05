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
        hPoints?:number
        isActive?:number
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
   

    export interface VipInfo {
        userId: number;
        level: number;
        startTime: string;
        endTime: string;
        days: number;
    }

    export const UserInfo_InitData:UserInfo = 
    {   id: -1, 
        username: '', 
        avatarUrl: '', 
        level: 0 ,
        nickname: ''
    }
    export const VipInfo_InitData:VipInfo = 
    {
        userId: 0,
        level: 0,
        startTime: new Date().toString(),
        endTime: new Date().toString(), 
        days: 0
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
    export const LevelRef = Object.keys(Enum)
    .filter(key => isNaN(Number(key)))  // 排除数字的反向映射
    .reduce((result, key) => {
      result[key] = Enum[key as keyof typeof Enum];
      return result;
    }, {} as { [key: string]: number });
}

