import { Song } from "./song";
import { User } from "./user";
import { Room } from "./room";

export namespace RoomUser {
    export interface RoomUser {
        id: number;
        roomId: string;
        sserId: number;
        joinedAt: string;
        isActive: number;
        privilege: number;
    }
}