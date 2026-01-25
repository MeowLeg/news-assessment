import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import api from './api'

// 月份选择
const date_v = dayjs().format('YYYY-MM')
export const month = ref(date_v)
export const selectedMonth = ref(date_v)
export const monthOptions = ref([])

// 登录状态
export const isLoggedIn = ref(false)
export const userData = ref({})
export const username = computed(() => userData.value.name || '')

// 数据状态
export const newsList = ref([])
export const totalArticles = ref(0) // 文章总数，用于分页
export const reporters = ref([])
export const reporterMonthlyStats = ref([])
export const loading = ref(false)
export const error = ref(null)

// 从API获取文章列表
export const fetchArticles = async (year = 2025, month = 12, page = 1, limit = 20, keyword = null, reporter_id = null, media_type = null) => {
  loading.value = true
  error.value = null
  try {
    console.log('开始获取文章数据，参数:', { year, month, page, limit })
    let payload = { year, month, page, limit }
    if (keyword) payload.keyword = keyword
    if (reporter_id) payload.reporter_id = reporter_id
    if (media_type) payload.tv_or_paper = media_type - 1
    const response = await api.getArticles(payload)
    console.log('API完整响应:', response)
    
    // 检查响应是否是数组
    if (Array.isArray(response)) {
      console.log('API返回的是数组，可能直接是文章列表:', response)
      // 转换API数据格式以适应现有组件
      newsList.value = response.map(article => {
        const textReporter = article.reporter_scores ? article.reporter_scores.filter(
          score => score.reporter_category_id === 3
        ).reduce(
          (prev, curr) => prev + ", " + curr.reporter_name + curr.score + '分'
        ) : ''
        const photoReporter = article.reporter_scores ? article.reporter_scores.filter(
          score => score.reporter_category_id === 4 || score.reporter_category_id === 5
        ).reduce(
          (prev, curr) => prev + ", " + curr.reporter_name + curr.score + '分'
        ) : ''
        return {
          id: article.id ? article.id.toString() : Math.random().toString(36).substr(2, 9),
          title: article.title || article.article_title || '未命名文章',
          publishDate: article.publishDate || article.date || `${year}-${String(month).padStart(2, '0')}-01`,
          textReporter,
          photoReporter,
          baseScore: typeof article.score_basic === 'number' ? Math.round(article.score_basic) : 0,
          executeScore: typeof article.score_action === 'number' ? Math.round(article.score_action) : 0,
          // bonus: 0,
          // penalty: 0,
          totalScore: typeof article.score_basic === 'number' && typeof article.score_action === 'number' ? Math.round(article.score_basic + article.score_action) : 0,
          tv_url: article.tv_url || article.tvUrl || '',
          reporter_scores: article.reporter_scores || [],
          tv_or_paper: article.tv_or_paper, // 默认为电视
          paper_url: article.paper_url,
          page_name: article.page_name || '',
          page_meta_id: article.page_meta_id || 0,
          state: article.state,
        }
      })
      console.log('转换后的文章列表:', newsList.value)
      return
    }
    
    // 检查响应是否是对象
    if (response && typeof response === 'object') {
      console.log('API返回的是对象，完整响应:', response)
      console.log('API返回的是对象，检查是否有success字段:', response.success)
      
      // 检查是否有success字段
      if (response.success) {
        console.log('API返回的数据结构:', Object.keys(response.data || {}))
        console.log('API返回的完整data字段:', response.data)
        
        // 尝试从不同的字段获取文章列表
        const articles = response.data?.articles || response.articles || response.data || []
        console.log('从response.data.articles获取到的文章:', response.data?.articles)
        console.log('从response.articles获取到的文章:', response.articles)
        console.log('从response.data获取到的文章:', response.data)
        console.log('最终获取到的文章:', articles)
        console.log('获取到的文章数量:', articles.length)
        
        // 保存文章总数，用于分页
        let apiTotal = response.data?.total || response.total
        // 如果API没有返回total字段，根据返回的articles数量和当前页码、每页条数来估算
        if (apiTotal === undefined || apiTotal === null) {
          // 如果当前是第一页，且返回的文章数量小于limit，说明这是最后一页
          if (page === 1 && articles.length < limit) {
            apiTotal = articles.length
          } else {
            // 否则，假设还有更多数据，总数设置为当前页码*每页条数
            apiTotal = page * limit
          }
        }
        totalArticles.value = apiTotal
        console.log('从response.data.total获取到的总数:', response.data?.total)
        console.log('从response.total获取到的总数:', response.total)
        console.log('最终设置的总数:', totalArticles.value)
        console.log('文章总数:', totalArticles.value)
        
        if (Array.isArray(articles)) {
          // 转换API数据格式以适应现有组件
          newsList.value = articles.map(article => {
            console.log('处理文章:', article.id || '未知ID', article.title || '无标题')
            console.log('文章原始数据:', article)
            
            // 处理记者信息
            const textReporter = article.reporter_scores && article.reporter_scores.length > 0 ? article.reporter_scores.filter(
              score => score.reporter_category_id === 3
            ).reduce(
              (prev, curr) => (prev ? prev + ', ' : '') + curr.reporter_name + curr.score + '分', ''
            ) : ''
            const photoReporter = article.reporter_scores && article.reporter_scores.length > 0 ? article.reporter_scores.filter(
              score => score.reporter_category_id === 4 || score.reporter_category_id === 5
            ).reduce(
              (prev, curr) => (prev ? prev + ', ' : '') + curr.reporter_name + curr.score + '分', ''
            ) : ''
            
            // 处理分数字段
            const scoreBasic = article.score_basic || article.baseScore || article.base_score || 0
            const scoreAction = article.score_action || article.executeScore || article.execute_score || 0
            
            const transformedArticle = {
              id: article.id ? article.id.toString() : Math.random().toString(36).substr(2, 9),
              title: article.title || article.article_title || '未命名文章',
              publishDate: article.publishDate || article.date || `${article.publish_year || year}-${String(article.publish_month || month).padStart(2, '0')}-${String(article.publish_day || 1).padStart(2, '0')}`,
              textReporter: textReporter,
              photoReporter: photoReporter,
              baseScore: typeof scoreBasic === 'number' ? Math.round(scoreBasic) : 0,
              executeScore: typeof scoreAction === 'number' ? Math.round(scoreAction) : 0,
              bonus: 0,
              penalty: 0,
              totalScore: typeof scoreBasic === 'number' && typeof scoreAction === 'number' ? Math.round(scoreBasic + scoreAction) : 0,
              tv_url: article.tv_url || article.tvUrl || '',
              reporter_scores: article.reporter_scores || [],
              tv_or_paper: article.tv_or_paper, // program_id
              program_id: article.tv_or_paper, // 
              media_type: article.media_type, // 默认为电视
              program_name: article.program_name || '', // 默认为电视
              paper_url: article.paper_url,
              page_name: article.page_name,
              page_meta_id: article.page_meta_id,
              state: article.state,
              html_content: article.html_content || '',
              character_count: article.character_count || 0,
            }
            
            console.log('转换后的文章:', transformedArticle)
            return transformedArticle
          })
          
          console.log('最终文章列表:', newsList.value)
        } else {
          console.error('articles不是数组:', articles)
          newsList.value = []
        }
      } else {
        // 如果没有success字段或者success为false，尝试直接使用response作为文章列表
        console.log('API返回的success为false，尝试直接使用response.data作为文章列表')
        const articles = response.data || response
        if (Array.isArray(articles)) {
          newsList.value = articles.map(article => ({
            id: article.id ? article.id.toString() : Math.random().toString(36).substr(2, 9),
            title: article.title || article.article_title || '未命名文章',
            publishDate: article.publishDate || article.date || `${year}-${String(month).padStart(2, '0')}-01`,
            textReporter: article.reporter || article.journalist || article.author || '未知记者',
            photoReporter: article.photoReporter || article.photographer || '',
            baseScore: typeof article.score_basic === 'number' ? Math.round(article.score_basic) : 0,
            executeScore: typeof article.score_action === 'number' ? Math.round(article.score_action) : 0,
            bonus: 0,
            penalty: 0,
            totalScore: typeof article.score_basic === 'number' && typeof article.score_action === 'number' ? Math.round(article.score_basic + article.score_action) : 0,
            tv_url: article.tv_url || article.tvUrl || '',
            reporter_scores: article.reporter_scores || [],
            tv_or_paper: article.tv_or_paper, // 默认为电视
            paper_url: article.paper_url,
            page_name: article.page_name || '',
            page_meta_id: article.page_meta_id || 0,
            state: article.state,
          }))
          // 重置文章总数
          totalArticles.value = articles.length
        } else {
          console.error('API返回失败:', response)
          newsList.value = []
          // 重置文章总数
          totalArticles.value = 0
        }
      }
    } else {
      console.error('API返回的不是对象或数组:', response)
      newsList.value = []
      // 重置文章总数
      totalArticles.value = 0
    }
  } catch (err) {
    error.value = '获取文章列表失败: ' + (err.message || err)
    console.error('获取文章列表失败:', err)
    newsList.value = []
    // 重置文章总数
    totalArticles.value = 0
  } finally {
    loading.value = false
    console.log('获取文章数据完成，最终列表长度:', newsList.value.length)
  }
}

// 从API获取记者列表
export const fetchReporters = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await api.getReporters()
    console.log('记者列表API响应:', response)
    
    if (response && response.success) {
      console.log('API返回的记者列表:', response.data)
      
      // 确保response.data是数组
      const reportersData = Array.isArray(response.data) ? response.data : []
      console.log('转换后的记者列表:', reportersData)
      
      // 保存记者列表，用于筛选等功能
      reporters.value = reportersData
    } else {
      // 如果API调用失败，使用空数组作为备选
      reporters.value = []
      console.error('获取记者列表失败，API返回:', response)
    }
  } catch (err) {
    error.value = '获取记者列表失败: ' + (err.message || err)
    console.error('获取记者列表失败:', err)
    // 发生错误时，使用空数组作为备选
    reporters.value = []
  } finally {
    loading.value = false
  }
}

// 从API获取记者月度统计
export const fetchReporterMonthlyStats = async (year = 2025, month = 12) => {
  loading.value = true
  error.value = null
  try {
    const response = await api.calcMonthly({ year, month })
    if (response.success) {
      console.log('API返回的记者月度统计:', response.data)
      reporterMonthlyStats.value = response.data
    }
  } catch (err) {
    error.value = '获取记者月度统计失败'
    console.error('获取记者月度统计失败:', err)
  } finally {
    loading.value = false
  }
}

// 保存文章（新增或编辑）
export const saveArticle = async (articleData) => {
  loading.value = true
  error.value = null
  try {
    // 转换表单数据为API预期格式
    const publishDate = typeof articleData.publishDate === 'string' ? articleData.publishDate : dayjs(articleData.publishDate).format('YYYY-MM-DD')
    const apiData = {
      id: articleData.id ? parseInt(articleData.id) : null,
      title: articleData.title || '',
      tv_or_paper: articleData.program_id || 0, // 应为program_id
      state: articleData.state, // 默认为启用状态
      // 只有在有publishDate时才解析日期字段
      ...(publishDate && {
        publish_year: parseInt(publishDate.split('-')[0]),
        publish_month: parseInt(publishDate.split('-')[1]),
        publish_day: parseInt(publishDate.split('-')[2])
      }),
      tv_url: articleData.tv_url || '',
      page_meta_id: articleData.page_meta_id || 0,
      page_name: articleData.page_name || ''
    }
    
    const response = await api.saveArticle(apiData)
    if (response.success) {
      // 保存成功后刷新数据
      return response.data
    }
  } catch (err) {
    error.value = '保存文章失败'
    console.error('保存文章失败:', err)
    throw err
  } finally {
    loading.value = false
  }
}

// 给文章打分
export const scoreArticle = async (scoreData) => {
  loading.value = true
  error.value = null
  try {
    // 转换表单数据为API预期格式
    const apiData = {
      article_id: parseInt(scoreData.id),
      // 表单中的分数是整数，直接使用
      score_basic: Math.round(scoreData.baseScore),
      score_action: Math.round(scoreData.executeScore),
      // 处理reporter_scores，如果存在则使用
      reporter_scores: scoreData.reporter_scores || []
    }
    
    const response = await api.scoreArticle(apiData)
    if (response.success) {
      // 打分成功后刷新数据
      return response.data
    }
  } catch (err) {
    error.value = '文章打分失败'
    console.error('文章打分失败:', err)
    throw err
  } finally {
    loading.value = false
  }
}

// 所有记者列表
export const allReporters = computed(() => {
  // 确保reporters.value是数组
  const reportersArray = Array.isArray(reporters.value) ? reporters.value : []
  
  // 从记者列表中提取记者名称
  const reporterNames = reportersArray.map(reporter => {
    // 处理不同的数据格式，确保能正确获取记者名称
    if (typeof reporter === 'string') {
      return reporter
    } else if (reporter && typeof reporter === 'object') {
      return reporter.name || reporter.reporter_name || reporter.reporter || '未知记者'
    }
    return '未知记者'
  })
  
  // 确保记者名称列表中没有重复项
  const uniqueReporterNames = [...new Set(reporterNames)]
  
  // 确保列表不为空，如果为空则添加一个默认值
  return uniqueReporterNames.length > 0 ? uniqueReporterNames : ['未知记者']
})

// 统计数据
export const avgTotalScore = computed(() => {
  if (reporterStats.value.length === 0) return 0
  const sum = reporterStats.value.reduce((acc, item) => acc + (item.total || 0), 0)
  return sum / reporterStats.value.length
})

export const maxTotalScore = computed(() => {
  if (reporterStats.value.length === 0) return 0
  return Math.max(...reporterStats.value.map(item => item.total || 0))
})

export const minTotalScore = computed(() => {
  if (reporterStats.value.length === 0) return 0
  return Math.min(...reporterStats.value.map(item => item.total || 0))
})

// 记者统计数据
export const reporterStats = computed(() => {
  // 优先使用API返回的统计数据
  if (reporterMonthlyStats.value.length > 0) {
    return reporterMonthlyStats.value.map(stat => {
      // 处理加减分（根据用户反馈，加减分在月度记者统计中）
      // API返回的stat对象中可能没有bonus和penalty字段，直接使用默认值0
      // const bonus = 0 // 暂时设为0，根据实际API返回调整
      // const penalty = 0 // 暂时设为0，根据实际API返回调整
      
      // 计算总分，直接使用API返回的total_score字段（如果有），否则根据event_score和subtotal_score计算
      // const totalScore = stat.total_score ? stat.total_score / 10 : ((stat.event_score + (stat.subtotal_score || 0)) / 10) + bonus - penalty
      
      // HERE
      return {
        id: stat.id || 0,
        name: stat.name || '未知记者', // 确保有默认值
        phone: stat.phone || '', // 确保有默认值
        department: stat.department || '', // 确保有默认值
        type: stat.reporter_category_name || '未知类型', // 确保有默认值
        count: stat.article_count || 0, // 如果API返回中有count字段则使用，否则默认为1
        // 新闻得分合计（不包含专项赋分和业务协同）
        newsTotal: stat.article_score || 0,
        total: stat.total_score || 0,
        // 显示加减分信息
        bonus: stat.monthly_add_score,
        penalty: stat.monthly_sub_score,
        // 专项赋分合计和业务协同合计
        specialTotal: stat.event_score || 0,
        collabTotal: stat.cooperation_score || 0,
      }
    })
  }
  
  //  fallback到本地计算（如果API数据不可用）
  const stats = {}
  
  newsList.value.forEach(item => {
    // 处理文字记者
    item.textReporter.split(',').forEach(r => {
      const reporter = r.trim()
      if (!reporter) return
      if (!stats[reporter + '_text']) {
        stats[reporter + '_text'] = {
          name: reporter,
          type: '文字记者',
          count: 0,
          newsTotal: 0,
          total: 0,
          bonus: 0,
          penalty: 0,
          specialTotal: 0,
          collabTotal: 0
        }
      }
      stats[reporter + '_text'].count++
      stats[reporter + '_text'].newsTotal += item.totalScore
      stats[reporter + '_text'].total += item.totalScore
    })
    
    // 处理摄影记者
    item.photoReporter.split(',').forEach(r => {
      const reporter = r.trim()
      if (!reporter) return
      if (!stats[reporter + '_photo']) {
        stats[reporter + '_photo'] = {
          name: reporter,
          type: '摄影记者',
          count: 0,
          newsTotal: 0,
          total: 0,
          bonus: 0,
          penalty: 0,
          specialTotal: 0,
          collabTotal: 0
        }
      }
      stats[reporter + '_photo'].count++
      stats[reporter + '_photo'].newsTotal += item.totalScore
      stats[reporter + '_photo'].total += item.totalScore
    })
  })
  
  // 转换为数组并排序
  return Object.values(stats).sort((a, b) => b.total - a.total)
})
