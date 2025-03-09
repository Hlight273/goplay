import { Playlist } from '@/interface/playlist';
import { Result } from '@/interface/result';
import {http} from '@/util/request'

export const getPlaylistInfo = (playlistId:number) => {
    return http.get<Result<Playlist.PlaylistInfo>>(`playlist/${playlistId}/info`,);
}
export const addPlaylist = (playlistForm: Playlist.PlaylistForm) => {
    return http.post<Result<Playlist.Playlist>>('playlist', playlistForm);
}
export const updatePlaylist = (playlistId: number, playlistForm: Playlist.PlaylistForm) => {
    return http.put<Result<Playlist.Playlist>>(`playlist/${playlistId}`, playlistForm);
}
export const removePlaylist = (playlistId: number) => {
    return http.delete<Result<boolean>>(`playlist/${playlistId}`);
}
export const removeSongInPlaylist = (playlistId: number, songId: number) => {
    return http.delete<Result<boolean>>(`playlist/${playlistId}/song/${songId}`);
}
export const addSongInPlaylist = (playlistId: number, songId: number) => {
    return http.post<Result<boolean>>(`playlist/${playlistId}/song/${songId}`);
}

// export const getSongsFromPlaylist = (playlistId:number) => {
//     return http.get<Result<Song.SongContent[]>>(`/${playlistId}/songs`,);
// }

// export const getPlaylist = (playlistId:number) => {
//     return http.get<Result<Playlist.Playlist>>(`/${playlistId}`,);
// }