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
        <el-tooltip content="仅导出当前页面数据" placement="top">
          <el-button type="success" icon="Download" @click="exportToExcel">导出Excel</el-button>
        </el-tooltip>
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
    

    
    <!-- 手机端详情弹窗 -->
    <el-dialog
      v-model="mobileDetailVisible"
      title="新闻详情"
      width="95%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="mobile-detail-dialog"
    >
      <div v-if="currentMobileDetail" class="mobile-detail-content">
        <div class="detail-item">
          <span class="detail-label">新闻标题：</span>
          <span class="detail-value">{{ currentMobileDetail.title }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">发布日期：</span>
          <span class="detail-value">{{ currentMobileDetail.publishDate }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">媒体：</span>
          <span class="detail-value">{{ currentMobileDetail.program_name || '未知媒体' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">参考字数：</span>
          <span class="detail-value highlight-character-count">
            {{ typeof currentMobileDetail.character_count === 'number' ? currentMobileDetail.character_count.toLocaleString() : '0' }}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">版号：</span>
          <span class="detail-value">{{ currentMobileDetail.page_meta_id !== 0 ? currentMobileDetail.page_meta_id : '' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">版名：</span>
          <span class="detail-value">{{ currentMobileDetail.page_meta_id !== 0 ? currentMobileDetail.page_name : '' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">文字记者：</span>
          <span class="detail-value">{{ currentMobileDetail.textReporter }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">摄影记者：</span>
          <span class="detail-value">{{ currentMobileDetail.photoReporter }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">通讯员：</span>
          <span class="detail-value">{{ currentMobileDetail.correspondentReporter }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">总分：</span>
          <span class="detail-value" :class="{ 'text-danger': typeof currentMobileDetail.totalScore === 'number' && currentMobileDetail.totalScore < 0 }">
            {{ typeof currentMobileDetail.totalScore === 'number' ? Math.round(currentMobileDetail.totalScore) : '0' }}
          </span>
        </div>
      </div>
      <template #footer>
        <div class="mobile-detail-actions">
          <el-button type="primary" @click="openEditDialog(currentMobileDetail)">打分</el-button>
          <el-button 
            v-if="currentMobileDetail && currentMobileDetail.media_type === 0"
            :disabled="!currentMobileDetail.tv_url"
            type="info" 
            @click="openTvUrl(currentMobileDetail.tv_url, currentMobileDetail.title)"
          >播放</el-button>
          <el-button 
            v-if="currentMobileDetail && currentMobileDetail.media_type === 1"
            :disabled="!currentMobileDetail.paper_url"
            type="info" 
            @click="openPaperUrl(currentMobileDetail.paper_url, currentMobileDetail.title)"
          >电子报</el-button>
          <el-button 
            type="info" 
            @click="openHtmlContentDialog(currentMobileDetail)"
          >文稿</el-button>
          <el-button 
            type="warning" 
            @click="deleteArticle(currentMobileDetail)"
          >删除</el-button>
          <el-button @click="mobileDetailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 记者选择弹窗 -->
    <el-dialog
      v-model="reporterSelectDialogVisible"
      title="选择记者"
      :width="isMobile ? '100%' : '500px'"
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
          <el-table-column type="selection" width="100" />
          <el-table-column prop="name" label="记者姓名" width="350" />
          <!-- <el-table-column prop="category_name" label="记者类型" width="150" /> -->
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
      <el-checkbox v-model="filterCorrespondent" style="margin-right: 10px">通讯员</el-checkbox>
      <el-button type="primary" icon="Search" @click="handleSearch">查询</el-button>
    </div>

    <!-- 考核列表 -->
    <div class="news-list-container">
      <!-- 桌面端表格 -->
      <el-table
        v-loading="loading"
        :data="newsList"
        border
        stripe
        style="width: 100%; flex: 1"
        class="desktop-table"
      >
      <template #empty>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-else>暂无数据</div>
      </template>
      <el-table-column label="ID" width="50">
        <template #default="scope">
          {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column prop="title" label="新闻标题" min-width="350" />
      <el-table-column prop="publishDate" label="发布日期" width="100" />
      <el-table-column label="媒体" width="120">
        <template #default="scope">
          {{ scope.row.program_name || '未知媒体' }}
        </template>
      </el-table-column>
      <el-table-column prop="character_count" label="参考字数" width="90">
        <template #default="scope">
          <span class="highlight-character-count">
            {{ typeof scope.row.character_count === 'number' ? scope.row.character_count.toLocaleString() : '0' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="版号" width="80">
        <template #default="scope">
          {{ scope.row.page_meta_id !== 0 ? scope.row.page_meta_id : '' }}
        </template>
      </el-table-column>
      <el-table-column label="版名" width="120">
        <template #default="scope">
          {{ scope.row.page_meta_id !== 0 ? scope.row.page_name : '' }}
        </template>
      </el-table-column>
      <el-table-column prop="textReporter" label="文字记者" width="130" />
      <el-table-column prop="photoReporter" label="摄影记者" width="130" />
      <el-table-column prop="correspondentReporter" label="通讯员" width="130" />

      <!-- <el-table-column prop="bonus" label="加分项" width="80">
        <template #default="scope">
          {{ typeof scope.row.bonus === 'number' ? Math.round(scope.row.bonus) : '0' }}
        </template>
      </el-table-column>
      <el-table-column prop="penalty" label="扣分项" width="80">
        <template #default="scope">
          {{ typeof scope.row.penalty === 'number' ? Math.round(scope.row.penalty) : '0' }}
        </template>
      </el-table-column> -->
      <el-table-column prop="totalScore" label="总分" width="70">
        <template #default="scope">
          <span :class="{ 'text-danger': typeof scope.row.totalScore === 'number' && scope.row.totalScore < 0 }">
            {{ typeof scope.row.totalScore === 'number' ? Math.round(scope.row.totalScore) : '0' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="差额" width="100">
        <template #default="scope">
          <span :class="{ 'text-danger': typeof calculateScoreDifference(scope.row) === 'number' && calculateScoreDifference(scope.row) !== 0 }">
            {{ calculateScoreDifference(scope.row) }}
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
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openEditDialog(scope.row)">打分</el-button>
          <!-- 用于展示电视新闻或报纸新闻的链接 -->
          <el-button 
            v-if="scope.row.media_type === 0"
            :disabled="!scope.row.tv_url"
            size="small" 
            type="info" 
            @click="openTvUrl(scope.row.tv_url, scope.row.title)"
          >播放</el-button>
          <el-button 
            v-if="scope.row.media_type === 1"
            :disabled="!scope.row.paper_url"
            size="small" 
            type="info" 
            @click="openPaperUrl(scope.row.paper_url, scope.row.title)"
          >电子报</el-button>
          <el-button 
            size="small" 
            type="info" 
            @click="openHtmlContentDialog(scope.row)"
          >文稿</el-button>
          <el-button 
            type="warning" 
            size="small" 
            @click="deleteArticle(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
      </el-table>
      
      <!-- 手机端卡片列表 -->
      <div class="mobile-card-list">
        <div v v-loading="loading"></div>
        <div v-if="newsList.length === 0" class="empty-message">
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-else>暂无数据</div>
        </div>
        <div 
          v-for="(item, index) in newsList" 
          :key="item.id" 
          class="mobile-card"
          @click="openMobileDetail(item)"
        >
          <div class="card-header">
            <span class="card-index">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
            <span class="card-title">{{ item.title }}</span>
          </div>
          <div class="card-info">
            <span class="info-item">{{ item.publishDate }}</span>
            <span class="info-item">{{ item.program_name || '未知媒体' }}</span>
            <span class="info-item score" :class="{ 'text-danger': typeof item.totalScore === 'number' && item.totalScore < 0 }">
              {{ typeof item.totalScore === 'number' ? Math.round(item.totalScore) : '0' }}分
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 9999]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalArticles"
        class="desktop-pagination"
      >
      </el-pagination>
      <!-- 手机端自定义分页 -->
      <div class="mobile-pagination">
        <div class="mobile-pagination-content">
          <button 
            class="pagination-btn prev-btn" 
            @click="handleCurrentChange(currentPage > 1 ? currentPage - 1 : 1)"
            :disabled="currentPage === 1"
          >
            <span class="arrow">←</span>
          </button>
          <div class="pagination-numbers">
            <button 
              v-for="num in visiblePages" 
              :key="num"
              class="page-number"
              :class="{ active: num === currentPage }"
              @click="handleCurrentChange(num)"
            >
              {{ num }}
            </button>
          </div>
          <button 
            class="pagination-btn next-btn" 
            @click="handleCurrentChange(currentPage < totalPages ? currentPage + 1 : totalPages)"
            :disabled="currentPage === totalPages"
          >
            <span class="arrow">→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑新闻评分' : '新增新闻评分'"
      :width="isMobile ? '100%' : '600px'"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="score-dialog"
    >
      <!-- 桌面端布局 -->
      <div v-if="!isMobile">
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
          
          <!-- 通讯员 -->
          <el-form-item label="通讯员">
            <div v-for="(reporter, index) in newsForm.correspondentReporters" :key="'correspondent-' + index" class="reporter-item">
              <el-input 
                v-model="reporter.reporter_name" 
                placeholder="请输入通讯员姓名" 
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
                @click="removeReporter('correspondent', index)"
              >删除</el-button>
            </div>
            <el-button type="primary" size="small" @click="addReporter('correspondent')" style="margin-top: 10px;">
              <el-icon><Plus /></el-icon> 添加通讯员
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
          <el-form-item label="参考字数">
            <div style="font-size: 14px; color: #606266;">{{ newsForm.character_count || 0 }}</div>
          </el-form-item>
          <el-form-item label="基本分" prop="baseScore">
            <el-input
              v-model.number="newsForm.baseScore"
              placeholder="请输入基本分"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="执行分" prop="executeScore">
            <el-input
              v-model.number="newsForm.executeScore"
              placeholder="请输入执行分"
              style="width: 200px"
            />
            <div style="margin-top: 5px; color: #999; font-size: 12px;">
              记者得分合计 - 基本分
            </div>
          </el-form-item>
          <el-form-item label="总分">
            <el-input
              v-model="totalScore"
              disabled
              style="width: 200px; color: #666"
            />
          </el-form-item>
          <el-form-item label="差额">
            <el-input
              :value="scoreDifference"
              :style="{ width: '200px', color: scoreDifference > 0 ? '#f56c6c' : scoreDifference < 0 ? '#67c23a' : '#666' }"
              disabled
            />
            <div style="margin-top: 5px; color: #999; font-size: 12px;">
              总分 - 记者得分汇总
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 手机端布局 -->
      <div v-else class="mobile-score-form">
        <el-form
          ref="newsFormRef"
          :model="newsForm"
          :rules="newsFormRules"
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
            <div v-for="(reporter, index) in newsForm.textReporters" :key="'text-' + index" class="mobile-reporter-item">
              <el-input 
                v-model="reporter.reporter_name" 
                placeholder="请输入记者姓名" 
                style="width: 100%; margin-bottom: 5px;"
              />
              <div class="mobile-reporter-score">
                <el-input-number 
                  v-model="reporter.score" 
                  :min="0" 
                  :max="1000" 
                  :precision="0" 
                  placeholder="分数" 
                  style="width: 100px; margin-right: 10px;"
                />
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="removeReporter('text', index)"
                >删除</el-button>
              </div>
            </div>
            <el-button type="primary" size="small" @click="addReporter('text')" style="margin-top: 10px;">
              <el-icon><Plus /></el-icon> 添加文字记者
            </el-button>
          </el-form-item>
          
          <!-- 摄影记者 -->
          <el-form-item label="摄影记者">
            <div v-for="(reporter, index) in newsForm.photoReporters" :key="'photo-' + index" class="mobile-reporter-item">
              <el-input 
                v-model="reporter.reporter_name" 
                placeholder="请输入记者姓名" 
                style="width: 100%; margin-bottom: 5px;"
              />
              <div class="mobile-reporter-score">
                <el-input-number 
                  v-model="reporter.score" 
                  :min="0" 
                  :max="1000" 
                  :precision="0" 
                  placeholder="分数" 
                  style="width: 100px; margin-right: 10px;"
                />
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="removeReporter('photo', index)"
                >删除</el-button>
              </div>
            </div>
            <el-button type="primary" size="small" @click="addReporter('photo')" style="margin-top: 10px;">
              <el-icon><Plus /></el-icon> 添加摄影记者
            </el-button>
          </el-form-item>
          
          <!-- 通讯员 -->
          <el-form-item label="通讯员">
            <div v-for="(reporter, index) in newsForm.correspondentReporters" :key="'correspondent-' + index" class="mobile-reporter-item">
              <el-input 
                v-model="reporter.reporter_name" 
                placeholder="请输入通讯员姓名" 
                style="width: 100%; margin-bottom: 5px;"
              />
              <div class="mobile-reporter-score">
                <el-input-number 
                  v-model="reporter.score" 
                  :min="0" 
                  :max="1000" 
                  :precision="0" 
                  placeholder="分数" 
                  style="width: 100px; margin-right: 10px;"
                />
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="removeReporter('correspondent', index)"
                >删除</el-button>
              </div>
            </div>
            <el-button type="primary" size="small" @click="addReporter('correspondent')" style="margin-top: 10px;">
              <el-icon><Plus /></el-icon> 添加通讯员
            </el-button>
          </el-form-item>
          <el-form-item label="媒体类型" prop="program_id">
            <el-select
              v-model="newsForm.program_id"
              placeholder="请选择媒体类型"
              style="width: 100%"
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
          <el-form-item label="参考字数">
            <div style="font-size: 14px; color: #606266;">{{ newsForm.character_count || 0 }}</div>
          </el-form-item>
          <el-form-item label="基本分" prop="baseScore">
            <el-input
              v-model.number="newsForm.baseScore"
              placeholder="请输入基本分"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="执行分" prop="executeScore">
            <el-input
              v-model.number="newsForm.executeScore"
              placeholder="请输入执行分"
              style="width: 100%"
            />
            <div style="margin-top: 5px; color: #999; font-size: 12px;">
              记者得分合计 - 基本分
            </div>
          </el-form-item>
          <el-form-item label="总分">
            <el-input
              v-model="totalScore"
              disabled
              style="width: 100%; color: #666"
            />
          </el-form-item>
          <el-form-item label="差额">
            <el-input
              :value="scoreDifference"
              :style="{ width: '100%', color: scoreDifference > 0 ? '#f56c6c' : scoreDifference < 0 ? '#67c23a' : '#666' }"
              disabled
            />
            <div style="margin-top: 5px; color: #999; font-size: 12px;">
              总分 - 记者得分汇总
            </div>
          </el-form-item>
        </el-form>
      </div>
      
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

// 移动设备检测
const isMobile = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索筛选
const searchKeyword = ref('')
const filterReporter = ref('')
const filterReporterId = ref('0') // 0 表示全部记者
const filterMediaType = ref('0') // 0 表示全部媒体
const filterCorrespondent = ref(false) // 是否只显示通讯员

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



// 记者选择弹窗相关
const reporterSelectDialogVisible = ref(false)
const currentReporterType = ref('') // 'text' 或 'photo'
const selectedReporters = ref([]) // 当前选择的记者
const allAvailableReporters = ref([]) // 所有可用记者列表
const reporterSearchKeyword = ref('') // 记者搜索关键词

// 手机端详情弹窗相关
const mobileDetailVisible = ref(false)
const currentMobileDetail = ref(null)

// 分页相关计算属性
const totalPages = computed(() => {
  return Math.ceil(totalArticles.value / pageSize.value)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  const pageCount = 3
  
  let start = Math.max(1, current - Math.floor(pageCount / 2))
  let end = Math.min(total, start + pageCount - 1)
  
  if (end - start + 1 < pageCount) {
    start = Math.max(1, end - pageCount + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

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

// 计算文字、摄像记者和通讯员的得分合计
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
  // 计算通讯员得分总和
  newsForm.correspondentReporters.forEach(reporter => {
    total += parseInt(reporter.score) || 0
  })
  return total
})

// 基本分和执行分现在可以手动输入，不再自动计算档次
const autoCalculateExecuteScore = computed(() => {
  const total = reportersTotalScore.value
  const base = newsForm.baseScore || 0
  return Math.max(0, total - base)
})

// 计算总分和记者得分汇总的差额
const scoreDifference = computed(() => {
  const total = newsForm.baseScore + newsForm.executeScore
  return total - reportersTotalScore.value
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
  correspondentReporters: [], // 通讯员列表，每个元素包含name和score
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
        category_id: type === 'text' ? 3 : (type === 'correspondent' ? 7 : (newsForm.media_type === 0 ? 4 : 5))
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
      let isExist = false
      if (reporter.category_id === 3) {
        isExist = newsForm.textReporters.some(r => r.reporter_id === reporter.id)
      } else if (reporter.category_id === 4 || reporter.category_id === 5) {
        isExist = newsForm.photoReporters.some(r => r.reporter_id === reporter.id)
      } else if (reporter.category_id === 7) {
        isExist = newsForm.correspondentReporters.some(r => r.reporter_id === reporter.id)
      }
      
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
        } else if (reporter.category_id === 7) {
          newsForm.correspondentReporters.push({
            reporter_name: reporter.name,
            score: 0,
            reporter_id: reporter.id || 0,
            reporter_category_id: 7, // 通讯员类别
            reporter_category_name: '通讯员'
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
  } else if (type === 'correspondent') {
    newsForm.correspondentReporters.splice(index, 1)
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
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value: null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null, filterCorrespondent.value)
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

// 计算表格行中文章的总分和记者得分汇总的差额
const calculateScoreDifference = (row) => {
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
  
  // 差额 = 文章总分 - 所有记者得分总和
  return articleTotal - reportersTotal
}

// ESC键处理函数
const handleEscapeKey = (e) => {
  if (e.key === 'Escape') {
    if (videoDialogVisible.value) {
      closeVideoModal()
    } else if (htmlContentDialogVisible.value) {
      closeHtmlModal()
    }
  }
}

// 检测移动设备
const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 初始化月份选项
onMounted(async () => {
  // 检测移动设备
  checkIsMobile()
  
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
      response.data.sort((a, b) => b.order_id - a.order_id)
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
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null, filterCorrespondent.value)
  
  // 添加ESC键事件监听器
  document.addEventListener('keydown', handleEscapeKey)
  // 添加窗口大小变化监听器
  window.addEventListener('resize', checkIsMobile)
})

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  window.removeEventListener('resize', checkIsMobile)
})

// 方法：打开手机端详情弹窗
const openMobileDetail = (item) => {
  currentMobileDetail.value = item
  mobileDetailVisible.value = true
}

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
    correspondentReporters: [],
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
    correspondentReporters: row.reporter_scores.filter(item => item.reporter_category_id === 7),
    page_name: row.page_name || '',
    page_meta_id: row.page_meta_id || 0,
    character_count: row.character_count || 0,
  })
  dialogVisible.value = true
}

// 方法：提交表单
const submitForm = async () => {
  try {
    await newsFormRef.value.validate()
    
    // 直接使用表单中输入的基本分和执行分
    const calculatedBaseScore = newsForm.baseScore || 0
    const calculatedExecuteScore = newsForm.executeScore || 0
    
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
    // 计算通讯员得分总和
    newsForm.correspondentReporters.forEach(reporter => {
      reportersTotal += parseInt(reporter.score) || 0
    })
    
    // 转换记者数据格式为API预期格式
    const formData = {
      ...newsForm,
      baseScore: calculatedBaseScore, // 使用自动计算的基本分
      executeScore: calculatedExecuteScore, // 使用自动计算的执行分
      textReporter: newsForm.textReporters.map(r => r.name).join(','),
      photoReporter: newsForm.photoReporters.map(r => r.name).join(','),
      correspondentReporter: newsForm.correspondentReporters.map(r => r.name).join(','),
      publishDate: typeof newsForm.publishDate === 'string' ? newsForm.publishDate : dayjs(newsForm.publishDate).format('YYYY-MM-DD'),
      is_collaboration: newsForm.correspondentReporters.length > 0 ? 1 : 0,
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
        ...newsForm.correspondentReporters.map(r => ({
          reporter_id: r.reporter_id,
          score: r.score, // 表单中的分数已经是整数
          reporter_category_id: 7, // 通讯员为7
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
    await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null, filterCorrespondent.value)
    
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
    // 使用ElMessageBox替代自定义弹窗，自动管理z-index层级
    ElMessageBox.alert(
      `<div class="html-content">${row.html_content}</div>`,
      row.title || '内容查看',
      {
        dangerouslyUseHTMLString: true,
        customClass: 'html-content-dialog',
        showConfirmButton: true,
        confirmButtonText: '关闭',
        center: true
      }
    )
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
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null, filterCorrespondent.value)
}

const handleCurrentChange = async (val) => {
  currentPage.value = val
  // 重新获取数据，传递搜索关键词和筛选条件
  const [year, month] = selectedMonth.value.split('-').map(Number)
  await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null, filterCorrespondent.value)
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
    await fetchArticles(year, month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null, filterCorrespondent.value)
    
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
  await fetchArticles(year, this_month, currentPage.value, pageSize.value, searchKeyword.value, filterReporterId.value > 0 ? filterReporterId.value : null, filterMediaType.value > 0 ? parseInt(filterMediaType.value) : null, filterCorrespondent.value)
  ElMessage.success(`已切换至${val}月份`)
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

/* HTML内容对话框样式 */
.html-content-dialog {
  max-height: 90vh !important;
}

/* PC端样式 - 保持原有宽高比，宽度明显大于高度 */
@media (min-width: 769px) {
  .html-content-dialog {
    max-width: 90% !important;
    width: 1200px !important;
    max-height: 70vh !important;
  }
}

/* 移动端样式 */
@media (max-width: 768px) {
  .html-content-dialog {
    max-width: 95% !important;
    max-height: 90vh !important;
  }
}

.html-content-dialog .el-message-box__content {
  overflow-y: auto;
  padding: 20px;
}

/* PC端内容区域高度 */
@media (min-width: 769px) {
  .html-content-dialog .el-message-box__content {
    max-height: 500px;
  }
}

/* 移动端内容区域高度 */
@media (max-width: 768px) {
  .html-content-dialog .el-message-box__content {
    max-height: 70vh;
  }
}

.html-content-dialog .html-content {
  line-height: 1.6;
}

.html-content-dialog .html-content :deep(div) {
  margin: 10px 0;
  line-height: 1.6;
}

.html-content-dialog .html-content :deep(p) {
  margin: 10px 0;
  line-height: 1.6;
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

/* 高亮的参考字数 */
.highlight-character-count {
  color: #409eff;
  font-weight: bold;
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

/* 手机端卡片列表样式 */
.mobile-card-list {
  display: none;
}

.mobile-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.mobile-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.card-index {
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 10px;
  flex-shrink: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #666;
}

.info-item {
  flex-shrink: 0;
}

.info-item.score {
  font-weight: bold;
  color: #409eff;
}

.empty-message {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

/* 手机端详情弹窗样式 */
  .mobile-detail-content {
    padding: 10px 0;
  }

  .detail-item {
    display: flex;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .detail-item:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-weight: bold;
    color: #333;
    min-width: 100px;
    flex-shrink: 0;
  }

  .detail-value {
    color: #666;
    flex: 1;
    word-break: break-all;
  }



.mobile-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.mobile-detail-actions .el-button {
  flex: 1;
  min-width: 80px;
}

/* 分页容器样式 */
.pagination-container {
  margin-top: 20px;
  width: 100%;
  position: relative;
  margin-bottom: 20px;
}

/* 桌面端分页 */
.desktop-pagination {
  text-align: right;
  width: 100%;
}

/* 手机端分页 */
.mobile-pagination {
  display: none;
  text-align: center;
  width: 100%;
}

/* 自定义分页组件样式 */
.mobile-pagination {
  display: none;
  width: 100%;
}

.mobile-pagination-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
  padding: 10px 0;
}

.pagination-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin: 0 5px;
  flex-shrink: 0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.arrow {
  font-size: 14px;
  font-weight: bold;
}

.pagination-numbers {
  display: flex;
  align-items: center;
  margin: 0 5px;
  flex-shrink: 0;
}

.page-number {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin: 0 2px;
  flex-shrink: 0;
}

.page-number:hover {
  border-color: #409eff;
  color: #409eff;
}

.page-number.active {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* 响应式布局 - 手机端适配 */
@media (max-width: 768px) {
  .pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .desktop-pagination {
    display: none;
  }
  
  .mobile-pagination {
    display: block;
  }
  
  .mobile-pagination-content {
    width: 100%;
  }
  
  /* 筛选区域适配 */
  .filter-section {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    gap: 2px !important;
    padding: 5px !important;
    width: 100% !important;
  }
  
  /* 隐藏所有筛选标签 */
  .filter-section .filter-label {
    display: none !important;
  }
  
  /* 只显示搜索框、媒体选择和查询按钮 */
  .filter-section > *:not(.el-input):not(.el-select:nth-child(4)):not(.el-button) {
    display: none !important;
  }
  
  /* 搜索框占主要宽度 */
  .filter-section .el-input {
    flex: 1 !important;
    min-width: 120px !important;
    margin-right: 2px !important;
  }
  
  /* 媒体选择固定宽度 */
  .filter-section .el-select:nth-child(4) {
    flex: 0 0 100px !important;
    margin-right: 2px !important;
  }
  
  /* 查询按钮固定宽度 */
  .filter-section .el-button {
    flex: 0 0 60px !important;
    background-color: #409eff !important;
    color: #ffffff !important;
    border: 1px solid #409eff !important;
    height: 30px !important;
    font-size: 12px !important;
    padding: 0 !important;
  }
  
  /* 调整输入框和选择器样式 */
  .filter-section .el-input__wrapper,
  .filter-section .el-select .el-input__wrapper {
    border-radius: 4px !important;
    border: 1px solid #dcdfe6 !important;
    background-color: #ffffff !important;
    box-shadow: none !important;
    height: 30px !important;
  }
  
  /* 调整输入框字体大小 */
  .filter-section .el-input__wrapper input,
  .filter-section .el-select .el-input__wrapper input {
    font-size: 12px !important;
    line-height: 30px !important;
  }
  
  /* 调整选择器下拉箭头位置 */
  .filter-section .el-select .el-input__wrapper .el-select__caret {
    line-height: 30px !important;
  }
  
  /* 隐藏页面标题 */
  .header h2 {
    display: none;
  }
  
  /* 隐藏新增和导出按钮 */
  .header-actions .el-button:not(:first-child) {
    display: none;
  }
}

/* 新闻列表容器样式 */
.news-list-container {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 330px);
}

/* 响应式布局 - 手机端适配 */
@media (max-width: 768px) {
  .assessment-container {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .filter-section .el-input,
  .filter-section .el-select {
    width: 100% !important;
    margin-right: 0 !important;
  }
  
  .filter-section .el-checkbox {
    margin-top: 5px;
  }
  
  /* 隐藏桌面端表格，显示手机端卡片列表 */
  .desktop-table {
    display: none;
  }
  
  .mobile-card-list {
    display: block;
  }
  
  /* 分页组件适配 */
  .desktop-pagination {
    display: none;
  }
  
  .mobile-pagination {
    display: block;
    width: 100%;
  }
  
  /* 新闻列表容器适配 */
  .news-list-container {
    height: auto;
    min-height: 200px;
  }
  
  /* 表格适配 */
  .el-table {
    font-size: 12px;
  }
  
  .el-table th {
    padding: 8px 4px;
  }
  
  .el-table td {
    padding: 8px 4px;
  }
  
  /* 弹窗适配 */
  .video-modal {
    width: 95%;
    max-width: 95%;
  }
  
  .video-container {
    height: 200px;
  }
  
  .html-modal {
    width: 95%;
    max-width: 95%;
  }
  
  .html-modal-content {
    padding: 10px;
  }
  
  .paper-container {
    height: 400px;
  }
  

  
  /* 打分页面（编辑对话框）手机模式适配 */
  /* 使用更具体的选择器确保样式生效 */
  @media (max-width: 768px) {
    body .score-dialog {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      left: 0 !important;
      right: 0 !important;
      transform: none !important;
      position: fixed !important;
      top: 0 !important;
      bottom: 0 !important;
      height: 100% !important;
      border-radius: 0 !important;
    }
    
    body .score-dialog .el-dialog__body {
      padding: 10px !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      width: 100% !important;
      box-sizing: border-box !important;
      height: calc(100% - 100px) !important;
    }
    
    /* 调整表单容器 */
    body .score-dialog .el-form {
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 0 !important;
    }
    
    /* 调整表单标签宽度 */
    body .score-dialog .el-form .el-form-item__label {
      width: 50px !important;
      font-size: 12px !important;
      padding-right: 5px !important;
      line-height: 28px !important;
      box-sizing: border-box !important;
    }
    
    /* 调整表单内容宽度 */
    body .score-dialog .el-form .el-form-item__content {
      margin-left: 55px !important;
      width: calc(100% - 55px) !important;
      box-sizing: border-box !important;
      padding-right: 0 !important;
    }
    
    /* 调整输入框宽度 */
    body .score-dialog .el-form .el-input,
    body .score-dialog .el-form .el-select,
    body .score-dialog .el-form .el-input-number,
    body .score-dialog .el-form .el-date-picker {
      width: 100% !important;
      margin-right: 0 !important;
      box-sizing: border-box !important;
    }
    
    /* 调整输入框包装器宽度 */
    body .score-dialog .el-form .el-input__wrapper {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    
    /* 调整记者项宽度 */
    body .score-dialog .reporter-item {
      width: 100% !important;
      box-sizing: border-box !important;
      padding-right: 0 !important;
    }
    
    /* 调整表单项目 */
    body .score-dialog .el-form-item {
      width: 100% !important;
      box-sizing: border-box !important;
      margin-bottom: 10px !important;
    }
    
    /* 调整输入框和选择器 */
    body .score-dialog .el-input,
    body .score-dialog .el-select,
    body .score-dialog .el-input-number {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    
    /* 调整数字输入框 */
    body .score-dialog .el-input-number .el-input__wrapper {
      width: 100% !important;
    }
    
    /* 调整选择器 */
    body .score-dialog .el-select .el-input {
      width: 100% !important;
    }
    
    /* 调整对话框头部 */
    body .score-dialog .el-dialog__header {
      padding: 10px 15px !important;
      box-sizing: border-box !important;
    }
    
    body .score-dialog .el-dialog__title {
      font-size: 16px !important;
    }
    
    /* 调整对话框底部按钮布局 */
    body .score-dialog .el-dialog__footer {
      padding: 10px !important;
      display: flex !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
    }
    
    body .score-dialog .el-dialog__footer .el-button {
      flex: 1 !important;
      margin: 0 5px !important;
    }
    
    /* 调整按钮大小 */
    body .score-dialog .el-button {
      font-size: 12px !important;
      padding: 0 10px !important;
      height: 28px !important;
    }
    
    /* 调整输入框和选择器的高度 */
    body .score-dialog .el-input__wrapper,
    body .score-dialog .el-select .el-input__wrapper,
    body .score-dialog .el-input-number {
      height: 28px !important;
    }
    
    /* 调整输入框内容垂直居中 */
    body .score-dialog .el-input__wrapper input {
      line-height: 28px !important;
    }
    
    /* 调整媒体类型选择器 */
    body .score-dialog .el-select .el-input__wrapper {
      padding: 0 10px !important;
    }
    
    /* 调整记者项布局 */
    body .score-dialog .reporter-item {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 5px !important;
      width: 100% !important;
      align-items: center !important;
      padding-right: 0 !important;
    }
    
    body .score-dialog .reporter-item .el-input {
      flex: 1 !important;
      min-width: 80px !important;
      margin-right: 0 !important;
    }
    
    body .score-dialog .reporter-item .el-input-number {
      flex: 0 0 60px !important;
      margin-right: 0 !important;
    }
    
    body .score-dialog .reporter-item .el-button {
      flex: 0 0 40px !important;
      margin-right: 0 !important;
    }
    
    /* 调整添加记者按钮 */
    body .score-dialog .el-form-item .el-button {
      width: auto !important;
      flex: none !important;
    }
    
    /* 强制设置对话框宽度，确保覆盖默认样式 */
    .el-dialog.score-dialog {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      position: fixed !important;
      top: 0 !important;
      bottom: 0 !important;
      height: 100% !important;
      border-radius: 0 !important;
    }
    
    /* 确保对话框内容不溢出 */
    .el-dialog.score-dialog .el-dialog__body {
      max-width: 100% !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      box-sizing: border-box !important;
    }
    
    /* 调整对话框头部 */
    .el-dialog.score-dialog .el-dialog__header {
      padding: 10px 15px !important;
      box-sizing: border-box !important;
    }
    
    /* 调整对话框底部 */
    .el-dialog.score-dialog .el-dialog__footer {
      padding: 10px !important;
      box-sizing: border-box !important;
    }
    
    /* 调整记者项布局 */
    .reporter-item {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 5px !important;
      width: 100% !important;
      align-items: center !important;
      box-sizing: border-box !important;
      padding-right: 0 !important;
    }
    
    .reporter-item .el-input {
      flex: 1 !important;
      min-width: 80px !important;
      margin-right: 0 !important;
      box-sizing: border-box !important;
    }
    
    .reporter-item .el-input-number {
      flex: 0 0 60px !important;
      margin-right: 0 !important;
      box-sizing: border-box !important;
    }
    
    .reporter-item .el-button {
      flex: 0 0 40px !important;
      margin-right: 0 !important;
      box-sizing: border-box !important;
    }
  }
  
  /* 调整添加记者按钮 */
  .el-form-item .el-button {
    width: auto !important;
    flex: none !important;
  }
  
  /* 记者选择弹窗移动端适配 */
  @media (max-width: 768px) {
    .el-dialog {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      position: fixed !important;
      top: 0 !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 100% !important;
      border-radius: 0 !important;
    }
    
    .el-dialog .el-dialog__body {
      padding: 10px !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      width: 100% !important;
      box-sizing: border-box !important;
      height: calc(100% - 100px) !important;
    }
    
    .reporter-select-container {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    
    .reporter-select-container .el-input {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    
    .reporter-select-container .el-table {
      width: 100% !important;
      box-sizing: border-box !important;
    }
    
    .reporter-select-container .el-table th,
    .reporter-select-container .el-table td {
      padding: 8px 4px !important;
      font-size: 12px !important;
    }
    
    .el-dialog .el-dialog__header {
      padding: 10px 15px !important;
      box-sizing: border-box !important;
    }
    
    .el-dialog .el-dialog__title {
      font-size: 16px !important;
    }
    
    .el-dialog .el-dialog__footer {
      padding: 10px !important;
      box-sizing: border-box !important;
    }
  }
  
  /* 调整媒体类型选择器 */
  .el-select .el-input__wrapper {
    padding: 0 10px !important;
  }
  
  /* 调整输入框和选择器的高度 */
  .el-input__wrapper,
  .el-select .el-input__wrapper,
  .el-input-number {
    height: 28px !important;
  }
  
  /* 调整输入框内容垂直居中 */
  .el-input__wrapper input {
    line-height: 28px !important;
  }
  
  /* 调整对话框头部 */
  .el-dialog__header {
    padding: 10px 15px !important;
  }
  
  .el-dialog__title {
    font-size: 16px !important;
  }
  
  /* 调整按钮大小 */
  .el-button {
    font-size: 12px !important;
    padding: 0 10px !important;
    height: 28px !important;
  }
  
  /* 调整对话框底部按钮布局 */
  .el-dialog__footer {
    padding: 10px !important;
    display: flex !important;
    justify-content: space-between !important;
  }
  
  .el-dialog__footer .el-button {
    flex: 1 !important;
    margin: 0 5px !important;
  }
  
  /* 调整日期选择器大小 */
  .el-date-picker {
    font-size: 12px !important;
  }
  
  /* 调整输入框内容大小 */
  .el-input__wrapper input,
  .el-select .el-input__wrapper input {
    font-size: 12px !important;
  }
  
  /* 调整表单项目间距 */
  .el-form-item {
    margin-bottom: 10px !important;
  }
  
  /* 确保容器宽度 */
  .el-dialog__wrapper {
    width: 100% !important;
  }
} 
</style>
