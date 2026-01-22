import { createRouter, createWebHistory } from 'vue-router'
import NewsList from './views/NewsList.vue'
import ReporterStats from './views/ReporterStats.vue'
import Login from './views/Login.vue'
import { isLoggedIn as storeIsLoggedIn } from './store'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'NewsList',
    component: NewsList,
    meta: { requiresAuth: true }
  },
  {
    path: '/reporter-stats',
    name: 'ReporterStats',
    component: ReporterStats,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory('/zscmwages/'),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // 检查用户是否已登录，优先使用store中的状态，fallback到localStorage
  const isLoggedIn = storeIsLoggedIn.value || localStorage.getItem('isLoggedIn') === 'true'
  
  if (requiresAuth && !isLoggedIn) {
    // 需要认证但未登录，重定向到登录页
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    // 已登录但访问登录页，重定向到首页
    next('/')
  } else {
    // 其他情况，正常访问
    next()
  }
})

export default router
