import axios,{AxiosError, AxiosRequestConfig, AxiosResponse} from 'axios'
import router from "@/router";
import { ResultCode } from '@/util/webConst';
import { ElMessage } from 'element-plus';
import { webRoot } from "./webConst";
 
const service = axios.create({
    baseURL: webRoot,
    timeout: 30000,
})
 
// request 拦截器
// 可以自请求发送前对请求做一些处理
// 比如统一加token，对请求参数统一加密
service.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=utf-8';
    let token = localStorage.getItem("token") ? localStorage.getItem("token") : null
    if (token) {
        config.headers['token'] = token;  // 设置请求头
    }
 
    return config
}, 
(error:AxiosError) => {
    console.log(error);
    
    return Promise.reject(error)
});
 
// response 拦截器
// 可以在接口响应后统一处理结果
service.interceptors.response.use(
    (response:AxiosResponse) => {
        let res = response.data;
        
        if (response.config.responseType === 'blob') {// 如果是返回的文件
            return res
        }
        if (typeof res === 'string') { // 兼容服务端返回的字符串数据
            res = res ? JSON.parse(res) : res
        }

        //ResultCode不是20000 需要统一处理的写下面
        if (res.code === ResultCode.EXPIRED) {//token过期
            msgErr("错误："+res.message);
            router.replace("/login")
            return Promise.reject(new Error(res.message))
        }
        if (res.code === ResultCode.ERROR){ //业务错误，默认的业务错误全都是发这个消息
            msgErr("错误："+res.message);
            return Promise.reject(new Error(res.message))
        }
        return res;
    },
    (error:AxiosError) => {//网络错误
        msgErr("网络错误"+error);
        return Promise.reject(error)
    }
)
 
// 导出封装的请求方法
export const http = {
    get<T=any>(url: string, config?: AxiosRequestConfig) : Promise<T> {
      return service.get(url, config)
    },
  
    post<T=any>(url: string, data?: object, config?: AxiosRequestConfig) :Promise<T> {
      return service.post(url, data, config)
    },
  
    put<T=any>(url: string, data?: object, config?: AxiosRequestConfig) :Promise<T> {
      return service.put(url, data, config)
    },
  
    delete<T=any>(url: string, config?: AxiosRequestConfig) : Promise<T> {
      return service.delete(url, config)
    }
}

export default service


const msgErr = (msg:string) => {
    ElMessage({
        message: msg,
        type: 'error'
    });
}
 