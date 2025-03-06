import { http } from "@/util/request";
import { webRoot } from "@/util/webConst";

export const getPlaylistCoverURL = (fileName:string):string => {
    return  `${webRoot}/static/image/playlist-cover/${fileName}`;
}

export const getUserAvatarURL = (fileName:string):string => {
    return  `${webRoot}/static/image/user-avatar/${fileName}`;
}

// export const getPlaylistCover = async (fileName:string):Promise<string> => {
//     const url =  `/static/image/playlist-cover/${fileName}`;
//     return http.get<string>(`/user/${fileName}/room`);
// }

// export const getUserAvatar = (fileName:string):string => {
//     return `/static/image/user-avatar/${fileName}`;
// }