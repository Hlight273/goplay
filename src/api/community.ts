import { http } from '@/util/request'
import { Result } from '@/interface/result'
import { User } from '@/interface/user'

export const getRandomSimilarMbtiUsers = () => {
    return http.get<Result<User.UserInfo[]>>('/community/mySimilarUsers');
}