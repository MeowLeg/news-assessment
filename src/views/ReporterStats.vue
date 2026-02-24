<template>
  <div class="assessment-container">
    <!-- 页面标题和操作区 -->
    <div class="header">
      <h2>{{ month }} 记者考核统计</h2>
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
        <el-button type="success" icon="Download" @click="exportReporterStats">导出记者统计</el-button>
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
    
    <!-- 统计卡片 -->
    <div class="statistics-card">
      <el-card title="考核统计">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <span class="label">平均总分</span>
              <span class="value">{{ Math.round(avgTotalScore) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <span class="label">最高得分</span>
              <span class="value">{{ Math.round(maxTotalScore) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <span class="label">最低得分</span>
              <span class="value">{{ Math.round(minTotalScore) }}</span>
            </div>
          </el-col>
        </el-row>

        <!-- 记者统计 -->
        <div style="margin-top: 20px; display: flex; flex-direction: column; height: calc(100vh - 350px); overflow-x: auto;">
          <h4 style="margin-bottom: 10px;">记者得分统计</h4>
          <el-table 
            v-loading="loading" 
            :data="reporterStats" 
            border 
            stripe 
            style="width: 100%; flex: 1; min-width: 1200px;"
          >
            <template #empty>
              <div v-if="error" class="error-message">{{ error }}</div>
              <div v-else>暂无数据</div>
            </template>
            <el-table-column prop="name" label="记者姓名" width="120" />
            <!-- <el-table-column prop="type" label="参与类型" width="120" /> -->
            <el-table-column prop="count" label="新闻数量" width="100" />
            <el-table-column prop="newsTotal" label="新闻得分合计" width="120">
              <template #default="scope">
                {{ typeof scope.row.newsTotal === 'number' ? Math.round(scope.row.newsTotal) : Math.round(scope.row.total) }}
              </template>
            </el-table-column>
            <el-table-column prop="bonus" label="补分" width="100">
              <template #default="scope">
                {{ typeof scope.row.bonus === 'number' ? Math.round(scope.row.bonus) : '0' }}
              </template>
            </el-table-column>
            <el-table-column prop="penalty" label="扣罚" width="100">
              <template #default="scope">
                {{ typeof scope.row.penalty === 'number' ? Math.round(scope.row.penalty) : '0' }}
              </template>
            </el-table-column>
            <el-table-column prop="specialTotal" label="专项赋分合计" width="120">
              <template #default="scope">
                {{ typeof scope.row.specialTotal === 'number' ? Math.round(scope.row.specialTotal) : '0' }}
              </template>
            </el-table-column>
            <el-table-column prop="collabTotal" label="业务协同合计" width="120">
              <template #default="scope">
                {{ typeof scope.row.collabTotal === 'number' ? Math.round(scope.row.collabTotal) : '0' }}
              </template>
            </el-table-column>
            <el-table-column prop="total" label="总分贡献" width="120">
              <template #default="scope">
                {{ typeof scope.row.total === 'number' ? Math.round(scope.row.total) : '0' }}
              </template>
            </el-table-column>
            <el-table-column label="分数调整" width="330">
              <template #default="scope">
                <el-button size="small" type="success" @click="openScoreAdjustDialog(scope.row, '1')">增分</el-button>
                <el-button size="small" type="warning" @click="openScoreAdjustDialog(scope.row, '2')">减分</el-button>
                <el-button size="small" type="info" @click="openSpecialScoreDialog(scope.row, 'special')">专项赋分</el-button>
                <el-button size="small" type="success" @click="openSpecialScoreDialog(scope.row, 'collab')">业务协同</el-button>
              </template>
            </el-table-column>
            <el-table-column label="记者管理" width="150">
              <template #default="scope">
                <el-button size="small" type="primary" @click="openEditReporterDialog(scope.row)">编辑</el-button>
                <el-button size="small" type="warning" @click="confirmDeleteReporter(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import { newsList, avgTotalScore, maxTotalScore, minTotalScore, reporterStats, month, selectedMonth, monthOptions, fetchReporters, fetchReporterMonthlyStats, loading, error } from '../store.js'
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
  type: '1', // 1-加分，2-减分
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
const currentScoreType = ref('special') // 'special' - 专项赋分, 'collab' - 业务协同
const specialScoreChanged = ref(false) // 跟踪专项赋分列表是否发生变化

const specialScoreForm = reactive({
  reporterName: '',
  items: []
})

// 专项赋分项目表单
const specialScoreItemForm = reactive({
  name: '',
  score: null,
  source: ''
})

// 专项赋分项目表单验证规则
const specialScoreItemFormRules = reactive({
  name: [{ required: true, message: '请输入协作内容', trigger: 'blur' }],
  score: [{ required: true, message: '请输入分数', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }]
})

// 新增/编辑记者弹窗相关
const reporterDialogVisible = ref(false)
const reporterFormRef = ref(null)
const editingReporterId = ref(null)
const reporterCategories = ref([]) // 存储记者分类数据

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

// 打开新增记者弹窗
const openAddReporterDialog = () => {
  editingReporterId.value = null
  clearReporterForm()
  reporterDialogVisible.value = true
}

// 打开编辑记者弹窗
const openEditReporterDialog = (row) => {
  editingReporterId.value = row.id
  // 填充表单数据
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
    
    // 准备API数据
    const apiData = {
      id: editingReporterId.value || null,
      name: reporterForm.name,
      reporter_category_id: parseInt(reporterForm.type),
      department: reporterForm.department,
      phone: reporterForm.phone,
      state: 1 // 1表示正常状态
    }
    
    // 调用API保存记者信息
    await api.saveReporter(apiData)
    
    ElMessage.success(editingReporterId.value ? '记者信息编辑成功' : '记者信息新增成功')
    reporterDialogVisible.value = false
    
    // 刷新记者数据
    await fetchReporters()
    const [year, month] = selectedMonth.value.split('-').map(Number)
    await fetchReporterMonthlyStats(year, month)
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
      // 准备API数据，将state设为0表示删除
      const apiData = {
        id: row.id,
        name: row.name,
        reporter_category_id: row.reporter_category_id || parseInt(row.type),
        department: row.department || '',
        phone: row.phone || '',
        state: 0 // 0表示删除状态
      }
      
      // 调用API删除记者（软删除）
      await api.saveReporter(apiData)
      
      ElMessage.success('记者删除成功')
      
      // 刷新记者数据
      await fetchReporters()
      const [year, month] = selectedMonth.value.split('-').map(Number)
      await fetchReporterMonthlyStats(year, month)
    } catch (err) {
      ElMessage.error('删除记者失败：' + (err.message || '未知错误'))
      console.error('删除记者失败:', err)
    }
  }).catch(() => {
    // 取消删除
    ElMessage.info('已取消删除')
  })
}

// 打开增减分弹窗
const openScoreAdjustDialog = async (row, type = '1') => {
  currentReporter.value = row
  scoreAdjustForm.reporterName = row.name
  scoreAdjustForm.score = 0
  scoreAdjustForm.type = type // 1-增分，2-减分
  scoreAdjustForm.reason = ''
  
  // 如果是增分，调用接口获取加分相关信息
  if (type === '1') {
    try {
      // 获取当前月份
      const [year, month] = selectedMonth.value.split('-').map(Number)
      // 调用get_monthly_add_sub接口，传递记者名称和月份
      const response = await api.getMonthlyAddScore({ 
        year, 
        month,
        reporter_id: row.id
      })
      
      // 如果接口返回了数据，填充到表单中
      if (response.success && response.data) {
        // 假设接口返回的数据结构包含score、reason、source等字段
        scoreAdjustForm.id = response.data.id || null
        scoreAdjustForm.reporter_id = response.data.reporter_id || null
        scoreAdjustForm.score = response.data.score || 0
        scoreAdjustForm.reason = response.data.reason || ''
        // 如果有source字段，也可以填充到表单中
        // scoreAdjustForm.source = response.data.source || ''
      }
    } catch (err) {
      console.error('获取加分信息失败:', err)
      ElMessage.warning('获取加分信息失败，将使用默认值')
    }
  } else if (type === '2') {
    try {
      // 获取当前月份
      const [year, month] = selectedMonth.value.split('-').map(Number)
      // 调用get_monthly_add_sub接口，传递记者名称和月份
      const response = await api.getMonthlySubScore({ 
        year, 
        month,
        reporter_id: row.id
      })
      
      // 如果接口返回了数据，填充到表单中
      if (response.success && response.data) {
        // 假设接口返回的数据结构包含score、reason、source等字段
        scoreAdjustForm.score = response.data.score || 0
        scoreAdjustForm.reason = response.data.reason || ''
        // 如果有source字段，也可以填充到表单中
        // scoreAdjustForm.source = response.data.source || ''
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
    
    // 根据类型调用不同的API
    if (scoreAdjustForm.type === '1') {
      // 增分
      await api.monthlyAddScore(apiData)
    } else {
      // 减分
      await api.monthlySubScore(apiData)
    }
    
    ElMessage.success('增减分设置成功')
    scoreAdjustDialogVisible.value = false
    // 刷新数据
    await fetchReporterMonthlyStats(year, month)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('增减分设置失败：' + (err.message || '未知错误'))
      console.error('增减分设置失败:', err)
    }
  }
}

// 打开专项赋分或业务协同弹窗
const openSpecialScoreDialog = async (row, scoreType = 'special') => {
  currentReporter.value = row
  currentScoreType.value = scoreType
  specialScoreForm.reporterName = row.name
  specialScoreForm.items = []
  specialScoreChanged.value = false // 重置变化标志
  
  try {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    const params = {
      reporter_id: row.id,
      year,
      month
    }
    
    let response
    if (scoreType === 'special') {
      // 专项赋分：从get_event_scores获取数据
      response = await api.getEventScores(params)
    } else {
      // 业务协同：从get_cooperation_scores获取数据
      response = await api.getCooperationScores(params)
    }
    
    if (response.success) {
      // 将获取的数据转换为specialScoreForm.items需要的格式
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
    // 编辑现有项目
    Object.assign(specialScoreItemForm, item)
  } else {
    // 新增项目
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
    
    // 如果是编辑现有项目，添加id字段
    if (editingItemIndex.value !== null) {
      const existingItem = specialScoreForm.items[editingItemIndex.value]
      if (existingItem.id) {
        eventData.id = existingItem.id
      }
    }
    
    // 根据类型调用不同的API
    let response
    if (currentScoreType.value === 'special') {
      // 专项赋分：调用event接口
      response = await api.saveEvent(eventData)
    } else {
      // 业务协同：调用cooperation接口
      response = await api.saveCooperation(eventData)
    }
    
    // 更新本地数据
    if (editingItemIndex.value !== null) {
      // 更新现有项目
      specialScoreForm.items[editingItemIndex.value] = {
        ...specialScoreItemForm,
        id: response.data || null
      }
    } else {
      // 添加新项目
      specialScoreForm.items.push({
        ...specialScoreItemForm,
        id: response.data || null
      })
    }
    
    specialScoreItemDialogVisible.value = false
    specialScoreChanged.value = true // 标记列表发生变化
    ElMessage.success(editingItemIndex.value !== null ? '项目修改成功' : '项目添加成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('项目设置失败：' + (err.message || '未知错误'))
      console.error('项目设置失败:', err)
    }
  } finally {
    // 无论成功或失败，都清空表单数据和编辑索引，以便下次使用
    clearSpecialScoreItemForm()
  }
}

// 清空专项赋分项目表单数据
const clearSpecialScoreItemForm = () => {
  specialScoreItemDialogVisible.value = false
  editingItemIndex.value = null
  // 清空表单数据
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
    
    // 如果项目有id，调用API删除
    if (item.id) {
      const deleteData = {
        id: item.id,
        reporter_id: 0,
        content: '',
        publish_year: 0,
        publish_month: 0,
        score: 0,
        score_from: '',
        state: 0 // 0表示删除
      }
      
      // 根据类型调用不同的API
      if (currentScoreType.value === 'special') {
        // 专项赋分：调用event接口删除
        await api.saveEvent(deleteData)
      } else {
        // 业务协同：调用cooperation接口删除
        await api.saveCooperation(deleteData)
      }
    }
    
    // 删除本地数据
    specialScoreForm.items.splice(index, 1)
    specialScoreChanged.value = true // 标记列表发生变化
    ElMessage.success('项目删除成功')
  } catch (err) {
    ElMessage.error('项目删除失败：' + (err.message || '未知错误'))
    console.error('项目删除失败:', err)
  }
}

// 关闭专项赋分弹窗
const closeSpecialScoreDialog = async () => {
  specialScoreDialogVisible.value = false
  
  // 如果列表发生变化，刷新记者统计数据
  if (specialScoreChanged.value) {
    const [year, month] = selectedMonth.value.split('-').map(Number)
    await fetchReporterMonthlyStats(year, month)
  }
}

// 提交专项赋分
const submitSpecialScore = async () => {
  try {
    // 简单验证：至少一个项目的名称和分数不为空
    if (specialScoreForm.items.length === 0) {
      ElMessage.error('请至少添加一个赋分项目')
      return
    }
    
    ElMessage.success('专项赋分设置成功')
    await closeSpecialScoreDialog() // 使用关闭函数来处理刷新
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('专项赋分设置失败：' + (err.message || '未知错误'))
      console.error('专项赋分设置失败:', err)
    }
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
  
  // 获取记者分类数据
  await fetchReporterCategories()
  
  // 获取初始数据
  await fetchReporters()
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchReporterMonthlyStats(year, month)
  
  // 打印记者统计数据，以便调试
  console.log('记者统计数据:', reporterStats.value)
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
  ElMessage.success(`已切换至${val}月份`)
}

// 导出记者统计
const exportReporterStats = () => {
  // 准备导出数据，包含除了操作按钮外的所有列
  const exportData = reporterStats.value.map(item => ({
    '记者姓名': item.name,
    '参与类型': item.type,
    '新闻数量': item.count,
    '新闻得分合计': Math.round(item.newsTotal || item.total),
    '补分': Math.round(item.bonus || 0),
    '扣罚': Math.round(item.penalty || 0),
    '专项赋分合计': Math.round(item.specialTotal || 0),
    '业务协同合计': Math.round(item.collabTotal || 0),
    '总分贡献': Math.round(item.total || 0)
  }))
  
  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(exportData)
  // 创建工作簿
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${month.value}记者统计`)
  
  // 导出文件
  XLSX.writeFile(wb, `${month.value}记者考核统计.xlsx`)
  ElMessage.success('记者统计导出成功')
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
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #1989fa;
}

.special-score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.special-score-item {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 10px;
}

.special-score-item:hover {
  background: #f0f0f0;
}
</style>
