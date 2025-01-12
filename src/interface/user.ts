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
}
export namespace Privilege {
    
    export enum Enum {
        房主 = 1,
        管理员 = 2,
        成员 = 3,
    }
    
}

