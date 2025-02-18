import { Result } from "@/interface/result";
import { Room } from "@/interface/room";
import { Song } from "@/interface/song";
import { User } from "@/interface/user";
import {downloadWithAxios, getFileBlobFromServer, http} from '@/util/request'
import { webRoot } from "@/util/webConst";
import { Axios } from "axios";

export const getSongFile = (songUrl:string):Promise<string|void> => { //返回下载到本地的url
    return downloadWithAxios(`/song/${songUrl}`, songUrl)
}

export const getSongBlob = (songUrl:string):Promise<string|void> => {
    return getFileBlobFromServer(`${webRoot}/song/${songUrl}`, songUrl)
}