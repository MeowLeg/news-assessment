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

    <!-- 筛选区 -->
    <div class="filter-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索新闻标题/记者姓名"
        prefix-icon="Search"
        style="width: 300px; margin-right: 10px"
      />
      <el-select v-model="filterReporter" placeholder="筛选记者">
        <el-option label="全部" value="" />
        <el-option
          v-for="reporter in allReporters"
          :key="reporter"
          :label="reporter"
          :value="reporter"
        />
      </el-select>
    </div>

    <!-- 考核列表 -->
    <el-table
      :data="filteredNewsList"
      border
      stripe
      style="width: 100%; margin-top: 20px"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="title" label="新闻标题" min-width="200" />
      <el-table-column prop="publishDate" label="发布日期" width="120" />
      <el-table-column prop="textReporter" label="文字记者" width="150" />
      <el-table-column prop="photoReporter" label="摄影记者" width="150" />
      <el-table-column prop="baseScore" label="基本分" width="100">
        <template #default="scope">
          {{ scope.row.baseScore.toFixed(1) }}
        </template>
      </el-table-column>
      <el-table-column prop="executeScore" label="执行分" width="100">
        <template #default="scope">
          {{ scope.row.executeScore.toFixed(1) }}
        </template>
      </el-table-column>
      <el-table-column prop="bonus" label="加分项" width="100">
        <template #default="scope">
          {{ scope.row.bonus.toFixed(1) }}
        </template>
      </el-table-column>
      <el-table-column prop="penalty" label="扣分项" width="100">
        <template #default="scope">
          {{ scope.row.penalty.toFixed(1) }}
        </template>
      </el-table-column>
      <el-table-column prop="totalScore" label="总分" width="100">
        <template #default="scope">
          <span :class="{ 'text-danger': scope.row.totalScore < 0 }">
            {{ scope.row.totalScore.toFixed(1) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteNews(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="filteredNewsList.length"
      style="margin-top: 20px; text-align: right"
    >
    </el-pagination>

    <!-- 统计卡片 -->
    <div class="statistics-card" style="margin-top: 30px">
      <el-card title="考核统计">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">新闻总数</span>
              <span class="value">{{ newsList.length }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">平均总分</span>
              <span class="value">{{ avgTotalScore.toFixed(1) }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">最高得分</span>
              <span class="value">{{ maxTotalScore.toFixed(1) }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <span class="label">最低得分</span>
              <span class="value">{{ minTotalScore.toFixed(1) }}</span>
            </div>
          </el-col>
        </el-row>

        <!-- 记者统计 -->
        <div style="margin-top: 20px">
          <h4>记者得分统计</h4>
          <el-table :data="reporterStats" border stripe style="width: 100%">
            <el-table-column prop="name" label="记者姓名" width="120" />
            <el-table-column prop="type" label="参与类型" width="120" />
            <el-table-column prop="count" label="新闻数量" width="100" />
            <el-table-column prop="total" label="总分贡献" width="120">
              <template #default="scope">
                {{ scope.row.total.toFixed(1) }}
              </template>
            </el-table-column>
            <el-table-column prop="avg" label="平均得分" width="120">
              <template #default="scope">
                {{ scope.row.avg.toFixed(1) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑新闻评分' : '新增新闻评分'"
      width="600px"
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
        <el-form-item label="文字记者" prop="textReporter">
          <el-input v-model="newsForm.textReporter" placeholder="多个记者用逗号分隔" />
        </el-form-item>
        <el-form-item label="摄影记者" prop="photoReporter">
          <el-input v-model="newsForm.photoReporter" placeholder="多个记者用逗号分隔" />
        </el-form-item>
        <el-form-item label="基本分" prop="baseScore">
          <el-input-number
            v-model="newsForm.baseScore"
            :min="0"
            :max="100"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="执行分" prop="executeScore">
          <el-input-number
            v-model="newsForm.executeScore"
            :min="0"
            :max="50"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="加分项" prop="bonus">
          <el-input-number
            v-model="newsForm.bonus"
            :min="0"
            :max="20"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="扣分项" prop="penalty">
          <el-input-number
            v-model="newsForm.penalty"
            :min="0"
            :max="20"
            :precision="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="总分">
          <el-input
            v-model="totalScore"
            disabled
            style="color: #666"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

// 月份选择
const month = ref('2025-12')
const selectedMonth = ref('2025-12')
const monthOptions = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索筛选
const searchKeyword = ref('')
const filterReporter = ref('')

// 弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const newsFormRef = ref(null)

// 表单数据
const newsForm = reactive({
  id: '',
  title: '',
  publishDate: '',
  textReporter: '',
  photoReporter: '',
  baseScore: 0,
  executeScore: 0,
  bonus: 0,
  penalty: 0
})

// 表单校验规则
const newsFormRules = reactive({
  title: [{ required: true, message: '请输入新闻标题', trigger: 'blur' }],
  publishDate: [{ required: true, message: '请选择发布日期', trigger: 'change' }],
  textReporter: [{ required: true, message: '请输入文字记者', trigger: 'blur' }],
  baseScore: [{ required: true, message: '请输入基本分', trigger: 'change' }],
  executeScore: [{ required: true, message: '请输入执行分', trigger: 'change' }]
})

// 计算总分
const totalScore = computed(() => {
  return (newsForm.baseScore + newsForm.executeScore + newsForm.bonus - newsForm.penalty).toFixed(1)
})

// 模拟数据
const newsList = ref([
  {
    id: '1',
    title: '城市马拉松赛事圆满落幕',
    publishDate: '2025-12-01',
    textReporter: '张三',
    photoReporter: '李四',
    baseScore: 80,
    executeScore: 15,
    bonus: 5,
    penalty: 0,
    totalScore: 95
  },
  {
    id: '2',
    title: '冬季供暖保障工作全面启动',
    publishDate: '2025-12-05',
    textReporter: '张三,王五',
    photoReporter: '李四',
    baseScore: 75,
    executeScore: 18,
    bonus: 3,
    penalty: 0,
    totalScore: 96
  },
  {
    id: '3',
    title: '本地企业科技创新成果发布会',
    publishDate: '2025-12-10',
    textReporter: '赵六',
    photoReporter: '李四,孙七',
    baseScore: 85,
    executeScore: 12,
    bonus: 5,
    penalty: 2,
    totalScore: 100
  }
])

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
    list = list.filter(item => 
      item.textReporter.includes(filterReporter.value) ||
      item.photoReporter.includes(filterReporter.value)
    )
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return list.slice(start, end)
})

// 所有记者列表
const allReporters = computed(() => {
  const reporters = new Set()
  newsList.value.forEach(item => {
    // 处理文字记者
    item.textReporter.split(',').forEach(r => {
      if (r.trim()) reporters.add(r.trim())
    })
    // 处理摄影记者
    item.photoReporter.split(',').forEach(r => {
      if (r.trim()) reporters.add(r.trim())
    })
  })
  return Array.from(reporters)
})

// 统计数据
const avgTotalScore = computed(() => {
  if (newsList.value.length === 0) return 0
  const sum = newsList.value.reduce((acc, item) => acc + item.totalScore, 0)
  return sum / newsList.value.length
})

const maxTotalScore = computed(() => {
  if (newsList.value.length === 0) return 0
  return Math.max(...newsList.value.map(item => item.totalScore))
})

const minTotalScore = computed(() => {
  if (newsList.value.length === 0) return 0
  return Math.min(...newsList.value.map(item => item.totalScore))
})

// 记者统计数据
const reporterStats = computed(() => {
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
          total: 0,
          avg: 0
        }
      }
      stats[reporter + '_text'].count++
      stats[reporter + '_text'].total += item.totalScore
      stats[reporter + '_text'].avg = stats[reporter + '_text'].total / stats[reporter + '_text'].count
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
          total: 0,
          avg: 0
        }
      }
      stats[reporter + '_photo'].count++
      stats[reporter + '_photo'].total += item.totalScore
      stats[reporter + '_photo'].avg = stats[reporter + '_photo'].total / stats[reporter + '_photo'].count
    })
  })
  
  // 转换为数组并排序
  return Object.values(stats).sort((a, b) => b.total - a.total)
})

// 初始化月份选项
onMounted(() => {
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
})

// 方法：打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false
  // 重置表单
  Object.assign(newsForm, {
    id: '',
    title: '',
    publishDate: '',
    textReporter: '',
    photoReporter: '',
    baseScore: 0,
    executeScore: 0,
    bonus: 0,
    penalty: 0
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
    textReporter: row.textReporter,
    photoReporter: row.photoReporter,
    baseScore: row.baseScore,
    executeScore: row.executeScore,
    bonus: row.bonus,
    penalty: row.penalty,
    reporter_scores: row.reporter_scores || []
  })
  dialogVisible.value = true
}

// 方法：提交表单
const submitForm = async () => {
  try {
    await newsFormRef.value.validate()
    
    // 计算总分
    const total = newsForm.baseScore + newsForm.executeScore + newsForm.bonus - newsForm.penalty
    if (total < 0) {
      ElMessage.error('总分不能为负数，请调整评分')
      return
    }
    
    if (isEdit.value) {
      // 编辑模式
      const index = newsList.value.findIndex(item => item.id === newsForm.id)
      if (index !== -1) {
        newsList.value[index] = {
          ...newsList.value[index],
          title: newsForm.title,
          publishDate: newsForm.publishDate,
          textReporter: newsForm.textReporter,
          photoReporter: newsForm.photoReporter,
          baseScore: newsForm.baseScore,
          executeScore: newsForm.executeScore,
          bonus: newsForm.bonus,
          penalty: newsForm.penalty,
          totalScore: total
        }
        ElMessage.success('编辑成功')
      }
    } else {
      // 新增模式
      const newId = Date.now().toString()
      newsList.value.push({
        id: newId,
        title: newsForm.title,
        publishDate: newsForm.publishDate,
        textReporter: newsForm.textReporter,
        photoReporter: newsForm.photoReporter,
        baseScore: newsForm.baseScore,
        executeScore: newsForm.executeScore,
        bonus: newsForm.bonus,
        penalty: newsForm.penalty,
        totalScore: total
      })
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('表单验证失败，请检查必填项')
  }
}

// 方法：删除新闻
const deleteNews = (id) => {
  ElMessageBox.confirm(
    '确定要删除这条考核记录吗？',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = newsList.value.findIndex(item => item.id === id)
    if (index !== -1) {
      newsList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
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
    '加分项': item.bonus.toFixed(1),
    '扣分项': item.penalty.toFixed(1),
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
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 选择行变化
const handleSelectionChange = (val) => {
  console.log('选中的行：', val)
}

// 切换月份
const changeMonth = (val) => {
  month.value = val
  // 这里可以添加加载对应月份数据的逻辑
  ElMessage.success(`已切换至${val}月份`)
}
</script>

<style scoped>
.assessment-container {
  max-width: 1400px;
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
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-item .value {
  font-size: 24px;
  font-weight: bold;
  color: #1989fa;
}

.text-danger {
  color: #f56c6c;
}
</style>