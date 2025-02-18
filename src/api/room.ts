import { Result } from "@/interface/result";
import { Room } from "@/interface/room";
import { Song } from "@/interface/song";
import { User } from "@/interface/user";
import {http} from '@/util/request'

export const roomCreate = (data:User.UserId) => {
    return http.post<Result<Room.Room>>('/room', data);
}

export const isUserInRoom = (userId:number) => {
    return http.get<Result<Room.Room>>(`/room/user/${userId}`);
}

export const roomJoin = (roomCode:string, data:User.UserId) => {
    return http.post<Result<Room.Room>>(`/room/${roomCode}/join`,data);
}

export const roomExit = (roomCode:string, userId:number) => {
    return http.delete<Result<string>>(`/room/${roomCode}/user/${userId}`);
}

export const roomMember = (roomCode:string) => {
    return http.get<Result<User.UserInfo[]>>(`/room/${roomCode}/userList`);
}

export const roomMemberPrivilege = (roomCode:string, userId:number,privilegeCode:number, callerUserId:number) => {
    return http.post<Result<User.UserInfo[]>>(`room/${roomCode}/user/${userId}/privilege/${privilegeCode}?callerUserId=${callerUserId}`);
}

export const roomOwnerTransPrivilege = (roomCode:string, userId:number, targetUserId:number) => {
    return http.post<Result<User.UserInfo[]>>(`room/${roomCode}/user/${userId}/owner/to/user/${targetUserId}`);
}

export const roomSongContentList = (roomCode:string) => {
    return http.get<Result<Song.SongContent[]>>(`room/${roomCode}/songList`);
}

export const roomSongRemove = (roomCode:string, songId:Number, data:User.UserId) => {
    return http.post<Result<string>>(`room/${roomCode}/song/${songId}/remove`, data);
}