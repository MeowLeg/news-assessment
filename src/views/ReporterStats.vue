<template>
  <div class="assessment-container">
    <!-- 页面标题和操作区 -->
    <div class="header">
      <h2>{{ month }} 记者打分</h2>
      <div class="header-actions">
        <el-select v-model="selectedMonth" @change="changeMonth" placeholder="选择月份">
          <el-option
            v-for="m in monthOptions"
            :key="m.value"
            :label="m.label"
            :value="m.value"
          />
        </el-select>
        <el-button type="primary" icon="Plus" @click="openAddReporterDialog">新增记者</el-button>
        <el-button type="success" icon="Download" @click="exportReporterStats">导出记者打分</el-button>
      </div>
    </div>
    
    <!-- 增减分弹窗 -->
    <el-dialog
      v-model="scoreAdjustDialogVisible"
      :title="scoreAdjustForm.type === '1' ? '增分设置' : '减分设置'"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="scoreAdjustFormRef"
        :model="scoreAdjustForm"
        :rules="scoreAdjustFormRules"
        label-width="100px"
      >
        <el-form-item label="记者姓名">
          <el-input v-model="scoreAdjustForm.reporterName" disabled />
        </el-form-item>
        <el-form-item label="增减分数" prop="score">
          <el-input-number
            v-model="scoreAdjustForm.score"
            :min="-100"
            :max="100"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="增减类型" prop="type">
          <el-radio-group v-model="scoreAdjustForm.type" disabled>
            <el-radio label="1">加分</el-radio>
            <el-radio label="2">减分</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="理由" prop="reason">
          <el-input
            v-model="scoreAdjustForm.reason"
            type="textarea"
            rows="3"
            placeholder="请输入增减分理由"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreAdjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitScoreAdjust">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 专项赋分弹窗 -->
    <el-dialog
      v-model="specialScoreDialogVisible"
      :title="currentScoreType === 'special' ? '专项赋分设置' : '业务协同设置'"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="closeSpecialScoreDialog"
    >
      <div class="special-score-header">
        <el-input v-model="specialScoreForm.reporterName" disabled placeholder="记者姓名" style="width: 200px; margin-bottom: 20px;" />
        <el-button
          type="primary"
          size="small"
          icon="Plus"
          @click="openSpecialScoreItemDialog"
          style="margin-bottom: 20px;"
        >添加项目</el-button>
      </div>
      
      <!-- 专项赋分项目列表 -->
      <el-table 
        :data="specialScoreForm.items" 
        border 
        style="width: 100%"
      >
        <el-table-column prop="name" label="协作内容" min-width="200" />
        <el-table-column prop="score" label="分数" width="100" />
        <el-table-column prop="source" label="来源" width="150" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="openSpecialScoreItemDialog(scope.row, scope.$index)"
            >修改</el-button>
            <el-button
              size="small"
              type="warning"
              @click="removeSpecialScoreItem(scope.$index)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="closeSpecialScoreDialog">取消</el-button>
        <el-button type="primary" @click="submitSpecialScore">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 专项赋分项目修改弹窗 -->
    <el-dialog
      v-model="specialScoreItemDialogVisible"
      :title="editingItemIndex !== null ? '修改赋分项目' : '添加赋分项目'"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="clearSpecialScoreItemForm"
    >
      <el-form
        ref="specialScoreItemFormRef"
        :model="specialScoreItemForm"
        :rules="specialScoreItemFormRules"
        label-width="100px"
      >
        <el-form-item label="协作内容" prop="name">
          <el-input
            v-model="specialScoreItemForm.name"
            placeholder="请输入协作内容"
          />
        </el-form-item>
        <el-form-item label="分数" prop="score">
          <el-input-number
            v-model="specialScoreItemForm.score"
            :min="0"
            :max="100"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="来源" prop="source">
          <el-input
            v-model="specialScoreItemForm.source"
            placeholder="请输入来源"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="clearSpecialScoreItemForm">取消</el-button>
        <el-button type="primary" @click="submitSpecialScoreItem">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 新增/编辑记者弹窗 -->
    <el-dialog
      v-model="reporterDialogVisible"
      :title="editingReporterId !== null ? '编辑记者' : '新增记者'"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="clearReporterForm"
    >
      <el-form
        ref="reporterFormRef"
        :model="reporterForm"
        :rules="reporterFormRules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="reporterForm.name"
            placeholder="请输入记者姓名"
          />
        </el-form-item>
        <el-form-item label="工种" prop="type">
          <el-select
            v-model="reporterForm.type"
            placeholder="请选择工种"
          >
            <el-option
              v-for="category in reporterCategories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input
            v-model="reporterForm.department"
            placeholder="请输入部门信息"
          />
        </el-form-item>
        <el-form-item label="电话号码" prop="phone">
          <el-input
            v-model="reporterForm.phone"
            placeholder="请输入电话号码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="clearReporterForm">取消</el-button>
        <el-button type="primary" @click="submitReporterForm">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 稿件打分弹窗 -->
    <el-dialog
      v-model="articleScoreDialogVisible"
      title="对记者打分"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="articleScoreFormRef"
        :model="articleScoreForm"
        :rules="articleScoreFormRules"
        label-width="100px"
      >
        <el-form-item label="记者姓名">
          <el-input v-model="articleScoreForm.reporter_name" disabled />
        </el-form-item>
        <el-form-item label="稿件标题">
          <el-input v-model="articleScoreForm.title" disabled />
        </el-form-item>
        <el-form-item label="发布日期">
          <el-input v-model="articleScoreForm.publishDate" disabled />
        </el-form-item>
        
        <el-form-item label="分数" prop="score">
          <el-input-number
            v-model="articleScoreForm.score"
            :min="0"
            :max="200"
            :precision="0"
            style="width: 100%"
          />
          <span style="margin-left: 10px; color: #999;">(0-200分)</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="articleScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitArticleScore">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 新增文章弹窗 -->
    <el-dialog
      v-model="addArticleDialogVisible"
      title="新增文章"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="clearAddArticleForm"
    >
      <el-form
        ref="addArticleFormRef"
        :model="addArticleForm"
        :rules="addArticleFormRules"
        label-width="100px"
      >
        <el-form-item label="新闻标题" prop="title">
          <el-input v-model="addArticleForm.title" placeholder="请输入新闻标题" />
        </el-form-item>
        <el-form-item label="发布日期" prop="publishDate">
          <el-date-picker
            v-model="addArticleForm.publishDate"
            type="date"
            placeholder="选择发布日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="文字记者">
          <el-input v-model="addArticleForm.textReporter" disabled />
        </el-form-item>
        <el-form-item label="版面号" prop="page_meta_id">
          <el-input-number
            v-model="addArticleForm.page_meta_id"
            :min="0"
            :max="1000"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="版面名" prop="page_name">
          <el-input v-model="addArticleForm.page_name" placeholder="请输入版面名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="clearAddArticleForm">取消</el-button>
        <el-button type="primary" @click="submitAddArticle">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 统计卡片 -->
    <div class="statistics-card">
      <el-card title="考核统计">
        <!-- 按人员分组显示稿件 -->
        <div>
          <h4 style="margin-bottom: 15px;">记者稿件列表</h4>
          
          <!-- 遍历每个记者 -->
          <div v-for="reporter in reporterStatsWithArticles" :key="reporter.id" class="reporter-group">
            <!-- 记者信息头部 -->
            <div class="reporter-header">
              <div class="reporter-info">
                <span class="reporter-name">{{ reporter.name }}</span>
              </div>
              <div class="reporter-scores">
                <span class="score-item">稿件数: {{ reporter.count || 0 }}</span>
                <span class="score-item">新闻得分: {{ Math.round(reporter.newsTotal || reporter.total || 0) }}</span>
                <!-- 以下字段暂隐藏，以备以后使用 -->
                <!-- <span class="score-item">补分: {{ Math.round(reporter.bonus || 0) }}</span> -->
                <!-- <span class="score-item">扣罚: {{ Math.round(reporter.penalty || 0) }}</span> -->
                <span class="score-item total-score">总分: {{ Math.round(reporter.total || 0) }}</span>
              </div>
              <div class="reporter-actions">
                <!-- 以下按钮暂隐藏，以备以后使用 -->
                <!-- <el-button size="small" type="success" @click="openScoreAdjustDialog(reporter, '1')">增分</el-button> -->
                <!-- <el-button size="small" type="warning" @click="openScoreAdjustDialog(reporter, '2')">减分</el-button> -->
                <!-- <el-button size="small" type="info" @click="openSpecialScoreDialog(reporter, 'special')">专项赋分</el-button> -->
                <!-- <el-button size="small" type="primary" @click="openSpecialScoreDialog(reporter, 'collab')">业务协同</el-button> -->
                <el-button size="small" type="success" @click="openAddArticleDialog(reporter)">新增</el-button>
                <!-- <el-button size="small" type="primary" @click="openEditReporterDialog(reporter)">编辑</el-button> -->
                <!-- <el-button size="small" type="danger" @click="confirmDeleteReporter(reporter)">删除</el-button> -->
              </div>
            </div>
            
            <!-- 该记者的稿件列表 -->
            <div class="articles-list">
              <el-table 
                :data="reporter.articles" 
                border 
                stripe 
                style="width: 100%;"
              >
                <template #empty>
                  <div>该记者本月暂无稿件</div>
                </template>
                <el-table-column prop="title" label="稿件标题" min-width="300">
                  <template #default="scope">
                    <span v-if="scope.row.paper_url" class="article-title-link" @click="openPaperUrl(scope.row.paper_url, scope.row.title)">
                      {{ scope.row.title }}
                    </span>
                    <span v-else>{{ scope.row.title }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="publishDate" label="发布日期" width="120" />
                <el-table-column prop="page_number" label="版面号" width="100" />
                <el-table-column prop="page_name" label="版面/栏目" width="120" />
                <el-table-column prop="totalScore" label="稿件得分" width="100">
                  <template #default="scope">
                    <div class="clickable-cell" @click="openArticleScoreDialog(reporter, scope.row)">
                      {{ scope.row.totalScore }}
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="reporterStatsWithArticles.length === 0 && !loading" class="empty-state">
            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-else>暂无数据</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { reporterStats, month, selectedMonth, monthOptions, fetchReporters, fetchReporterMonthlyStats, saveArticle, scoreArticle, loading, error, userData } from '../store.js'
import api from '../api/index.js'

// 增减分弹窗相关
const scoreAdjustDialogVisible = ref(false)
const scoreAdjustFormRef = ref(null)
const currentReporter = ref(null)

const scoreAdjustForm = reactive({
  id: null,
  reporter_id: null,
  reporterName: '',
  score: 0,
  type: '1',
  reason: ''
})

const scoreAdjustFormRules = reactive({
  score: [{ required: true, message: '请输入增减分数', trigger: 'change' }],
  type: [{ required: true, message: '请选择增减类型', trigger: 'change' }],
  reason: [{ required: true, message: '请输入增减分理由', trigger: 'blur' }]
})

// 专项赋分弹窗相关
const specialScoreDialogVisible = ref(false)
const specialScoreItemDialogVisible = ref(false)
const specialScoreItemFormRef = ref(null)
const editingItemIndex = ref(null)
const currentScoreType = ref('special')
const specialScoreChanged = ref(false)

const specialScoreForm = reactive({
  reporterName: '',
  items: []
})

const specialScoreItemForm = reactive({
  name: '',
  score: null,
  source: ''
})

const specialScoreItemFormRules = reactive({
  name: [{ required: true, message: '请输入协作内容', trigger: 'blur' }],
  score: [{ required: true, message: '请输入分数', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }]
})

// 稿件打分弹窗相关
const articleScoreDialogVisible = ref(false)
const articleScoreFormRef = ref(null)
const currentArticle = ref(null)

const articleScoreForm = reactive({
  id: null,
  reporter_id: null,
  reporter_name: '',
  reporter_category_id: null,
  title: '',
  publishDate: '',
  score: 0
})

const articleScoreFormRules = reactive({
  score: [{ required: true, message: '请输入分数', trigger: 'change' }]
})

// 新增文章弹窗相关
const addArticleDialogVisible = ref(false)
const addArticleFormRef = ref(null)
const currentAddArticleReporter = ref(null)

const addArticleForm = reactive({
  title: '',
  publishDate: '',
  textReporter: '',
  tv_or_paper: 0,
  program_id: 0,
  media_type: 0,
  page_meta_id: 0,
  page_name: ''
})

const addArticleFormRules = reactive({
  title: [{ required: true, message: '请输入新闻标题', trigger: 'blur' }],
  publishDate: [{ required: true, message: '请选择发布日期', trigger: 'change' }]
})

// 新增/编辑记者弹窗相关
const reporterDialogVisible = ref(false)
const reporterFormRef = ref(null)
const editingReporterId = ref(null)
const reporterCategories = ref([])
const programs = ref([])

const reporterForm = reactive({
  id: null,
  name: '',
  type: '',
  department: '',
  phone: ''
})

const reporterFormRules = reactive({
  name: [{ required: true, message: '请输入记者姓名', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工种', trigger: 'change' }],
  department: [{ required: true, message: '请输入部门信息', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码格式', trigger: 'blur' }
  ]
})

// 存储记者稿件数据
const reporterArticles = ref({})

// 获取带稿件的记者统计数据
const reporterStatsWithArticles = computed(() => {
  return reporterStats.value.map(reporter => ({
    ...reporter,
    articles: reporterArticles.value[reporter.id] || []
  }))
})

// 获取记者类型名称
const getReporterTypeName = (type) => {
  const category = reporterCategories.value.find(c => c.id === parseInt(type))
  return category ? category.name : type
}

// 打开新增记者弹窗
const openAddReporterDialog = () => {
  editingReporterId.value = null
  clearReporterForm()
  reporterDialogVisible.value = true
}

// 打开编辑记者弹窗
const openEditReporterDialog = (row) => {
  editingReporterId.value = row.id
  reporterForm.id = row.id
  reporterForm.name = row.name
  reporterForm.type = row.type
  reporterForm.department = row.department || ''
  reporterForm.phone = row.phone || ''
  reporterDialogVisible.value = true
}

// 提交记者表单
const submitReporterForm = async () => {
  try {
    await reporterFormRef.value.validate()
    
    const apiData = {
      id: editingReporterId.value || null,
      name: reporterForm.name,
      reporter_category_id: parseInt(reporterForm.type),
      department: reporterForm.department,
      phone: reporterForm.phone,
      state: 1
    }
    
    await api.saveReporter(apiData)
    
    ElMessage.success(editingReporterId.value ? '记者信息编辑成功' : '记者信息新增成功')
    reporterDialogVisible.value = false
    
    await fetchReporters()
    const [year, month] = selectedMonth.value.split('-').map(Number)
    await fetchReporterMonthlyStats(year, month)
    await fetchArticlesForReporters(year, month)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('保存记者信息失败：' + (err.message || '未知错误'))
      console.error('保存记者信息失败:', err)
    }
  } finally {
    clearReporterForm()
  }
}

// 清除记者表单数据
const clearReporterForm = () => {
  reporterDialogVisible.value = false
  editingReporterId.value = null
  Object.assign(reporterForm, {
    id: null,
    name: '',
    type: '',
    department: '',
    phone: ''
  })
}

// 确认删除记者
const confirmDeleteReporter = (row) => {
  ElMessageBox.confirm(`确定要删除记者"${row.name}"吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const apiData = {
        id: row.id,
        name: row.name,
        reporter_category_id: row.reporter_category_id || parseInt(row.type),
        department: row.department || '',
        phone: row.phone || '',
        state: 0
      }
      
      await api.saveReporter(apiData)
      
      ElMessage.success('记者删除成功')
      
      await fetchReporters()
      const [year, month] = selectedMonth.value.split('-').map(Number)
      await fetchReporterMonthlyStats(year, month)
      await fetchArticlesForReporters(year, month)
    } catch (err) {
      ElMessage.error('删除记者失败：' + (err.message || '未知错误'))
      console.error('删除记者失败:', err)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 打开增减分弹窗
const openScoreAdjustDialog = async (row, type = '1') => {
  currentReporter.value = row
  scoreAdjustForm.reporterName = row.name
  scoreAdjustForm.score = 0
  scoreAdjustForm.type = type
  scoreAdjustForm.reason = ''
  
  if (type === '1') {
    try {
      const [year, month] = selectedMonth.value.split('-').map(Number)
      const response = await api.getMonthlyAddScore({ 
        year, 
        month,
        reporter_id: row.id
      })
      
      if (response.success && response.data) {
        scoreAdjustForm.id = response.data.id || null
        scoreAdjustForm.reporter_id = response.data.reporter_id || null
        scoreAdjustForm.score = response.data.score || 0
        scoreAdjustForm.reason = response.data.reason || ''
      }
    } catch (err) {
      console.error('获取加分信息失败:', err)
      ElMessage.warning('获取加分信息失败，将使用默认值')
    }
  } else if (type === '2') {
    try {
      const [year, month] = selectedMonth.value.split('-').map(Number)
      const response = await api.getMonthlySubScore({ 
        year, 
        month,
        reporter_id: row.id
      })
      
      if (response.success && response.data) {
        scoreAdjustForm.score = response.data.score || 0
        scoreAdjustForm.reason = response.data.reason || ''
      }
    } catch (err) {
      console.error('获取扣罚信息失败:', err)
      ElMessage.warning('获取扣罚信息失败，将使用默认值')
    }
  }
  
  scoreAdjustDialogVisible.value = true
}

// 提交增减分
const submitScoreAdjust = async () => {
  try {
    await scoreAdjustFormRef.value.validate()
    
    const [year, month] = selectedMonth.value.split('-').map(Number)
    const apiData = {
      reporter_id: currentReporter.value.id,
      reason: scoreAdjustForm.reason,
      publish_year: year,
      publish_month: month,
      score: parseFloat(scoreAdjustForm.score),
      state: 1
    }
    
    if (scoreAdjustForm.type === '1') {
      await api.monthlyAddScore(apiData)
    } else {
      await api.monthlySubScore(apiData)
    }
    
    ElMessage.success('增减分设置成功')
    scoreAdjustDialogVisible.value = false
    await fetchReporterMonthlyStats(year, month)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('增减分设置失败：' + (err.message || '未知错误'))
      console.error('增减分设置失败:', err)
    }
  }
}

// 打开稿件打分弹窗
const openArticleScoreDialog = (reporter, article) => {
  currentReporter.value = reporter
  currentArticle.value = article
  
  Object.assign(articleScoreForm, {
    id: article.id,
    reporter_id: reporter.id,
    reporter_name: reporter.name,
    reporter_category_id: parseInt(reporter.reporter_category_id) || parseInt(reporter.type) || 0,
    title: article.title,
    publishDate: article.publishDate,
    score: article.baseScore + article.executeScore
  })
  articleScoreDialogVisible.value = true
}

// 提交稿件打分
const submitArticleScore = async () => {
  try {
    await articleScoreFormRef.value.validate()
    
    const apiData = {
      article_id: articleScoreForm.id,
      reporter_scores: [{
        reporter_id: articleScoreForm.reporter_id,
        reporter_name: articleScoreForm.reporter_name,
        reporter_category_id: articleScoreForm.reporter_category_id,
        score: Math.round(articleScoreForm.score)
      }]
    }
    
    await api.scoreArticleSingle(apiData)
    
    ElMessage.success('打分成功')
    articleScoreDialogVisible.value = false
    
    const [year, month] = selectedMonth.value.split('-').map(Number)
    await fetchArticlesForReporters(year, month)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('打分失败：' + (err.message || '未知错误'))
      console.error('打分失败:', err)
    }
  }
}

// 打开专项赋分或业务协同弹窗
const openSpecialScoreDialog = async (row, scoreType = 'special') => {
  currentReporter.value = row
  currentScoreType.value = scoreType
  specialScoreForm.reporterName = row.name
  specialScoreForm.items = []
  specialScoreChanged.value = false
  
  try {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    const params = {
      reporter_id: row.id,
      year,
      month
    }
    
    let response
    if (scoreType === 'special') {
      response = await api.getEventScores(params)
    } else {
      response = await api.getCooperationScores(params)
    }
    
    if (response.success) {
      specialScoreForm.items = response.data.map(item => ({
        id: item.id || null,
        name: item.content || '',
        score: item.score || 0,
        source: item.score_from || '',
        state: item.state || 1
      }))
    } else {
      ElMessage.warning('获取数据失败：' + response.errMsg)
    }
  } catch (err) {
    console.error('获取专项赋分/业务协同数据失败:', err)
    ElMessage.error('获取数据失败：' + (err.message || '未知错误'))
  }
  
  specialScoreDialogVisible.value = true
}

// 打开专项赋分项目弹窗
const openSpecialScoreItemDialog = (item = null, index = null) => {
  editingItemIndex.value = index
  if (item) {
    Object.assign(specialScoreItemForm, item)
  } else {
    Object.assign(specialScoreItemForm, {
      name: '',
      score: null,
      source: ''
    })
  }
  specialScoreItemDialogVisible.value = true
}

// 提交专项赋分项目
const submitSpecialScoreItem = async () => {
  try {
    await specialScoreItemFormRef.value.validate()
    const [year, month] = selectedMonth.value.split('-').map(Number)
    
    const eventData = {
      reporter_id: currentReporter.value.id,
      content: specialScoreItemForm.name,
      publish_year: year,
      publish_month: month,
      score: parseFloat(specialScoreItemForm.score),
      score_from: specialScoreItemForm.source,
      state: 1
    }
    
    if (editingItemIndex.value !== null) {
      const existingItem = specialScoreForm.items[editingItemIndex.value]
      if (existingItem.id) {
        eventData.id = existingItem.id
      }
    }
    
    let response
    if (currentScoreType.value === 'special') {
      response = await api.saveEvent(eventData)
    } else {
      response = await api.saveCooperation(eventData)
    }
    
    if (editingItemIndex.value !== null) {
      specialScoreForm.items[editingItemIndex.value] = {
        ...specialScoreItemForm,
        id: response.data || null
      }
    } else {
      specialScoreForm.items.push({
        ...specialScoreItemForm,
        id: response.data || null
      })
    }
    
    specialScoreItemDialogVisible.value = false
    specialScoreChanged.value = true
    ElMessage.success(editingItemIndex.value !== null ? '项目修改成功' : '项目添加成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('项目设置失败：' + (err.message || '未知错误'))
      console.error('项目设置失败:', err)
    }
  } finally {
    clearSpecialScoreItemForm()
  }
}

// 清空专项赋分项目表单数据
const clearSpecialScoreItemForm = () => {
  specialScoreItemDialogVisible.value = false
  editingItemIndex.value = null
  Object.assign(specialScoreItemForm, {
    name: '',
    score: null,
    source: ''
  })
}

// 删除专项赋分项目
const removeSpecialScoreItem = async (index) => {
  try {
    const item = specialScoreForm.items[index]
    
    if (item.id) {
      const deleteData = {
        id: item.id,
        reporter_id: 0,
        content: '',
        publish_year: 0,
        publish_month: 0,
        score: 0,
        score_from: '',
        state: 0
      }
      
      if (currentScoreType.value === 'special') {
        await api.saveEvent(deleteData)
      } else {
        await api.saveCooperation(deleteData)
      }
    }
    
    specialScoreForm.items.splice(index, 1)
    specialScoreChanged.value = true
    ElMessage.success('项目删除成功')
  } catch (err) {
    ElMessage.error('项目删除失败：' + (err.message || '未知错误'))
    console.error('项目删除失败:', err)
  }
}

// 关闭专项赋分弹窗
const closeSpecialScoreDialog = async () => {
  specialScoreDialogVisible.value = false
  
  if (specialScoreChanged.value) {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    await fetchReporterMonthlyStats(year, month)
  }
}

// 提交专项赋分
const submitSpecialScore = async () => {
  try {
    if (specialScoreForm.items.length === 0) {
      ElMessage.error('请至少添加一个赋分项目')
      return
    }
    
    ElMessage.success('专项赋分设置成功')
    await closeSpecialScoreDialog()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('专项赋分设置失败：' + (err.message || '未知错误'))
      console.error('专项赋分设置失败:', err)
    }
  }
}

// 获取每个记者的稿件（一次请求获取所有记者的稿件）
const fetchArticlesForReporters = async (year, month) => {
  try {
    const department = userData.value.department
    
    // 收集所有记者ID
    const reporterIds = reporterStats.value.filter(r => r.id).map(r => r.id)
    
    if (reporterIds.length === 0) {
      reporterArticles.value = {}
      return
    }
    
    // 一次请求获取所有记者的稿件
    const params = { year, month, reporter_ids: reporterIds.join(',') }
    if (department) {
      params.department = department
    }
    
    const response = await api.getArticles(params)
    console.log('获取所有记者的稿件数据:', response)
    
    if (response.success) {
      const allArticles = response.data?.articles || response.data || []
      
      // 按记者分组
      const articlesByReporter = {}
      for (const reporter of reporterStats.value) {
        if (!reporter.id) continue
        
        const reporterArticles = allArticles.filter(article => {
          if (article.reporter_scores && article.reporter_scores.length > 0) {
            return article.reporter_scores.some(
              rs => rs.reporter_id === reporter.id || rs.reporter_name === reporter.name
            )
          }
          return false
        })
        
        articlesByReporter[reporter.id] = reporterArticles.map(article => {
          let scoreBasic = article.score_basic || article.baseScore || article.base_score || 0
          let scoreAction = article.score_action || article.executeScore || article.execute_score || 0
          
          if (article.reporter_scores && article.reporter_scores.length > 0) {
            const reporterScore = article.reporter_scores.find(
              rs => rs.reporter_id === reporter.id || rs.reporter_name === reporter.name
            )
            if (reporterScore && reporterScore.score) {
              scoreBasic = Math.round(reporterScore.score * 0.7)
              scoreAction = Math.round(reporterScore.score * 0.3)
            }
          }
          
          return {
            id: article.id,
            title: article.title || article.article_title || '未命名文章',
            publishDate: article.publishDate || `${article.publish_year || year}-${String(article.publish_month || month).padStart(2, '0')}-${String(article.publish_day || 1).padStart(2, '0')}`,
            page_name: article.page_name || '',
            page_number: article.page_meta_id || '',
            paper_url: article.paper_url || '',
            baseScore: typeof scoreBasic === 'number' ? Math.round(scoreBasic) : 0,
            executeScore: typeof scoreAction === 'number' ? Math.round(scoreAction) : 0,
            totalScore: typeof scoreBasic === 'number' && typeof scoreAction === 'number' ? Math.round(scoreBasic + scoreAction) : 0
          }
        }).sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate))
      }
      
      reporterArticles.value = articlesByReporter
      console.log('按记者分组的稿件:', reporterArticles.value)
    }
  } catch (err) {
    console.error('获取稿件数据失败:', err)
    reporterArticles.value = {}
  }
}

// 初始化月份选项
onMounted(async () => {
  const options = []
  for (let i = 0; i < 12; i++) {
    const date = dayjs().subtract(i, 'month')
    const value = date.format('YYYY-MM')
    options.push({
      label: date.format('YYYY年MM月'),
      value
    })
  }
  monthOptions.value = options
  
  // 获取节目列表
  try {
    const response = await api.getPrograms()
    if (response.success && response.data) {
      response.data.sort((a, b) => b.order_id - a.order_id)
      programs.value = response.data
    }
  } catch (err) {
    console.error('获取节目列表失败:', err)
  }
  
  await fetchReporterCategories()
  await fetchReporters()
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchReporterMonthlyStats(year, month)
  await fetchArticlesForReporters(year, month)
  
  console.log('记者打分数据:', reporterStats.value)
})

// 获取记者分类
const fetchReporterCategories = async () => {
  try {
    const response = await api.getReporterCategories()
    if (response.success) {
      reporterCategories.value = response.data
    } else {
      ElMessage.error('获取记者分类失败：' + response.errMsg)
    }
  } catch (err) {
    ElMessage.error('获取记者分类失败：' + (err.message || '未知错误'))
    console.error('获取记者分类失败:', err)
  }
}

// 切换月份
const changeMonth = async (val) => {
  month.value = val
  const [year, this_month] = val.split('-').map(Number)
  await fetchReporterMonthlyStats(year, this_month)
  await fetchArticlesForReporters(year, this_month)
  ElMessage.success(`已切换至${val}月份`)
}

// 打开电子报
const openPaperUrl = (paperUrl, title = '') => {
  if (paperUrl) {
    window.open(paperUrl, '_blank')
  }
}

// 打开新增文章弹窗
const openAddArticleDialog = (reporter) => {
  currentAddArticleReporter.value = reporter
  
  // 根据部门自动选择媒体类型
  const department = userData.value.department || localStorage.getItem('userDepartment')
  let defaultProgramId = 0
  let mediaType = 0
  
  if (department && programs.value.length > 0) {
    // 在节目列表中查找名称包含当前部门的节目
    const defaultProgram = programs.value.find(p => 
      p.name && p.name.includes(department)
    )
    
    if (defaultProgram) {
      defaultProgramId = defaultProgram.site_id
      
      // 根据节目名称判断媒体类型
      if (defaultProgram.name.includes('电视')) {
        mediaType = 0 // 电视
      } else if (defaultProgram.name.includes('报纸')) {
        mediaType = 1 // 报纸
      } else if (defaultProgram.name.includes('网络')) {
        mediaType = 2 // 网络
      } else if (defaultProgram.name.includes('新媒体')) {
        mediaType = 3 // 新媒体
      }
    }
  }
  
  Object.assign(addArticleForm, {
    title: '',
    publishDate: dayjs().format('YYYY-MM-DD'),
    textReporter: reporter.name,
    tv_or_paper: defaultProgramId,
    program_id: defaultProgramId,
    media_type: mediaType,
    page_meta_id: 0,
    page_name: ''
  })
  addArticleDialogVisible.value = true
}

// 清空新增文章表单
const clearAddArticleForm = () => {
  addArticleDialogVisible.value = false
  currentAddArticleReporter.value = null
  Object.assign(addArticleForm, {
    title: '',
    publishDate: '',
    textReporter: '',
    tv_or_paper: 0,
    program_id: 0,
    media_type: 0,
    page_meta_id: 0,
    page_name: ''
  })
}

// 提交新增文章
const submitAddArticle = async () => {
  try {
    await addArticleFormRef.value.validate()
    
    const [year, month] = selectedMonth.value.split('-').map(Number)
    
    const formData = {
      id: '',
      title: addArticleForm.title,
      publishDate: addArticleForm.publishDate,
      tv_or_paper: addArticleForm.tv_or_paper,
      program_id: addArticleForm.program_id,
      media_type: addArticleForm.media_type,
      tv_url: '',
      paper_url: '',
      baseScore: 0,
      executeScore: 0,
      textReporter: addArticleForm.textReporter,
      photoReporter: '',
      correspondentReporter: '',
      is_collaboration: 0,
      page_name: addArticleForm.page_name,
      page_meta_id: addArticleForm.page_meta_id,
      state: 1,
      reporter_scores: [{
        reporter_id: currentAddArticleReporter.value.id,
        score: 0,
        reporter_category_id: parseInt(currentAddArticleReporter.value.reporter_category_id) || parseInt(currentAddArticleReporter.value.type) || 3,
      }],
    }
    
    const articleId = await saveArticle(formData)
    
    formData.id = articleId.toString()
    await scoreArticle(formData)
    
    ElMessage.success('新增文章成功')
    clearAddArticleForm()
    
    await fetchReporterMonthlyStats(year, month)
    await fetchArticlesForReporters(year, month)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('新增文章失败：' + (err.message || '未知错误'))
      console.error('新增文章失败:', err)
    }
  }
}

// 导出记者打分
const exportReporterStats = () => {
  // 列: A记者姓名 B工种 C稿件数 D新闻得分合计 E标题 F日期 G版面号 H版面/栏目 I得分
  const headers = ['记者姓名', '工种', '稿件数', '新闻得分合计', '稿件标题', '发布日期', '版面号', '版面/栏目', '稿件得分']
  const rows = [headers]
  
  let rowIdx = 0
  
  reporterStatsWithArticles.value.forEach(reporter => {
    const reporterRowIdx = rowIdx + 1 // 当前记者汇总行 (0-based in rows)
    
    // 汇总行
    rows.push([
      reporter.name,
      getReporterTypeName(reporter.type),
      reporter.count || 0,
      '',  // D 公式后设
      '', '', '', '', ''
    ])
    rowIdx++
    
    // 稿件行
    const articleStartRow = rowIdx + 2 // 第一个稿件行号 (1-based Excel)
    reporter.articles.forEach(article => {
      rows.push([
        '', '', '', '',
        article.title,
        article.publishDate,
        article.page_number,
        article.page_name,
        article.totalScore
      ])
      rowIdx++
    })
    const articleEndRow = rowIdx + 1 // 最后一个稿件行号 (1-based Excel)
    
    if (reporter.articles.length > 0) {
      rows[reporterRowIdx][3] = { f: `SUM(I${articleStartRow}:I${articleEndRow})` }
    } else {
      rows[reporterRowIdx][3] = 0
    }
  })
  
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${month.value}记者打分`)
  
  XLSX.writeFile(wb, `${month.value}记者考核统计.xlsx`)
  ElMessage.success('记者打分导出成功')
}
</script>

<style scoped>
.assessment-container {
  max-width: 1800px;
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

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-label {
  font-size: 14px;
  color: #666;
}

.more-filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

.statistics-card {
  margin-top: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.stat-item .label {
  font-size: 16px;
  color: #666;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
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
  margin-right: 15px;
}

.reporter-type {
  font-size: 14px;
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: 4px;
}

.reporter-scores {
  display: flex;
  gap: 20px;
  margin-right: 20px;
}

.score-item {
  font-size: 14px;
}

.total-score {
  font-weight: bold;
  font-size: 16px;
  color: #ffd700;
}

.reporter-actions {
  display: flex;
  gap: 8px;
}

.reporter-actions .el-button {
  padding: 4px 10px;
  font-size: 12px;
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

.reporter-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.25) !important;
}

.articles-list {
  padding: 10px;
}

.articles-list .el-table {
  font-size: 13px;
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

.error-message {
  color: #f56c6c;
}
</style>