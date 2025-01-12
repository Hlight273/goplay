import { Song } from "./song";
import { User } from "./user";

export namespace Room {
    export interface Room {
        id: number;
        roomName: string;
        ownerId: number;
        maxUsers: number;
        currentUsers: number;
        roomCode: string;
        createdAt: string;
        isActive: number;
    }

    export interface RoomInfo {
        id: number;
        roomName: string;
        ownerId: number;
        maxUsers: number;
        currentUsers: number;
        roomCode: string;
        createdAt: string;
        isActive: number;
        userList: User.User[];
        songList: Song.Song[];
    }

    export interface RoomMsg {
        userInfo:User.UserInfo;
        sendAt:string;
        msg:string;
    }
}