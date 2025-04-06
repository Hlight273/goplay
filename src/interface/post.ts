import { Song } from "./song";

export namespace Post {
    export interface PostComment {
        id: number;
        parentId: number | null;
        postId: number;
        addedBy: number;
        addedByName: string;
        addedByAvatar: string;
        addedAt: string;
        contentText: string;
        isActive: number;
        // 前端状态属性，不需要后端返回

        replies?: PostComment[]; // 已加载的二级评论
        totalReplies?: number; // 该评论下的总二级评论数量
        loadedRepliesCount?: number; // 已经加载的二级评论数量

        //replyToId?: number | null;
        replyToName?: string;
        replyToAvator?: string;
        // replyCount?: number;
        // replies?: PostComment[];
         showReplies?: boolean;
        // hasMoreReplies?: boolean;
         replyPage?: number;
    }

    export interface PostInfo {
        contentText: string;
        songId?: number;
        linkUrl?: string;
        imageUrls: string[];
    }

    export interface PostDetail {
        id: number;
        contentText: string;
        songContent: Song.SongContent | null;
        linkUrl: string | null;
        imageUrls: string[];
        addedBy: number;
        addedByName: string;
        addedByAvatar: string;
        addedAt: string;
        likeCount: number;
        likedByCurrentUser: boolean;
        commentCount: number;
    }
}