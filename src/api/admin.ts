import { http } from '@/util/request'
import { Result } from '@/interface/result'
import { Playlist } from '@/interface/playlist'
import { Song } from '@/interface/song'
import { User } from '@/interface/user'

// 搜索歌单
export const searchAdminPlaylists = (params: {
    keyword?: string,
    id?: number,
    page: number,
    pageSize: number
}) => {
    return http.get<Result<{ playlistInfos: Playlist.PlaylistInfo[], total: number }>>(
        '/admin/playlistInfos/search', 
        { params }
    )
}

// 搜索歌曲
export const searchAdminSongs = (params: {
    keyword?: string,
    id?: number,
    page: number,
    pageSize: number
}) => {
    return http.get<Result<{ songs: Song.SongDetailDTO[], total: number }>>(
        '/admin/songs/search', 
        { params }
    )
}

// 搜索用户
export const searchAdminUsers = (params: {
    keyword?: string,
    id?: number,
    page: number,
    pageSize: number
}) => {
    return http.get<Result<{ users: User.UserInfo[], total: number }>>(
        '/admin/users/search', 
        { params }
    )
}

// 下架歌单
export const takedownPlaylist = (playlistId: number) => {
    return http.post<Result<any>>(`/admin/playlist/${playlistId}/takedown`)
}

// 下架歌曲
export const takedownSong = (songId: number) => {
    return http.post<Result<any>>(`/admin/song/${songId}/takedown`)
}

// 禁用用户
export const deactivateUser = (userId: number) => {
    return http.post<Result<any>>(`/admin/user/${userId}/deactivate`)
}

// 启用用户
export const activateUser = (userId: number) => {
    return http.post<Result<any>>(`/admin/user/${userId}/activate`)
}

// 更新歌单信息
export const updatePlaylistAdmin = (playlistId: number, playlistForm: Playlist.PlaylistForm) => {
    return http.put<Result<Playlist.Playlist>>(`/admin/playlist/${playlistId}`, playlistForm)
}

// 更新歌曲信息
export const updateSongAdmin = (songId: number, songInfo: {
    songName: string,
    songArtist: string,
    songAlbum: string
}) => {
    return http.put<Result<Song.SongInfo>>(`/admin/song/${songId}/info`, songInfo)
}

// 上架歌单
export const activatePlaylist = (playlistId: number) => {
    return http.post<Result<any>>(`/admin/playlist/${playlistId}/activate`)
}

// 上架歌曲
export const activateSong = (songId: number) => {
    return http.post<Result<any>>(`/admin/song/${songId}/activate`)
}

// 原有的下架方法改名
export const deactivatePlaylist = (playlistId: number) => {
    return http.post<Result<any>>(`/admin/playlist/${playlistId}/deactivate`)
}

export const deactivateSong = (songId: number) => {
    return http.post<Result<any>>(`/admin/song/${songId}/deactivate`)
}

// 修改用户权限级别
export const updateUserLevel = (userId: number, level: number) => {
    return http.put<Result<any>>(`/admin/user/${userId}/level`, { level })
}