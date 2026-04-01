# 排序功能实现计划

## 需求
在 `department` 不为空的情况下，增加一个选项，可以切换文章的排序方式：按时间或按人名。

## 分析
- `hasDepartment` computed property 已经存在，用于判断用户是否有部门信息
- 当前文章列表通过 `newsList` 直接渲染，没有排序逻辑
- 需要在筛选区域添加排序选择器，仅在 `hasDepartment` 为 true 时可见

## 实现步骤

### 1. 添加状态变量 (NewsList.vue)
在 script setup 中添加：
```javascript
const sortType = ref('time') // 'time' 按时间排序, 'name' 按人名排序
```

### 2. 创建排序后的计算属性 (NewsList.vue)
在 `filteredNewsList` 计算属性后添加 `sortedNewsList`：
```javascript
const sortedNewsList = computed(() => {
  const list = [...filteredNewsList.value]
  if (sortType.value === 'name') {
    return list.sort((a, b) => {
      const nameA = a.textReporter || ''
      const nameB = b.textReporter || ''
      return nameA.localeCompare(nameB, 'zh-CN')
    })
  }
  // 默认按时间排序（降序）
  return list.sort((a, b) => {
    return new Date(b.publishDate) - new Date(a.publishDate)
  })
})
```

### 3. 添加排序选择器 UI (NewsList.vue)
在筛选区域（filter-section）中添加排序选择器，位置在"仅本部门"复选框后面：
```vue
<el-select 
  v-if="hasDepartment"
  v-model="sortType"
  placeholder="排序方式"
  style="width: 150px; margin-right: 10px"
>
  <el-option label="按时间排序" value="time" />
  <el-option label="按人名排序" value="name" />
</el-select>
```

### 4. 更新模板引用 (NewsList.vue)
将模板中所有 `newsList` 的引用改为 `sortedNewsList`：
- 桌面端表格：`:data="sortedNewsList"`
- 手机端卡片列表：`v-for="(item, index) in sortedNewsList"`
- 导出 Excel 函数中使用 `sortedNewsList`

## 文件修改
- `/src/views/NewsList.vue` - 主要修改文件

## 注意事项
- 排序仅在前端进行，不影响后端数据
- 按人名排序使用中文 localeCompare 确保正确的中文排序
- 默认排序保持按时间降序（最新的在前）
- 排序选择器仅在 `hasDepartment` 为 true 时显示
