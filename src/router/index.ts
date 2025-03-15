import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
      path: '/',
      redirect: '/home'
  },
  {
      path: '/login',
      name: 'login',
      component: () => import("@/views/login.vue")
  },
  {
      path: '/register',
      name: 'register',
      component: () => import("@/views/register.vue")
  },
  {
      path: '/home',
      name: 'home',
      component: () => import("@/views/home.vue")
  },
  {
    path: '/pay',
    name: 'pay',
    component: () => import("@/views/payment.vue")
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/404.vue'),
  },
  // 未知路由重定向
  {
    path: '/:pathMatch(.*)',
    redirect: '/404',
  }
]


const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 检查是否存在于免登陆白名单
function inWhiteList(toPath:string) {
  const whiteList = ['/login', '/register', '/404']
  const path = whiteList.find((value) => {
      // 使用正则匹配
      const reg = new RegExp('^' + value)
      return reg.test(toPath)
  })
  return !!path
}

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token")

  if (inWhiteList(to.path)) {
      next()
  } else {
      //用户已登录
      if (token) {
          next()
      } else {
          next(`/login`)
      }
  }
})

export default router
