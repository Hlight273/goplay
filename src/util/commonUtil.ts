import axios from "axios";

export function formatDuration(seconds: number): string {
    // 计算分钟和秒
    const totalMinutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // 计算小时和分钟
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // 格式化输出
    // 设置格式为 "hh:mm:ss" 或 "mm:ss" 根据小时数是否大于0来决定
    let formattedDuration: string;
    if (hours > 0) {
        formattedDuration = `${hours * 60 + minutes}:${String(remainingSeconds).padStart(2, '0')}`;
    } else {
        formattedDuration = `${totalMinutes}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    return formattedDuration;
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
 
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
 
    const i = Math.floor(Math.log(bytes) / Math.log(k));
 
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

