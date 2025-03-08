import { Playlist } from "@/interface/playlist";
import { Result } from "@/interface/result";
import {http} from '@/util/request'

export const addRecommend = (playlistId:number) => {
    return http.post<Result<string>>(`/recommend/playlist/${playlistId}`);
}
export const removeRecommend = (playlistId:number) => {
    return http.delete<Result<string>>(`/recommend/playlist/${playlistId}`);
}
export const getRecommendPlaylists = () => {
    return http.get<Result<Playlist.PlaylistInfo[]>>(`/recommend/playlist/all`);
}