import { http } from '@/util/request';
import { Result } from '@/interface/result';
import { Share } from '@/interface/share';

/**
 * 获取用户收到的音乐分享
 * @param userId 用户ID
 */
export function getMyShares() {
  return http.get<Result<Share.MusicShareMessage[]>>(`/share/my`);
}

/**
 * 处理音乐分享决定
 * @param shareId 分享ID
 * @param store 是否保存
 */
export function handleShareDecision(shareId: number, store: boolean) {
  if (typeof shareId !== 'number' || typeof store !== 'boolean') {
    throw new Error('Invalid parameters');
  }
  
  const formData = new FormData();
  formData.append('shareId', shareId.toString());
  formData.append('store', store.toString());
  return http.post<Result<any>>('/share/handle', formData);
}

/**
 * 发送音乐分享
 * @param receiverId 接收者ID
 * @param musicId 音乐ID
 */
export function sendMusicShare( musicShareMessage: {
  receiverId: number, 
  songId: number,
  contentText?: string
}) {
  return http.post<Result<any>>('/share/send', musicShareMessage);
}