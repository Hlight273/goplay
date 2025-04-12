import {http} from '@/util/request'
import { Result } from "@/interface/result";
import { Song } from '@/interface/song';
import { eventBus, MEventTypes } from '@/util/eventBus';

export const uploadAudio4Room = (userId:number, roomCode:String, file:File) => {
    let URL =  `/audio/room/${roomCode}/audio`
    let formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('file', file);
    
    return http.uploadWithProgress<Result<Song.SongContent>>(URL, formData, (progress) => {
        eventBus.emit(MEventTypes.FILE_UPLOAD_PROGRESS, {
            filename: file.name,
            progress: progress
        });
    });
}

export const uploadAudio4Playlist = (userId:number, playlistId:number, file:File) => {
    let URL =  `/audio/playlist/${playlistId}/audio`
    let formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('file', file);
    
    return http.uploadWithProgress<Result<Song.SongContent>>(URL, formData, (progress) => {
        eventBus.emit(MEventTypes.FILE_UPLOAD_PROGRESS, {
            filename: file.name,
            progress: progress
        });
    });
}

export const uploadPlaylistCover = (file:File) => {
    let URL =  `/playlist/image`
    let formData = new FormData();
    formData.append('file', file);
    
    return http.uploadWithProgress<Result<string>>(URL, formData, (progress) => {
        eventBus.emit(MEventTypes.FILE_UPLOAD_PROGRESS, {
            filename: file.name,
            progress: progress
        });
    });
}

export function uploadPostImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    
    return http.uploadWithProgress<Result<string>>('/upload/post/image', formData, (progress) => {
        eventBus.emit(MEventTypes.FILE_UPLOAD_PROGRESS, {
            filename: file.name,
            progress: progress
        });
    });
}