import { Playlist } from '@/interface/Playlist';
import { Result } from '@/interface/result';
import { Song } from '@/interface/song';
import {http} from '@/util/request'

export const getPlaylistInfo = (playlistId:number) => {
    return http.get<Result<Playlist.PlaylistInfo>>(`playlist/${playlistId}/info`,);
}

// export const getSongsFromPlaylist = (playlistId:number) => {
//     return http.get<Result<Song.SongContent[]>>(`/${playlistId}/songs`,);
// }

// export const getPlaylist = (playlistId:number) => {
//     return http.get<Result<Playlist.Playlist>>(`/${playlistId}`,);
// }