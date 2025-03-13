    // 注意：路由地址的 path 必须配置成以下这样，有几个参数就配置几个参数
    // path : '/testPage/:title/:id/:type/:date'
export const openNewWindow = ()=>{
    // 打开新窗口
    let left = ((window.screen.width / 2) - 180) / 2   // 新窗口居中
    let width = (window.screen.width / 2) + 180        // 新窗口的宽度
    // 新窗口要设置的参数
    let params = `height=${window.screen.height},width=${width},top=0,left=${left},toolbar=no,menubar=no,scrollbars=no,resizable=yes,location=yes,status=no`
    //window.open(`/testPage/${this.title}/${this.id}/${this.type}/${this.date}`,'_blank',params)
}
     
export const openNewTab = (globalProperties:any) => {
    // 打开新标签
    let routeData = globalProperties.$router.resolve(({
    path: '/testPage', // path 要跳转的路由地址
    // query 要传递的参数
    query: { 

     }
    }))
    window.open(routeData.href,'_blank')
 }
