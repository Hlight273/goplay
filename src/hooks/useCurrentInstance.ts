import { getCurrentInstance } from "vue";
import type { ComponentInternalInstance } from "vue";
 
export default function useCurrentInstance() {
  const instance = getCurrentInstance();
  //console.log(instance);
  
  if (!instance) {
    console.warn("useCurrentInstance() called outside of setup or from a component instance");
    return { globalProperties: null }; 
  }
  const { appContext } = getCurrentInstance() as ComponentInternalInstance;
  const globalProperties = appContext.config.globalProperties;
  return {
    globalProperties,
  };
}
 
 
/*在组件中使用
import useCurrentInstance from "@/hooks/useCurrentInstance";
const { globalProperties } = useCurrentInstance();
globalProperties.$axios(url).then(res=>{})
*/

                        
//原文链接：https://blog.csdn.net/weixin_47239456/article/details/132281059