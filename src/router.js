import { createRouter, createWebHistory } from 'vue-router'
import NewsList from './views/NewsList.vue'
import ReporterStats from './views/ReporterStats.vue'
import Login from './views/Login.vue'
import AbnormalScore from './views/AbnormalScore.vue'
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
    name: 'ReporterStats',
    component: ReporterStats,
    meta: { requiresAuth: true }
  },
  {
    path: '/news-list',
    name: 'NewsList',
    component: NewsList,
    meta: { requiresAuth: true }
  },
  {
    path: '/abnormal-score',
    name: 'AbnormalScore',
    component: AbnormalScore,
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
    next({ name: 'Login' })
    return
  }
  
  if (to.path === '/login' && isLoggedIn) {
    // 已登录但访问登录页，根据 department 重定向
    const savedUserData = localStorage.getItem('userData')
    let hasDept = false
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData)
        hasDept = !!parsed.department
      } catch (e) { /* ignore */ }
    }
    next({ name: hasDept ? 'ReporterStats' : 'NewsList' })
    return
  }

  // 已登录用户的页面访问控制
  if (isLoggedIn) {
    const savedUserData = localStorage.getItem('userData')
    let hasDept = false
    if (savedUserData) {
      try {
        const parsed = JSON.parse(savedUserData)
        hasDept = !!parsed.department
      } catch (e) { /* ignore */ }
    }

    // 无部门用户访问记者打分页 → 重定向到文章列表
    if (!hasDept && to.path === '/') {
      next({ name: 'NewsList' })
      return
    }

    // 无部门用户访问非3部门打分 → 重定向到文章列表
    if (!hasDept && to.path === '/abnormal-score') {
      next({ name: 'NewsList' })
      return
    }

    // 有部门用户访问文章列表页 → 重定向到记者打分页
    if (hasDept && to.path === '/news-list') {
      next({ name: 'ReporterStats' })
      return
    }
  }
  
  // 其他情况，正常访问
  next()
})

export default router
