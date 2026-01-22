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
          <el-menu-item index="/login" @click="logout" v-if="isLoggedIn">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-menu-item>
        </el-menu>
        <div v-if="isLoggedIn" class="user-info">
          欢迎，{{ username }}
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

.user-info {
  color: #fff;
  margin-left: 20px;
  display: flex;
  align-items: center;
}

.el-main {
  padding: 20px;
  background-color: #f9f9f9;
}
</style>