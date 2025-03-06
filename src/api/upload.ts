import {http} from '@/util/request'
import { Result } from "@/interface/result";

export const uploadAudio4Room = (userId:number, roomCode:String, file:File) => {
    let URL =  `/audio/room/${roomCode}/audio`

    let formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('file', file);
    
    return http.post<Result<string>>(URL, formData);
}

export const uploadAudio4Playlist = (userId:number, playlistId:number, file:File) => {
    let URL =  `/audio/playlist/${playlistId}/audio`

    let formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('file', file);
    
    return http.post<Result<string>>(URL, formData);
}

export const uploadPlaylistCover = (file:File) => {
    let URL =  `/playlist/image`
    let formData = new FormData();
    formData.append('file', file);
    return http.post<Result<string>>(URL, formData);
}