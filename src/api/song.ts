import { Result } from "@/interface/result";
import { Room } from "@/interface/room";
import { Song } from "@/interface/song";
import { User } from "@/interface/user";
import {downloadWithAxios, http} from '@/util/request'
import { Axios } from "axios";

export const getSong = (songUrl:string) => {
    return downloadWithAxios(`/song/${songUrl}`, songUrl)
}