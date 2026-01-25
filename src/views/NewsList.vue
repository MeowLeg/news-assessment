<template>
  <div class="assessment-container">
    <!-- 页面标题和操作区 -->
    <div class="header">
      <h2>{{ month }} 新闻中心月度考核表</h2>
      <div class="header-actions">
        <el-select v-model="selectedMonth" @change="changeMonth" placeholder="选择月份">
          <el-option
            v-for="m in monthOptions"
            :key="m.value"
            :label="m.label"
            :value="m.value"
          />
        </el-select>
        <el-button type="primary" icon="Plus" @click="openAddDialog">新增新闻评分</el-button>
        <el-button type="success" icon="Download" @click="exportToExcel">导出Excel</el-button>
      </div>
    </div>
    
    <!-- 视频播放区 - 完全按照设计图实现 -->
    <div class="video-modal-mask" :class="{ show: videoDialogVisible }" @click="handleVideoModalClick">
      <div class="video-modal" @click.stop>
        <button class="modal-close" @click="closeVideoModal">×</button>
        <div class="video-container">
          <video 
            ref="videoPlayer" 
            v-if="currentVideoUrl" 
            controls 
            autoplay 
          >
            <source :src="currentVideoUrl" type="video/mp4">
            您的浏览器不支持视频播放
          </video>
          <div v-else class="no-video">暂无视频URL</div>
        </div>
      </div>
    </div>
    
    <!-- 电子报展示区 -->
    <el-dialog
      v-model="paperDialogVisible"
      :title="currentPaperTitle || '电子报展示'"
      width="90%"
      center
      @close="handlePaperDialogClose"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="paper-container">
        <iframe 
          v-if="currentPaperUrl" 
          :src="currentPaperUrl" 
          style="width: 100%; height: 700px; border: none;"
        ></iframe>
        <div v-else class="no-paper">暂无电子报URL</div>
      </div>
      <template #footer>
        <el-button @click="paperDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- HTML内容展示弹窗 -->
    <el-dialog
      v-model="htmlContentDialogVisible"
      :title="currentHtmlContentTitle || '内容查看'"
      width="90%"
      center
      @close="handleHtmlContentDialogClose"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="html-content-container">
        <div v-if="currentHtmlContent" class="html-content" v-html="currentHtmlContent"></div>
        <div v-else class="no-content">暂无内容</div>
      </div>
      <template #footer>
        <el-button @click="htmlContentDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 记者选择弹窗 -->
    <el-dialog
      v-model="reporterSelectDialogVisible"
      title="选择记者"
      width="500px"
      @close="handleReporterSelectClose"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="reporter-select-container">
        <el-input
          v-model="reporterSearchKeyword"
          placeholder="搜索记者姓名"
          prefix-icon="Search"
          style="margin-bottom: 15px;"
        />
        <div style="max-height: 400px; overflow-y: auto;">
          <el-table
            v-loading="loading"
            :data="filteredAvailableReporters"
            border
            stripe
            style="width: 100%"
            @selection-change="handleReporterSelectionChange"
          >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="记者姓名" width="150" />
          <el-table-column prop="category_name" label="记者类型" width="150" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="reporterSelectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReporterSelection">确定</el-button>
      </template>
    </el-dialog>

    <!-- 筛选区 -->
    <div class="filter-section">
      <span class="filter-label">标题：</span>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索新闻标题"
        prefix-icon="Search"
        style="width: 1100px; margin-right: 10px"
      />
      <span class="filter-label">媒体：</span>
      <el-select 
        v-model="filterMediaType"
        placeholder="媒体类型"
        style="width: 300px; margin-right: 10px"
      >
        <el-option label="全部" value="0" />
        <el-option
          v-for="program in programs"
          :key="program.site_id"
          :label="program.name"
          :value="program.site_id + 1"
        />
      </el-select>
      <span class="filter-label">记者：</span>
      <el-select 
        v-model="filterReporterId"
        placeholder="筛选记者"
        style="width: 300px; margin-right: 10px"
      >
        <el-option label="全部" value="0" />
        <el-option
          v-for="reporter in reporters"
          :key="reporter.id"
          :label="reporter.name"
          :value="reporter.id"
        />
      </el-select>
      <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
    </div>

    <!-- 考核列表 -->
    <div style="margin-top: 20px; display: flex; flex-direction: column; height: calc(100vh - 330px);">
      <el-table
        v-loading="loading"
        :data="newsList"
        border
        stripe
        style="width: 100%; flex: 1"
      >
      <template #empty>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-else>暂无数据</div>
      </template>
      <el-table-column label="ID" width="80">
        <template #default="scope">
          {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="title" label="新闻标题" min-width="200" />
      <el-table-column prop="publishDate" label="发布日期" width="120" />
      <el-table-column label="媒体" width="120">
        <template #default="scope">
          {{ scope.row.program_name || '未知媒体' }}
        </template>
      </el-table-column>
      <el-table-column prop="textReporter" label="文字记者" width="150" />
      <el-table-column prop="photoReporter" label="摄影记者" width="150" />
      <el-table-column prop="baseScore" label="基本分" width="100">
        <template #default="scope">
          {{ typeof scope.row.baseScore === 'number' ? Math.round(scope.row.baseScore) : '0' }}
        </template>
      </el-table-column>
      <el-table-column prop="executeScore" label="执行分" width="100">
        <template #default="scope">
          {{ typeof scope.row.executeScore === 'number' ? Math.round(scope.row.executeScore) : '0' }}
        </template>
      </el-table-column>
      <!-- <el-table-column prop="bonus" label="加分项" width="100">
        <template #default="scope">
          {{ typeof scope.row.bonus === 'number' ? Math.round(scope.row.bonus) : '0' }}
        </template>
      </el-table-column>
      <el-table-column prop="penalty" label="扣分项" width="100">
        <template #default="scope">
          {{ typeof scope.row.penalty === 'number' ? Math.round(scope.row.penalty) : '0' }}
        </template>
      </el-table-column> -->
      <el-table-column prop="totalScore" label="总分" width="100">
        <template #default="scope">
          <span :class="{ 'text-danger': typeof scope.row.totalScore === 'number' && scope.row.totalScore < 0 }">
            {{ typeof scope.row.totalScore === 'number' ? Math.round(scope.row.totalScore) : '0' }}
          </span>
        </template>
      </el-table-column>
      <!-- <el-table-column label="剩余分数" width="120">
        <template #default="scope">
          <div 
            class="remaining-score-cell" 
            :class="{
              'high': calculateRemainingScore(scope.row) > 0,
              'warning': calculateRemainingScore(scope.row) <= 0
            }"
          >
            {{ calculateRemainingScore(scope.row) }}
          </div>
        </template>
      </el-table-column> -->
      <el-table-column label="操作" width="320">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
          <!-- 用于展示电视新闻或报纸新闻的链接 -->
          <el-button 
            :disabled="!(scope.row.media_type === 0 && scope.row.tv_url)"
            size="small" 
            type="info" 
            @click="openTvUrl(scope.row.tv_url, scope.row.title)"
          >播放</el-button>
          <el-button 
            :disabled="!(scope.row.media_type === 1 && scope.row.paper_url)"
            size="small" 
            type="info" 
            @click="openPaperUrl(scope.row.paper_url, scope.row.title)"
          >显示</el-button>
          <el-button 
            size="small" 
            type="info" 
            @click="openHtmlContentDialog(scope.row)"
          >查看</el-button>
          <el-button 
            type="warning" 
            size="small" 
            @click="deleteArticle(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 9999]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalArticles"
      style="margin-top: 20px; text-align: right"
    >
    </el-pagination>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑新闻评分' : '新增新闻评分'"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="newsFormRef"
        :model="newsForm"
        :rules="newsFormRules"
        label-width="100px"
      >
        <el-form-item label="新闻标题" prop="title">
          <el-input v-model="newsForm.title" placeholder="请输入新闻标题" />
        </el-form-item>
        <el-form-item label="发布日期" prop="publishDate">
          <el-date-picker
            v-model="newsForm.publishDate"
            type="date"
            placeholder="选择发布日期"
            style="width: 100%"
          />
        </el-form-item>
        <!-- 文字记者 -->
        <el-form-item label="文字记者">
          <div v-for="(reporter, index) in newsForm.textReporters" :key="'text-' + index" class="reporter-item">
            <el-input 
              v-model="reporter.reporter_name" 
              placeholder="请输入记者姓名" 
              style="width: 200px; margin-right: 10px;"
            />
            <el-input-number 
              v-model="reporter.score" 
              :min="0" 
              :max="1000" 
              :precision="0" 
              placeholder="分数" 
              style="width: 120px; margin-right: 10px;"
            />
            <el-button 
              type="warning" 
            size="small" 
            @click="removeReporter('text', index)"
          >删除</el-button>
          </div>
          <el-button type="primary" size="small" @click="addReporter('text')" style="margin-top: 10px;">
            <el-icon><Plus /></el-icon> 添加文字记者
          </el-button>
        </el-form-item>
        
        <!-- 摄影记者 -->
        <el-form-item label="摄影记者">
          <div v-for="(reporter, index) in newsForm.photoReporters" :key="'photo-' + index" class="reporter-item">
            <el-input 
              v-model="reporter.reporter_name" 
              placeholder="请输入记者姓名" 
              style="width: 200px; margin-right: 10px;"
            />
            <el-input-number 
              v-model="reporter.score" 
              :min="0" 
              :max="1000" 
              :precision="0" 
              placeholder="分数" 
              style="width: 120px; margin-right: 10px;"
            />
            <el-button 
              type="warning" 
            size="small" 
            @click="removeReporter('photo', index)"
          >删除</el-button>
          </div>
          <el-button type="primary" size="small" @click="addReporter('photo')" style="margin-top: 10px;">
            <el-icon><Plus /></el-icon> 添加摄影记者
          </el-button>
        </el-form-item>
        <el-form-item label="媒体类型" prop="program_id">
          <el-select
            v-model="newsForm.program_id"
            placeholder="请选择媒体类型"
            style="width: 200px"
          >
            <el-option
              v-for="program in programs"
              :key="program.id"
              :label="program.name"
              :value="program.media_type"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="TV URL" prop="tv_url">
          <el-input v-model="newsForm.tv_url" placeholder="请输入视频流地址" />
        </el-form-item>
        <el-form-item label="电子报URL" prop="paper_url">
          <el-input v-model="newsForm.paper_url" placeholder="请输入电子报URL" />
        </el-form-item>
        <el-form-item label="基本分" prop="baseScore">
          <el-input
            :value="autoCalculateBaseScore"
            disabled
            placeholder="根据记者得分自动计算"
            style="width: 200px"
          />
          <div style="margin-top: 5px; color: #999; font-size: 12px;">
            根据记者得分合计自动选择最接近的档位（100/200/300/450/600）
          </div>
        </el-form-item>
        <el-form-item label="执行分" prop="executeScore">
          <el-input
            :value="autoCalculateExecuteScore"
            disabled
            placeholder="根据记者得分自动计算"
            style="width: 200px"
          />
          <div style="margin-top: 5px; color: #999; font-size: 12px;">
            记者得分合计 - 基本分
          </div>
        </el-form-item>
        <!-- <el-form-item label="加分项" prop="bonus">
          <el-input-number
            v-model="newsForm.bonus"
            :min="0"
            :max="20"
            :precision="0"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="扣分项" prop="penalty">
          <el-input-number
            v-model="newsForm.penalty"
            :min="0"
            :max="20"
            :precision="0"
            style="width: 200px"
          />
        </el-form-item> -->
        <!-- 剩余可分配分数提示 -->
        <!-- <el-form-item>
          <div class="remaining-score" :class="{ 'high': remainingScore > 0, 'warning': remainingScore <= 0 }">
            <span class="label">剩余可分配分数：</span>
            <span class="value">{{ remainingScore }}</span>
          </div>
        </el-form-item> -->
        <el-form-item label="总分">
          <el-input
            v-model="totalScore"
            disabled
            style="width: 200px; color: #666"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { newsList, totalArticles, allReporters, reporters, month, selectedMonth, monthOptions, fetchArticles, fetchReporters, saveArticle, scoreArticle, loading, error } from '../store.js'
import api from '../api/index.js'

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索筛选
const searchKeyword = ref('')
const filterReporter = ref('')
const filterReporterId = ref('0') // 0 表示全部记者
const filterMediaType = ref('0') // 0 表示全部媒体

// 节目列表（媒体类型）
const programs = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const newsFormRef = ref(null)

// 视频播放弹窗相关
const videoDialogVisible = ref(false)
const currentVideoUrl = ref('')
const currentVideoTitle = ref('')
const videoPlayer = ref(null)

// 电子报弹窗相关
const paperDialogVisible = ref(false)
const currentPaperUrl = ref('')
const currentPaperTitle = ref('')

// HTML内容展示弹窗相关
const htmlContentDialogVisible = ref(false)
const currentHtmlContent = ref('')
const currentHtmlContentTitle = ref('')

// 记者选择弹窗相关
const reporterSelectDialogVisible = ref(false)
const currentReporterType = ref('') // 'text' 或 'photo'
const selectedReporters = ref([]) // 当前选择的记者
const allAvailableReporters = ref([]) // 所有可用记者列表
const reporterSearchKeyword = ref('') // 记者搜索关键词

// 筛选后的记者列表
const filteredAvailableReporters = computed(() => {
  if (!reporterSearchKeyword.value) {
    return allAvailableReporters.value
  }
  const keyword = reporterSearchKeyword.value.toLowerCase()
  return allAvailableReporters.value.filter(reporter => 
    reporter.name.toLowerCase().includes(keyword) ||
    reporter.category_name.toLowerCase().includes(keyword)
  )
})

// 基本分选项
const baseScoreOptions = ref([100, 200, 300, 450, 600])

// 计算文字和摄像记者的得分合计
const reportersTotalScore = computed(() => {
  let total = 0
  // 计算文字记者得分总和
  newsForm.textReporters.forEach(reporter => {
    total += parseInt(reporter.score) || 0
  })
  // 计算摄影记者得分总和（包括摄像记者和摄影记者）
  newsForm.photoReporters.forEach(reporter => {
    total += parseInt(reporter.score) || 0
  })
  return total
})

// 自动计算基本分：从100、200、300、450、600中找到最接近合计值的一档
const autoCalculateBaseScore = computed(() => {
  const total = reportersTotalScore.value
  const options = [100, 200, 300, 450, 600]
  
  if (total <= 0) return 0
  
  // 找到最接近的值
  let closest = options[0]
  let minDiff = Math.abs(total - closest)
  
  for (let i = 1; i < options.length; i++) {
    const diff = Math.abs(total - options[i])
    if (diff < minDiff) {
      minDiff = diff
      closest = options[i]
    }
  }
  
  return closest
})

// 自动计算执行分：合计 - 基本分
const autoCalculateExecuteScore = computed(() => {
  const total = reportersTotalScore.value
  const base = autoCalculateBaseScore.value
  return Math.max(0, total - base)
})

// 表单数据
const newsForm = reactive({
  id: '',
  title: '',
  publishDate: '',
  tv_or_paper: 0, // program_id
  program_id: 0, // program_id
  media_type: 0, // 默认为电视
  tv_url: '',
  paper_url: '',
  baseScore: 0,
  executeScore: 0,
  // bonus: 0,
  // penalty: 0,
  textReporters: [], // 文字记者列表，每个元素包含name和score
  photoReporters: [], // 摄影记者列表，每个元素包含name和score
  page_name: '', // 电子报名称
  page_meta_id: 0, // 电子报元ID
  state: 1,
})

// 表单校验规则
const newsFormRules = reactive({
  title: [{ required: true, message: '请输入新闻标题', trigger: 'blur' }],
  publishDate: [{ required: true, message: '请选择发布日期', trigger: 'change' }],
  baseScore: [{ required: true, message: '请输入基本分', trigger: 'change' }],
  executeScore: [{ required: true, message: '请输入执行分', trigger: 'change' }]
})

// 打开记者选择弹窗
const openReporterSelectDialog = async (type) => {
  currentReporterType.value = type
  // 获取所有可用记者
  await fetchReporters() // 调用store中的fetchReporters函数获取记者列表
  // 将记者列表转换为弹窗所需格式
  allAvailableReporters.value = reporters.value.map(reporter => {
    // 确保reporter是对象，并且有name属性
    if (typeof reporter === 'string') {
      return { name: reporter, category_name: '未知类型' }
    } else if (reporter && typeof reporter === 'object') {
      return {
        name: reporter.name || reporter.reporter_name || reporter.reporter || '未知记者',
        category_name: reporter.category_name || reporter.reporter_category_name || '未知类型',
        id: reporter.id || reporter.reporter_id || 0,
        // category_id: reporter.reporter_category_id || 0
        category_id: type === 'text' ? 3 : (newsForm.media_type === 0 ? 4 : 5)
      }
    }
    return { name: '未知记者', category_name: '未知类型', id: 0 }
  })
  selectedReporters.value = [] // 清空之前的选择
  reporterSearchKeyword.value = '' // 清空搜索关键词
  reporterSelectDialogVisible.value = true
}

// 添加记者
const addReporter = (type) => {
  openReporterSelectDialog(type)
}

// 处理记者选择弹窗关闭
const handleReporterSelectClose = () => {
  reporterSelectDialogVisible.value = false
  selectedReporters.value = []
  currentReporterType.value = ''
  reporterSearchKeyword.value = ''
}

// 处理记者选择变化
const handleReporterSelectionChange = (selection) => {
  selectedReporters.value = selection
}

// 确认记者选择
const confirmReporterSelection = () => {
  if (selectedReporters.value.length === 0) {
    ElMessage.warning('请选择至少一名记者')
    return
  }
  
  // 根据记者类型添加到相应的列表
  // if (currentReporterType.value === 'text') {
    selectedReporters.value.forEach(reporter => {
      // 检查是否已经添加过该记者
      console.log("reporter", reporter)
      const isExist = newsForm.textReporters.some(r => r.reporter_id === reporter.id)
      if (!isExist) {
        if (reporter.category_id === 3) {
          newsForm.textReporters.push({
            reporter_name: reporter.name,
            score: 0,
            reporter_id: reporter.id || 0,
            reporter_category_id: 3, // 文字记者类别
            reporter_category_name: '文字记者'
          })
        } else if (reporter.category_id === 4) {
          newsForm.photoReporters.push({
            reporter_name: reporter.name,
            score: 0,
            reporter_id: reporter.id || 0,
            reporter_category_id: 4, // 摄影记者类别
            reporter_category_name: '摄像记者'
          })
        } else if (reporter.category_id === 5) {
          newsForm.photoReporters.push({
            reporter_name: reporter.name,
            score: 0,
            reporter_id: reporter.id || 0,
            reporter_category_id: 5, // 摄影记者类别
            reporter_category_name: '摄影记者'
          })
        }
      }
    })
  
  ElMessage.success(`已添加${selectedReporters.value.length}名记者`)
  handleReporterSelectClose()
}

// 删除记者
const removeReporter = (type, index) => {
  if (type === 'text') {
    newsForm.textReporters.splice(index, 1)
  } else if (type === 'photo') {
    newsForm.photoReporters.splice(index, 1)
  }
}

// 计算总分
const totalScore = computed(() => {
  return Math.round(newsForm.baseScore + newsForm.executeScore).toString()
})

// 计算剩余可分配分数
const remainingScore = computed(() => {
  // 由于基本分和执行分是根据记者得分自动计算的，所以剩余可分配分数始终为0
  return 0
})

// 筛选后的新闻列表
const filteredNewsList = computed(() => {
  let list = [...newsList.value]
  
  // 关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item => 
      item.title.toLowerCase().includes(keyword) ||
      item.textReporter.toLowerCase().includes(keyword) ||
      item.photoReporter.toLowerCase().includes(keyword)
    )
  }
  
  // 记者筛选
  if (filterReporter.value) {
    const filterVal = filterReporter.value
    list = list.filter(item => 
      item.textReporter.includes(filterVal) ||
      item.photoReporter.includes(filterVal)
    )
  }
  
  // 分页处理
  // const start = (currentPage.value - 1) * pageSize.value
  // const end = start + pageSize.value
  // return list.slice(start, end)
  return list
})

// 处理搜索和筛选
const handleSearch = async () => {
  currentPage.value = 1 // 搜索时回到第一页
  // 重新获取数据，将搜索关键词和筛选条件传递给后端
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value: null, filterMediaType.value)
}

// 计算表格行中文章的剩余可分配分数
const calculateRemainingScore = (row) => {
  // 文章总分：基本分+执行分
  const articleTotal = (row.baseScore || 0) + (row.executeScore || 0)
  
  // 计算所有记者得分的总和
  let reportersTotal = 0
  
  // 检查是否有reporter_scores字段
  if (row.reporter_scores && Array.isArray(row.reporter_scores)) {
    reportersTotal = row.reporter_scores.reduce((total, reporterScore) => {
      return total + (parseInt(reporterScore.score) || 0)
    }, 0)
  }
  
  // 剩余可分配分数 = 文章总分 - 所有记者得分总和
  return articleTotal - reportersTotal
}

// ESC键处理函数
const handleEscapeKey = (e) => {
  if (e.key === 'Escape' && videoDialogVisible.value) {
    closeVideoModal()
  }
}

// 初始化月份选项
onMounted(async () => {
  // 生成近12个月的选项
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
  
  // 获取节目列表（媒体类型）
  try {
    const response = await api.getPrograms()
    if (response.success && response.data) {
      programs.value = response.data
    } else {
      ElMessage.warning('获取节目列表失败')
    }
  } catch (err) {
    console.error('获取节目列表失败:', err)
    ElMessage.error('获取节目列表失败')
  }
  
  // 获取初始数据
  await fetchReporters()
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null)
  
  // 添加ESC键事件监听器
  document.addEventListener('keydown', handleEscapeKey)
})

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})

// 方法：打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false
  // 重置表单
  Object.assign(newsForm, {
    id: '',
    title: '',
    publishDate: '',
    tv_or_paper: 0,
    program_id: 0, // program_id
    media_type: 0, // 默认为电视
    tv_url: '',
    paper_url: '',
    baseScore: 0,
    executeScore: 0,
    // bonus: 0,
    // penalty: 0,
    textReporters: [],
    photoReporters: [],
    page_name: '',
    page_meta_id: 0,
    state: 1,
  })
  dialogVisible.value = true
}

// 方法：打开编辑弹窗
const openEditDialog = (row) => {
  isEdit.value = true
  // 填充表单
  Object.assign(newsForm, {
    id: row.id,
    title: row.title,
    publishDate: row.publishDate,
    tv_or_paper: row.tv_or_paper || 0,
    program_id: row.program_id || 0, // program_id
    media_type: row.media_type || 0,
    tv_url: row.tv_url || '',
    paper_url: row.paper_url || '',
    baseScore: row.baseScore,
    executeScore: row.executeScore,
    // bonus: row.bonus,
    // penalty: row.penalty,
    // 转换原来的记者字符串为数组格式
    // textReporters: row.textReporter ? row.textReporter.split(',').map(name => ({ name: name.trim(), score: 0 })) : [{ name: '', score: 0 }],
    // photoReporters: row.photoReporter ? row.photoReporter.split(',').map(name => ({ name: name.trim(), score: 0 })) : [{ name: '', score: 0 }]
    textReporters: row.reporter_scores.filter(item => item.reporter_category_id === 3),
    photoReporters: row.reporter_scores.filter(item => item.reporter_category_id === 4 || item.reporter_category_id === 5),
    page_name: row.page_name || '',
    page_meta_id: row.page_meta_id || 0,
  })
  dialogVisible.value = true
}

// 方法：提交表单
const submitForm = async () => {
  try {
    await newsFormRef.value.validate()
    
    // 使用自动计算的基本分和执行分
    const calculatedBaseScore = autoCalculateBaseScore.value
    const calculatedExecuteScore = autoCalculateExecuteScore.value
    
    // 计算文章总分：基本分+执行分
    const articleTotal = calculatedBaseScore + calculatedExecuteScore
    if (articleTotal < 0) {
      ElMessage.error('总分不能为负数，请调整评分')
      return
    }
    
    // 计算所有记者得分的总和
    let reportersTotal = 0
    // 计算文字记者得分总和
    newsForm.textReporters.forEach(reporter => {
      reportersTotal += parseInt(reporter.score) || 0
    })
    // 计算摄影记者得分总和
    newsForm.photoReporters.forEach(reporter => {
      reportersTotal += parseInt(reporter.score) || 0
    })
    
    // 转换记者数据格式为API预期格式
    const formData = {
      ...newsForm,
      baseScore: calculatedBaseScore, // 使用自动计算的基本分
      executeScore: calculatedExecuteScore, // 使用自动计算的执行分
      textReporter: newsForm.textReporters.map(r => r.name).join(','),
      photoReporter: newsForm.photoReporters.map(r => r.name).join(','),
      publishDate: typeof newsForm.publishDate === 'string' ? newsForm.publishDate : dayjs(newsForm.publishDate).format('YYYY-MM-DD'),
      // 准备reporter_scores数据
      reporter_scores: [
        ...newsForm.textReporters.map(r => ({
          reporter_id: r.reporter_id,
          score: r.score, // 表单中的分数已经是整数
          reporter_category_id: 3, // 文字记者为3
        })),
        ...newsForm.photoReporters.map(r => ({
          reporter_id: r.reporter_id,
          score: r.score, // 表单中的分数已经是整数
          reporter_category_id: newsForm.media_type === 0 ? 4 : 5, // tv_or_paper为0时摄影记者为4，反之为5
        })),
      ],
    }
    
    // 保存文章基本信息
    console.log('formData', formData)
    const articleId = await saveArticle(formData)
    
    // 如果是新增，更新表单的id
    if (!isEdit.value) {
      newsForm.id = articleId.toString()
      formData.id = articleId
    }
    
    // 给文章打分
    await scoreArticle(formData)
    
    // 刷新文章列表
    const [year, month] = selectedMonth.value.split('-').map(Number)
    await fetchArticles(year, month)
    
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
  } catch (err) {
    ElMessage.error('操作失败：' + (err.message || '未知错误'))
    console.error('提交表单失败:', err)
  }
}

// 方法：打开TV URL
const openTvUrl = (tvUrl, title = '') => {
  if (tvUrl) {
    currentVideoUrl.value = tvUrl
    currentVideoTitle.value = title
    videoDialogVisible.value = true
    document.body.style.overflow = 'hidden' // 禁止背景滚动
  }
}

// 方法：打开电子报URL
const openPaperUrl = (paperUrl, title = '') => {
  if (paperUrl) {
    // 控制电子报弹窗显示
    currentPaperUrl.value = paperUrl
    currentPaperTitle.value = title
    paperDialogVisible.value = true
  }
}

// 方法：打开HTML内容弹窗
const openHtmlContentDialog = (row) => {
  if (row.html_content) {
    currentHtmlContent.value = row.html_content
    currentHtmlContentTitle.value = row.title || '内容查看'
    htmlContentDialogVisible.value = true
  } else {
    ElMessage.warning('暂无内容')
  }
}

// 关闭视频弹窗
const closeVideoModal = () => {
  // 停止视频播放
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
  
  // 重置视频相关状态
  currentVideoUrl.value = ''
  currentVideoTitle.value = ''
  videoDialogVisible.value = false
  document.body.style.overflow = 'auto' // 恢复背景滚动
}

// 处理视频弹窗外部点击
const handleVideoModalClick = (e) => {
  if (e.target === e.currentTarget) {
    closeVideoModal()
  }
}

// 方法：处理视频弹窗关闭事件
const handleVideoDialogClose = () => {
  closeVideoModal()
}

// 方法：处理电子报弹窗关闭事件
const handlePaperDialogClose = () => {
  // 重置电子报相关状态
  currentPaperUrl.value = ''
  currentPaperTitle.value = ''
}

// 方法：处理HTML内容弹窗关闭事件
const handleHtmlContentDialogClose = () => {
  // 重置HTML内容相关状态
  currentHtmlContent.value = ''
  currentHtmlContentTitle.value = ''
}

// 方法：导出Excel
const exportToExcel = () => {
  // 准备导出数据
  const exportData = newsList.value.map(item => ({
    '新闻标题': item.title,
    '发布日期': item.publishDate,
    '文字记者': item.textReporter,
    '摄影记者': item.photoReporter,
    '基本分': item.baseScore.toFixed(1),
    '执行分': item.executeScore.toFixed(1),
    // '加分项': item.bonus.toFixed(1),
    // '扣分项': item.penalty.toFixed(1),
    '总分': item.totalScore.toFixed(1)
  }))
  
  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(exportData)
  // 创建工作簿
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${month.value}考核表`)
  
  // 导出文件
  XLSX.writeFile(wb, `${month.value}新闻考核表.xlsx`)
  ElMessage.success('Excel导出成功')
}

// 分页方法
const handleSizeChange = async (val) => {
  pageSize.value = val
  currentPage.value = 1 // 切换每页条数时，回到第一页
  // 重新获取数据，传递搜索关键词和筛选条件
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null)
}

const handleCurrentChange = async (val) => {
  currentPage.value = val
  // 重新获取数据，传递搜索关键词和筛选条件
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null)
}

// 删除文章
const deleteArticle = async (row) => {
  try {
    // 弹出确认对话框
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用saveArticle函数，传递state: 0来删除文章
    await saveArticle({
      id: row.id,
      state: 0
    })
    
    // 刷新文章列表
    const [year, month] = selectedMonth.value.split('-').map(Number)
    await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null)
    
    ElMessage.success('文章删除成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败：' + (err.message || '未知错误'))
      console.error('删除文章失败:', err)
    }
  }
}

// 选择行变化
const handleSelectionChange = (val) => {
  console.log('选中的行：', val)
}

// 切换月份
const changeMonth = async (val) => {
  month.value = val
  currentPage.value = 1 // 切换月份时，回到第一页
  const [year, this_month] = val.split('-').map(Number)
  await fetchArticles(year, this_month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null)
  ElMessage.success(`已切换至${val}月份`)
}
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

.filter-section {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-label {
  margin-right: 5px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.reporter-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

/* 蒙版样式 - 完全按照设计图实现 */
.video-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease-out;
}

.video-modal-mask.show {
  opacity: 1;
  visibility: visible;
}

/* 弹出框主体 - 完全按照设计图实现 */
.video-modal {
  width: 900px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  overflow: hidden;
  transform: scale(0.95);
  transition: transform 0.3s ease-out;
  position: relative;
}

.video-modal-mask.show .video-modal {
  transform: scale(1);
}

/* 关闭按钮 - 完全按照设计图实现 */
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  z-index: 10;
}

.modal-close:hover {
  background: rgba(0,0,0,0.3);
}

/* 视频容器 - 完全按照设计图实现 */
.video-container {
  width: 100%;
  height: 506px; /* 16:9 比例：900/16*9=506.25 */
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-video {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  font-size: 16px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paper-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 700px;
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
}

.paper-container iframe {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.no-paper {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  font-size: 16px;
}

.html-content-container {
  width: 100%;
  height: 700px;
  overflow-y: auto;
  background: #fff;
  padding: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.html-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.html-content :deep(div) {
  margin: 10px 0;
  line-height: 1.6;
}

.html-content :deep(p) {
  margin: 10px 0;
  line-height: 1.6;
}

.no-content {
  text-align: center;
  padding: 20px;
  color: #999;
}

.remaining-score {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.remaining-score.high {
  background-color: #f0f9eb;
  color: #67c23a;
  border: 1px solid #c2e7b0;
}

.remaining-score.warning {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4ab;
}

.remaining-score .label {
  font-weight: bold;
}

.remaining-score .value {
  font-size: 18px;
  font-weight: bold;
  margin-left: 5px;
}

.text-danger {
  color: #f56c6c;
}

/* 表格行剩余分数样式 */
.remaining-score-cell {
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
}

.remaining-score-cell.high {
  background-color: #f0f9eb;
  color: #67c23a;
}

.remaining-score-cell.warning {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>
