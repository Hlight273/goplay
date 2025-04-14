import axios,{AxiosError, AxiosRequestConfig, AxiosResponse} from 'axios'
import router from "@/router";
import { ResultCode } from '@/util/webConst';
import { ElMessage } from 'element-plus';
import { webRoot } from "./webConst";
 
const service = axios.create({
    baseURL: webRoot,
    timeout: 30000,
    headers: {
      'Cache-Control': 'max-age=3600'
    }
})
 
// request 拦截器
// 可以自请求发送前对请求做一些处理
// 比如统一加token，对请求参数统一加密
service.interceptors.request.use(config => {
    // 避免覆盖 multipart/form-data
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json;charset=utf-8';
    }
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
            response.config.timeout = 60000;// 下载文件的超时时间
            return response;
        }
        if (typeof res === 'string') { // 兼容服务端返回的字符串数据
            res = res ? JSON.parse(res) : res
        }

        if (response.headers['daily-points-added']?.toLowerCase() === 'true') {//每日积分的返回提示
          const points = response.headers['points-amount']
          console.log("每日积分的返回提示");
          
          ElMessage({
            message: `💴恭喜获得每日登录奖励：${points}积分！`,
            type: 'success',
            duration: 3000
          })
        }

        //ResultCode不是20000 需要统一处理的写下面，由于需要兼容游客，不直接跳转了
        if (res.code === ResultCode.EXPIRED) {//token过期
            // 使用try-catch包裹localStorage操作，避免在Firefox中可能出现的问题
            try {
              // 延迟执行localStorage操作，避免Firefox中的同步问题
              setTimeout(() => {
                if(localStorage.getItem("token")) {
                  localStorage.removeItem("token");
                  localStorage.removeItem("userid");
                  console.log("已清除过期的token");
                }
              }, 0);
            } catch (e) {
              console.error("清除token时出错:", e);
            }
           // msgErr("错误："+res.message);
            //router.replace("/login")
            return Promise.reject()
            //return Promise.reject(new Error(res.message))
        }
        else if (res.code === ResultCode.ERROR){ //业务错误，默认的业务错误全都是发这个消息
            msgErr("错误："+res.message);
            return Promise.reject(new Error(res.message))
        }else if(res.code === ResultCode.UPLOAD_ERROR){ //上传文件错误
            msgErr("传输错误："+res.message);
            return Promise.reject(new Error(res.message))
        }
        return res;
    },
    (error:AxiosError) => {//非后端业务逻辑，网络错误
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
    },

    uploadWithProgress<T=any>(
        url: string, 
        formData: FormData,
        onProgress?: (progress: number) => void
    ): Promise<T> {
        return service.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            },
            timeout: 600000 // 上传文件设置更长的超时时间
        });
    }
}

export default service


const msgErr = (msg:string) => {
    ElMessage({
        message: msg,
        type: 'error'
    });
}

export const downloadWithAxios = (url: string, filename: string):Promise<string|void>  => {
    return service({
      url,
      method: "GET",
      responseType: "blob", // 关键
    })
      .then((response) => {
        const blob = new Blob([response.data]);
        const a = document.createElement("a");
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        //URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
        return objectUrl
      })
      .catch((error) => {
        console.error("下载失败:", error);
      });
  };

export const downloadLargeFile = async (url: string, filename: string) => {
    const response = await fetch(url);
    const reader = response.body?.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });
  
    const blob = await new Response(stream).blob();
    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    //URL.revokeObjectURL(objectUrl);
    document.body.removeChild(a);
    return objectUrl
  };

export const getFileBlobFromServer = (url: string, filename: string ,onProgress?: (progress: number) => void):Promise<string|void> => {
    return service({
        url,
        method: "GET",
        responseType: "blob",
        timeout: 120000,
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
          }
      }
    }).then((response) => {
        const blob = new Blob([response.data]);
        const objectUrl:string = URL.createObjectURL(blob);
        if (onProgress) {
            onProgress(100);
        }
        return objectUrl
    }) .catch((error) => {
        console.error("创建Blob失败:", error);

    });
};


 