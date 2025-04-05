import { http } from '@/util/request'
import { Result } from '@/interface/result'
import { Playlist } from '@/interface/playlist'
import { Song } from '@/interface/song'

export const addRecommend = (playlistId:number) => {
    return http.post<Result<string>>(`/recommend/playlist/${playlistId}`);
}
export const removeRecommend = (playlistId:number) => {
    return http.delete<Result<string>>(`/recommend/playlist/${playlistId}`);
}
export const getRecommendPlaylists = () => {
    return http.get<Result<Playlist.PlaylistInfo[]>>(`/recommend/playlist/all`);
}
export const getRecommendAutoPlaylists = () => {
    return http.get<Result<Playlist.PlaylistInfo[]>>(`/recommend/playlist/auto/all`);
}

export const getHotSongs = () => {
  return http.get<Result<Song.SongContent[]>>('/recommend/hot-songs')
}