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

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
      console.error("Invalid date string:", dateString);
      return "无效日期";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() 返回 0-11
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
};


// 原文链接：https://blog.csdn.net/XH_jing/article/details/135824934
export function copyToClipboard(textToCopy:string) {
    // navigator clipboard 需要https等安全上下文
  if (navigator.clipboard && window.isSecureContext) {
      // navigator clipboard 向剪贴板写文本
      return navigator.clipboard.writeText(textToCopy);
  } else {
       // document.execCommand('copy') 向剪贴板写文本
      let input = document.createElement('input')
      input.style.position = 'fixed'
      input.style.top = '-10000px'
      input.style.zIndex = '-999'
      document.body.appendChild(input)
      input.value = textToCopy
      input.focus()
      input.select()
      try {
        let result:boolean = document.execCommand('copy')
        document.body.removeChild(input)
        if (!result) {
          console.log('复制失败')
        } else {
          console.log('复制成功')
        }
      } catch (e) {
        document.body.removeChild(input)
        alert('当前浏览器不支持复制功能，请检查更新或更换其他浏览器操作')
      }
  }
}

export function isNullorEmpty(text:string):boolean {
  return text == null || text=='';
}
export function isNothing(text:string|null|undefined):boolean {
  return text == null || text==undefined || text=='';
}

interface DragOptions {
  handleClass?: string;  // 拖拽把手的类名
  boundaryPadding?: number;  // 边界padding
}

export const createDraggable = (options: DragOptions = {}) => {
  return {
    mounted(el: HTMLElement) {
      const handle:HTMLElement|null = options.handleClass 
        ? el.querySelector(`.${options.handleClass}`)
        : el;
      
      if (!handle) return;

      handle.style.cursor = 'move';
      handle.onmousedown = (e: MouseEvent) => {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const disX = e.clientX - rect.left;
        const disY = e.clientY - rect.top;
        
        document.onmousemove = (e: MouseEvent) => {
          let left = e.clientX - disX;
          let top = e.clientY - disY;
          
          // 防止元素拖出视口
          const padding = options.boundaryPadding || 0;
          const maxX = window.innerWidth - el.offsetWidth - padding;
          const maxY = window.innerHeight - el.offsetHeight - padding;
          
          left = Math.min(maxX, Math.max(padding, left));
          top = Math.min(maxY, Math.max(padding, top));
          
          el.style.left = left + 'px';
          el.style.top = top + 'px';
        };
        
        document.onmouseup = () => {
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    }
  };
};


