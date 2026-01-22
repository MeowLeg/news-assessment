<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2 class="login-title">新闻中心考核系统</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginFormRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="name">
          <el-input
            v-model="loginForm.name"
            placeholder="请输入用户名"
            prefix-icon="User"
            @keyup.enter="submitForm"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="submitForm"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { isLoggedIn, userData } from '../store'

const router = useRouter()
const loginFormRef = ref(null)

const loginForm = reactive({
  name: '',
  password: ''
})

const loginFormRules = reactive({
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const submitForm = async () => {
  try {
    await loginFormRef.value.validate()
    
    // 引入API
    import('../api/index.js').then(api => {
      // 调用登录API
      api.default.login(loginForm).then(response => {
        if (response.success) {
          // 保存登录状态和完整的用户数据到localStorage
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('userData', JSON.stringify(response.data))
          
          // 更新store.js中的登录状态变量
          isLoggedIn.value = true
          userData.value = response.data
          
          ElMessage.success('登录成功')
          // 跳转到首页
          router.push('/')
        } else {
          // 登录失败，显示错误信息
          ElMessage.error('登录失败：' + (response.errMsg || '未知错误'))
        }
      }).catch(err => {
        ElMessage.error('登录失败：' + (err.message || '未知错误'))
        console.error('登录失败:', err)
      })
    })
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('登录失败：' + (err.message || '未知错误'))
      console.error('登录失败:', err)
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-form-wrapper {
  background-color: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 400px;
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #1989fa;
}
</style>
