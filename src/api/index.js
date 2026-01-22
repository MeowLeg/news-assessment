import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'https://develop.xinlantech.cn', // 已修改为实际的API服务地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    console.log('请求拦截器处理:', config.url)
    // 从localStorage获取登录信息
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const savedUserData = localStorage.getItem('userData')
    
    console.log('登录状态:', isLoggedIn)
    
    if (isLoggedIn && savedUserData) {
      const userData = JSON.parse(savedUserData)
      // 添加account和sessionid到请求头
      config.headers.account = userData.name
      config.headers.sessionid = userData.session_id
      console.log('添加认证头:', { account: config.headers.account, sessionid: config.headers.sessionid })
    }
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    console.log('响应拦截器成功处理:', response.config.url)
    // 统一处理响应数据
    return response.data
  },
  error => {
    // 统一处理错误
    console.error('API请求错误:', error)
    
    // 处理401未授权错误，添加更多安全检查
    if (error && error.response && error.response.status === 401) {
      console.log('处理401未授权错误，清理登录状态并跳转')
      // 清理登录状态和用户数据
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userData')
      
      // 跳转到登录页面
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// API接口定义
const api = {
  // 获取报纸版面meta信息
  getPageMeta() {
    return apiClient.get('/zscmscore/get_page_meta')
  },

  // 获取记者信息列表
  getReporters() {
    return apiClient.get('/zscmscore/get_reporters')
  },

  // 获取文章列表（带分页）
  getArticles(params = {}) {
    // 默认参数：year=2025，month=12
    const defaultParams = {
      year: 2025,
      month: 12,
      page: 1,
      limit: 10
    }
    return apiClient.get('/zscmscore/get_articles', { params: { ...defaultParams, ...params } })
  },

  // 获取记者业务得分
  getReporterEvents(params = {}) {
    // 默认参数：year=2025，month=12
    const defaultParams = {
      year: 2025,
      month: 12
    }
    return apiClient.get('/zscmscore/get_reporter_events', { params: { ...defaultParams, ...params } })
  },

  // 获取记者阅读总分列表
  calcMonthly(params = {}) {
    // 默认参数：year=2025，month=12
    const defaultParams = {
      year: 2025,
      month: 12
    }
    return apiClient.get('/zscmscore/calc_monthly', { params: { ...defaultParams, ...params } })
  },

  // 新建、更新或删除文章
  saveArticle(data) {
    return apiClient.post('/zscmscore/article', data)
  },

  // 给文章打分
  scoreArticle(data) {
    return apiClient.post('/zscmscore/score', data)
  },
  
  // 获取记者月度加分信息
  getMonthlyAddScore(params = {}) {
    // 默认参数：year=2025，month=12
    const defaultParams = {
      year: 2025,
      month: 12
    }
    return apiClient.get('/zscmscore/get_monthly_add_score', { params: { ...defaultParams, ...params } })
  },

  // 获取记者月度减分信息
  getMonthlySubScore(params = {}) {
    // 默认参数：year=2025，month=12
    const defaultParams = {
      year: 2025,
      month: 12
    }
    return apiClient.get('/zscmscore/get_monthly_sub_score', { params: { ...defaultParams, ...params } })
  },
  
  // 新建、更新或删除记者月度加分
  monthlyAddScore(data) {
    return apiClient.post('/zscmscore/monthly_add_score', data)
  },
  
  // 新建、更新或删除记者月度扣罚
  monthlySubScore(data) {
    return apiClient.post('/zscmscore/monthly_sub_score', data)
  },
  
  // 获取记者事件得分列表
  getEventScores(params = {}) {
    return apiClient.get('/zscmscore/get_event_scores', { params })
  },
  
  // 获取记者业务协同列表
  getCooperationScores(params = {}) {
    return apiClient.get('/zscmscore/get_cooperation_scores', { params })
  },
  
  // 新建、更新或删除记者业务事件
  saveEvent(data) {
    return apiClient.post('/zscmscore/event', data)
  },
  
  // 新建、更新或删除业务协作
  saveCooperation(data) {
    return apiClient.post('/zscmscore/cooperation', data)
  },
  
  // 用户登录
  login(data) {
    return apiClient.post('/zscmscore/login', data)
  },

  // 新建、更新或删除记者信息
  saveReporter(data) {
    return apiClient.post('/zscmscore/reporter', data)
  },

  // 获取记者工种分类
  getReporterCategories() {
    return apiClient.get('/zscmscore/get_reporter_categories')
  },

  // 获取节目列表
  getPrograms() {
    return apiClient.get('/zscmscore/get_programs')
  }
}

export default api
