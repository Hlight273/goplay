import useCurrentInstance from "@/hooks/useCurrentInstance";
import { Result } from "@/interface/result";
import { Room } from "@/interface/room";
import { Privilege, User } from "@/interface/user";
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
    return http.get<Result<User.UserInfo>>(`/user/info`,data);
}

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


