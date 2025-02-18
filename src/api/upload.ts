import {http} from '@/util/request'
import { Result } from "@/interface/result";

export const uploadAudio = (userId:Number, roomCode:String, file:File) => {
    let URL =  `/audio/room/${roomCode}/audio`

    let formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('file', file);
    
    return http.post<Result<string>>(URL, formData);
}