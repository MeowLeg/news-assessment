<template>
  <div id="app">
    <!-- 导航栏 -->
    <el-container>
      <el-header>
        <div class="logo">新闻中心考核系统</div>
        <el-menu
          :default-active="activeIndex"
          class="el-menu-demo"
          mode="horizontal"
          router
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/">
            <el-icon><List /></el-icon>
            文章列表
          </el-menu-item>
          <el-menu-item index="/reporter-stats">
            <el-icon><DataAnalysis /></el-icon>
            记者统计
          </el-menu-item>
        </el-menu>
        <div class="header-right">
          <div v-if="isLoggedIn" class="user-info">
            欢迎，{{ username }}
          </div>
          <div class="logout-button" @click="logout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </div>
        </div>
      </el-header>
      <el-main>
        <!-- 路由视图 -->
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { List, DataAnalysis, SwitchButton } from '@element-plus/icons-vue'
import { isLoggedIn, userData, username } from './store'

const route = useRoute()
const router = useRouter()

// 计算当前激活的菜单
const activeIndex = computed(() => route.path)

// 检查登录状态
const checkLoginStatus = () => {
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true'
  const savedUserData = localStorage.getItem('userData')
  if (savedUserData) {
    userData.value = JSON.parse(savedUserData)
  } else {
    userData.value = {}
  }
}

// 登出功能
const logout = () => {
  // 清除登录状态
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('userData')
  isLoggedIn.value = false
  userData.value = {}
  
  ElMessage.success('登出成功')
  // 重定向到登录页
  router.push('/login')
}

// 初始化检查登录状态
onMounted(() => {
  checkLoginStatus()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f9f9f9;
}

#app {
  min-height: 100vh;
}

.el-header {
  display: flex;
  align-items: center;
  background-color: #545c64;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.logo {
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
}

.el-menu-demo {
  flex: 1;
  background-color: transparent;
  border-bottom: none;
}

.header-right {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.user-info {
  color: #fff;
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.logout-button {
  color: #fff !important;
  white-space: nowrap;
  display: flex;
  align-items: center;
  font-weight: 500;
  padding: 0 15px;
  height: 40px;
}

.logout-button:hover {
  color: #ffd04b !important;
}

/* 调整按钮内部图标和文字的布局 */
.logout-button .el-icon {
  margin-right: 5px;
  font-size: 16px;
}

.el-main {
  padding: 20px;
  background-color: #f9f9f9;
}
/* 响应式布局 - 手机端适配 */
@media (max-width: 768px) {
  .el-header {
    padding: 0 10px;
  }
  
  .logo {
    font-size: 16px;
    margin-right: 10px;
  }
  
  /* 隐藏文章列表和记者统计菜单 */
  .el-menu-demo {
    display: none !important;
  }
  
  /* 调整右侧容器 */
  .header-right {
    flex: 0 0 auto;
  }
  
  /* 隐藏用户信息 */
  .user-info {
    display: none !important;
  }
  
  /* 调整退出按钮样式 */
  .logout-button {
    font-size: 14px;
    padding: 0 10px;
    height: 40px;
    display: flex;
    align-items: center;
    white-space: nowrap;
    color: #fff !important;
    font-weight: 500;
  }
  
  /* 确保按钮内部图标和文字正确显示 */
  .logout-button .el-icon {
    margin-right: 5px;
    font-size: 16px;
  }
}
</style>