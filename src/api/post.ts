import { Result } from "@/interface/result"
import { Post } from "@/interface/post"
import { http } from '@/util/request'

/** 发布动态 */
export const createPost = (postData: Post.PostInfo) => {
    return http.post<Result<string>>('/village/post', postData)
}

/** 获取动态列表（分页） */
export const getPostList = (page: number, pageSize: number) => {
    return http.get<Result<{ posts: Post.PostDetail[], total: number }>>(
        '/village/post',
        { params: { page, pageSize } }
    )
}

/** 获取动态的一级评论（分页） */
export const getPostComments = (postId: number, page: number, pageSize: number) => {
    return http.get<Result<{ comments: Post.PostComment[], total: number }>>(
        `/village/post/comment/${postId}`,
        { params: { page, pageSize } }
    )
}

/** 获取某个评论的二级评论（分页） */
export const getCommentReplies = (commentId: number, page: number, pageSize: number) => {
    return http.get<Result<{ replies: Post.PostComment[], total: number }>>(
        `/village/post/comment/replies/${commentId}`,
        { params: { page, pageSize } }
    )
}

/** 提交评论 */
export const addPostComment = (comment: Post.PostComment) => {
    return http.post<Result<string>>('/village/post/comment', comment)
}

/** 点赞/取消点赞 */
export const togglePostLike = (postId: number) => {
    return http.post<Result<string>>(`/village/post/like/${postId}`)
}