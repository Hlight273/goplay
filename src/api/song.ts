import { Result } from "@/interface/result";
import { Room } from "@/interface/room";
import { Song } from "@/interface/song";
import { User } from "@/interface/user";
import {downloadWithAxios, getFileBlobFromServer, http} from '@/util/request'
import { webRoot } from "@/util/webConst";
import { Axios } from "axios";

export const getSongFile = (songUrl:string, isZipped:number):Promise<string|void> => { //返回下载到本地的url
    return downloadWithAxios(`/song/${songUrl}/${isZipped}`, songUrl)
}

export const getSongBlob = (songUrl:string):Promise<string|void> => {
    const isZipped:number = 1;
    return getFileBlobFromServer(`${webRoot}/song/${songUrl}/${isZipped}`, songUrl)
}

/** 获取歌曲的一级评论（分页） */
export const getCommentsBySong = (songId: number, page: number, pageSize: number) => {
    return http.get<Result<{ comments: Song.Comment[], total: number }>>(
        `/comment/song/${songId}`, 
        { params: { page, pageSize } }
    );
};

/** 获取某个评论的二级评论（分页） */
export const getRepliesByComment = (commentId: number, page: number, pageSize: number) => {
    return http.get<Result<{ replies: Song.Comment[], total: number }>>(
        `/comment/replies/${commentId}`, 
        { params: { page, pageSize } }
    );
};

/** 提交新评论（一级或二级） */
export const addComment = (comment: { songId: number, parentId?: number, contentText: string }) => {
    return http.post<Result<string>>(`/comment`, comment);
};