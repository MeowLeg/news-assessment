<template>
  <div class="assessment-container">
    <!-- 页面标题和操作区 -->
    <div class="header">
      <h2>{{ selectedMonth }} 非3部门稿件打分</h2>
      <div class="header-actions">
        <el-select v-model="selectedMonth" @change="changeMonth" placeholder="选择月份">
          <el-option
            v-for="m in monthOptions"
            :key="m.value"
            :label="m.label"
            :value="m.value"
          />
        </el-select>
        <el-button type="success" icon="Download" @click="exportToExcel">导出Excel</el-button>
      </div>
    </div>

    <!-- 按记者分组显示稿件 -->
    <div class="statistics-card" style="margin-top: 20px">
      <el-card>
        <div v-if="reporterArticles.length === 0 && !loading" class="empty-state">
          <div>暂无数据</div>
        </div>

        <div v-for="reporter in reporterArticles" :key="reporter.id" class="reporter-group">
          <!-- 记者信息头部 -->
          <div class="reporter-header">
            <div class="reporter-info">
              <span class="reporter-name">{{ reporter.name }}</span>
            </div>
            <div class="reporter-scores">
              <span class="score-item">稿件数: {{ reporter.count }}</span>
              <span class="score-item total-score">新闻得分: {{ reporter.newsTotal }}</span>
            </div>
          </div>

          <!-- 该记者的稿件列表 -->
          <div class="articles-list">
            <el-table :data="reporter.articles" border stripe style="width: 100%">
              <template #empty>
                <div>该记者本月暂无稿件</div>
              </template>
              <el-table-column prop="title" label="稿件标题" min-width="300">
                <template #default="scope">
                  <span
                    v-if="scope.row.paper_url"
                    class="article-title-link"
                    @click="openPaperUrl(scope.row.paper_url)"
                  >
                    {{ scope.row.title }}
                  </span>
                  <span v-else>{{ scope.row.title }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="publishDate" label="发布日期" width="120" />
              <el-table-column prop="page_number" label="版面号" width="100" />
              <el-table-column prop="page_name" label="版面/栏目" width="120" />
              <el-table-column prop="score" label="稿件得分" width="100">
                <template #default="scope">
                  <div class="clickable-cell" @click="openScoreDialog(reporter, scope.row)">
                    {{ scope.row.score }}
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 打分弹窗 -->
    <el-dialog
      v-model="scoreDialogVisible"
      title="稿件打分"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="scoreFormRef"
        :model="scoreForm"
        :rules="scoreFormRules"
        label-width="100px"
      >
        <el-form-item label="记者姓名">
          <el-input v-model="scoreForm.reporterName" disabled />
        </el-form-item>
        <el-form-item label="稿件标题">
          <el-input v-model="scoreForm.title" disabled />
        </el-form-item>
        <el-form-item label="发布日期">
          <el-input v-model="scoreForm.publishDate" disabled />
        </el-form-item>
        <el-form-item label="分数" prop="score">
          <el-input-number
            v-model="scoreForm.score"
            :min="0"
            :max="200"
            :precision="0"
            style="width: 100%"
          />
          <span style="margin-left: 10px; color: #999;">(0-200分)</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitScore">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import api from '../api/index.js'
import { abnormalArticles, loading, fetchAbnormalArticles } from '../store.js'

// 月份选择
const selectedMonth = ref(dayjs().format('YYYY-MM'))
const monthOptions = ref([])

// 按记者分组稿件
const reporterArticles = computed(() => {
  const map = {}
  abnormalArticles.value.forEach(article => {
    const scores = article.reporter_scores || []
    scores.forEach(rs => {
      const rid = rs.reporter_id || rs.reporter_name
      if (!map[rid]) {
        map[rid] = {
          id: rid,
          name: rs.reporter_name || '未知记者',
          categoryId: rs.reporter_category_id || 0,
          articles: []
        }
      }
      map[rid].articles.push({
        article_id: article.id,
        title: article.title || '未命名文章',
        publishDate: article.publishDate || '',
        page_number: article.page_meta_id || '',
        page_name: article.page_name || '',
        paper_url: article.paper_url || '',
        score: rs.score || 0,
        reporter_id: rs.reporter_id,
        reporter_name: rs.reporter_name,
        reporter_category_id: rs.reporter_category_id
      })
    })
  })
  return Object.values(map).map(r => ({
    ...r,
    count: r.articles.length,
    newsTotal: r.articles.reduce((sum, a) => sum + a.score, 0)
  })).sort((a, b) => b.newsTotal - a.newsTotal)
})

// 打分弹窗
const scoreDialogVisible = ref(false)
const scoreFormRef = ref(null)
const currentReporter = ref(null)
const currentArticle = ref(null)

const scoreForm = reactive({
  reporterName: '',
  title: '',
  publishDate: '',
  score: 0
})

const scoreFormRules = reactive({
  score: [{ required: true, message: '请输入分数', trigger: 'change' }]
})

// 月份选项初始化
const initMonthOptions = () => {
  const options = []
  for (let i = 0; i < 12; i++) {
    const date = dayjs().subtract(i, 'month')
    options.push({
      label: date.format('YYYY年MM月'),
      value: date.format('YYYY-MM')
    })
  }
  monthOptions.value = options
}

// 加载数据
const loadData = async () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchAbnormalArticles(year, month)
}

// 切换月份
const changeMonth = async () => {
  await loadData()
  ElMessage.success(`已切换至${selectedMonth.value}`)
}

// 打开电子报
const openPaperUrl = (url) => {
  if (url) window.open(url, '_blank')
}

// 打开打分弹窗
const openScoreDialog = (reporter, article) => {
  currentReporter.value = reporter
  currentArticle.value = article

  scoreForm.reporterName = article.reporter_name
  scoreForm.title = article.title
  scoreForm.publishDate = article.publishDate
  scoreForm.score = article.score

  scoreDialogVisible.value = true
}

// 提交打分
const submitScore = async () => {
  try {
    await scoreFormRef.value.validate()

    const apiData = {
      article_id: currentArticle.value.article_id,
      reporter_scores: [{
        reporter_id: currentArticle.value.reporter_id,
        reporter_name: currentArticle.value.reporter_name,
        reporter_category_id: currentArticle.value.reporter_category_id,
        score: Math.round(scoreForm.score)
      }]
    }

    await api.scoreArticleSingle(apiData)
    ElMessage.success('打分成功')
    scoreDialogVisible.value = false
    await loadData()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('打分失败：' + (err.message || '未知错误'))
      console.error('打分失败:', err)
    }
  }
}

// 导出Excel
const exportToExcel = () => {
  const headers = ['记者姓名', '稿件数', '新闻得分合计', '稿件标题', '发布日期', '版面号', '版面/栏目', '稿件得分']
  const rows = [headers]
  let rowIdx = 0

  reporterArticles.value.forEach(reporter => {
    const reporterRowIdx = rowIdx + 1

    rows.push([
      reporter.name,
      reporter.count,
      '',
      '', '', '', '', ''
    ])
    rowIdx++

    const articleStartRow = rowIdx + 2
    reporter.articles.forEach(a => {
      rows.push([
        '', '', '',
        a.title,
        a.publishDate,
        a.page_number,
        a.page_name,
        a.score
      ])
      rowIdx++
    })
    const articleEndRow = rowIdx + 1

    if (reporter.articles.length > 0) {
      rows[reporterRowIdx][2] = { f: `SUM(H${articleStartRow}:H${articleEndRow})` }
    } else {
      rows[reporterRowIdx][2] = 0
    }
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${selectedMonth.value}非3部门打分`)
  XLSX.writeFile(wb, `${selectedMonth.value}非3部门稿件打分.xlsx`)
  ElMessage.success('导出成功')
}

// 初始化
onMounted(async () => {
  initMonthOptions()
  await loadData()
})
</script>

<style scoped>
.assessment-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.reporter-group {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.reporter-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #545c64;
  color: white;
}

.reporter-info {
  flex: 1;
}

.reporter-name {
  font-size: 18px;
  font-weight: bold;
}

.reporter-scores {
  display: flex;
  gap: 20px;
}

.score-item {
  font-size: 14px;
}

.total-score {
  font-weight: bold;
  font-size: 16px;
  color: #ffd700;
}

.articles-list {
  padding: 10px;
}

.article-title-link {
  color: #409EFF;
  cursor: pointer;
  text-decoration: underline;
}

.article-title-link:hover {
  color: #66B1FF;
}

.clickable-cell {
  cursor: pointer;
  padding: 8px 0;
  text-align: center;
}

.clickable-cell:hover {
  background-color: #f5f7fa;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
