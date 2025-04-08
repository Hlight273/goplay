export enum ResultCode {
    SUCCESS = 20000,
    ERROR = 20001,
    EMPTY = 20002,
    EXPIRED = 20003,
    UPLOAD_ERROR = 30000,
}
export enum OrderStatus {
    CREATED = "已创建",
    PAYING = "支付中",
    PAID = "支付成功",
    FAILED = "支付失败",
    EXPIRED = "已过期",
}

const isLocalTest:boolean = false;
export const isServerRelease:boolean = process.env.VUE_APP_IS_SERVER_RELEASE === 'true';

const RUrl:string = isServerRelease?"117.72.10.111":"192.168.3.55";

const FinalIp = isLocalTest?"localhost":RUrl

export const websocketRoot = isServerRelease?`http://${FinalIp}/ws`:`http://${FinalIp}:8081/ws`;
export const webRoot = isServerRelease?`http://${FinalIp}/api`:`http://${FinalIp}:8081`;

export const needDebugOutpot = true;

export const allowedAudioMimeTypes:Array<string> = [
        "audio/mpeg",  // MP3
        "audio/wav",   // WAV
        "audio/flac",  // FLAC
        "audio/x-flac",  // FLAC
        "audio/ogg"  // OGG
    ]

export const maxAudioFileSize = 100 * 1024 * 1024; // 允许上传最大100MB的音频文件

export const allowedImageMimeTypes: Array<string> = [
    "image/png",  // PNG
    "image/jpeg", // JPG
    "image/webp", // WebP
    "image/bmp"   // BMP
];

export const maxImageFileSize = 10 * 1024 * 1024; // 允许上传最大10MB的图片文件