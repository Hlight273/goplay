import useCurrentInstance from "@/hooks/useCurrentInstance";
import { Playlist } from "@/interface/playlist";
import { Result } from "@/interface/result";
import { Room } from "@/interface/room";
import { Level, Privilege, User } from "@/interface/user";
import {http} from '@/util/request'
import { AxiosRequestConfig } from "axios";

export const login = (data:User.UserLoginInfo) => {
    return http.post<Result<User.LocalUserInfo>>('/user/login', data);
}

export const register = (data:User.UserLoginInfo) => {
    return http.post<Result<User.LocalUserInfo>>('/user/register', data);
}

export const logout = () => {
    return http.post<Result<string>>('/user/logout');
}

export const userRoomInfo = (userId:number) => {
    return http.get<Result<Room.Room>>(`/user/${userId}/room`);
}

export const userInfo = (userId:number) => {
    return http.get<Result<User.UserInfo>>(`/user/${userId}/info`);
}

export const userInfoByToken = (data:AxiosRequestConfig) => {
    return http.get<Result<User.UserInfo>>(`/user/info`, data);
}

export const userPlaylistInfo = (playlistOwnerId:number) => {
    return http.get<Result<Playlist.PlaylistInfo[]>>(`/user/${playlistOwnerId}/playlist/info`);
}

export const updateNickname = (newNickname:string) => {
    let formData = new FormData();
    formData.append('newNickname', newNickname);
    return http.put<Result<boolean>>(`/user/nickname`, formData);
}

export const updatePwd = (oldPwd:string, newPwd:string) => {
    let formData = new FormData();
    formData.append('oldPwd', oldPwd);
    formData.append('newPwd', newPwd);
    return http.put<Result<boolean>>(`/user/pwd`, formData);
}

export const userVipInfo = (userId:number) => {
    return http.get<Result<User.VipInfo>>(`user/${userId}/vipInfo`);
}

// export const renewVipInfo = (userId:number) => {
//     return http.put<Result<User.VipInfo>>(`user/renew/vipInfo`);
// }



//非api
export const getPrivilegeName = (userinfo:User.UserInfo):string => {
    try {
        if(userinfo.privilege!=undefined && userinfo.privilege!=null)
            return Privilege.Enum[userinfo.privilege]
    } catch (error) {
        return '未知'
    }
    return '未知'
}

export const HasOwnerPower = (userinfo:User.UserInfo):boolean=>{
    if(userinfo==undefined||userinfo==null)return false
    if(userinfo.privilege!=undefined && userinfo.privilege!=null)
        return userinfo.privilege <= Privilege.Enum.房主
    return false
}

export const HasRoomAdminPower = (userinfo:User.UserInfo):boolean=>{
    if(userinfo==undefined||userinfo==null)return false
    if(userinfo.privilege!=undefined && userinfo.privilege!=null)
        return userinfo.privilege <= Privilege.Enum.管理员
    return false
}

export const HasPlaylistPermission = (playlist:Playlist.Playlist, userinfo:User.UserInfo):boolean=>{
    if(userInfo==undefined||userInfo==null)return false
    const userId = userinfo.id;
    const ownerId = playlist.userId;
    return ownerId == userId || userinfo.level >= Level.Enum.负责人;
}

export const CanRecommand = (userInfo:User.UserInfo):boolean => {
    if(userInfo==undefined||userInfo==null)return false
    return userInfo.level>=Level.Enum.负责人;
}

export const isAdmin = (userInfo:User.UserInfo) => {
    if(userInfo==undefined||userInfo==null)return false
    return userInfo.level === Level.Enum.管理员
  }


