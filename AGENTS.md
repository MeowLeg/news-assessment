# AGENTS.md - News Assessment Project Guidelines

## Project Overview
Vue 3 news assessment/evaluation system for tracking journalist performance, article scores, and monthly statistics.

**Stack:** Vue 3 + Vite + Element Plus + Vue Router + Axios + dayjs + xlsx
**Module Type:** ES modules (`"type": "module"` in package.json)
**Path Alias:** `@/` resolves to `src/`

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build
```

**Note:** No test or lint scripts configured. No `.cursorrules`, `.cursor/rules/`, or `.github/copilot-instructions.md` files exist.

## Project Structure

```
src/
├── main.js                    # App entry point
├── App.vue                    # Root component
├── router.js                  # Vue Router config
├── store.js                   # Global state (ref/reactive)
├── api/index.js               # Axios client + endpoints
├── components/NewsAssessment.vue
├── views/
│   ├── Login.vue
│   ├── NewsList.vue
│   └── ReporterStats.vue
└── assets/
    ├── button-theme.css
    └── table-theme.css
```

## Code Style Guidelines

### File Organization
- Vue SFC order: Template → `<script setup>` → `<style scoped>`
- Imports grouped: Vue → Libraries → Components → Utils
- 4-space indentation, no tabs

### Vue 3 Composition API
```javascript
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const count = ref(0)              // primitives
const form = reactive({ name: '' }) // objects
const derived = computed(() => count.value * 2)

onMounted(async () => { await fetchData() })
```

### Naming Conventions
- **Components/files:** PascalCase (`NewsList.vue`)
- **Variables/functions:** camelCase (`newsList`, `fetchArticles`)
- **Constants:** SCREAMING_SNAKE or camelCase
- **CSS classes:** kebab-case (`.news-list-container`)
- **Store exports:** Named lowercamelCase

### Templates
- kebab-case for HTML attributes/directives
- `v-if`/`v-else` for mutually exclusive conditions
- `v-for` with unique `:key`
- Always use `<style scoped>`

### API Patterns
```javascript
// src/api/index.js
const apiClient = axios.create({
  baseURL: 'https://develop.xinlantech.cn',
  timeout: 10000
})

// Auth interceptor (reads from localStorage)
apiClient.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('userData'))
  config.headers.account = user.name
  config.headers.sessionid = user.sessionid
  return config
})

// 401 → clear storage, redirect to /login
apiClient.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

### Error Handling
```javascript
try {
  const res = await api.getArticles(params)
  if (res.success) newsList.value = res.data
} catch (err) {
  ElMessage.error('操作失败：' + err.message)
}
```

### State Management
- `ref()` for primitives, `reactive()` for objects, `computed()` for derived
- Global state in `store.js` with named exports
- Import: `import { newsList, fetchArticles } from '../store'`

### Element Plus
- Icons from `@element-plus/icons-vue`
- `ElMessage` for notifications, `ElMessageBox.confirm()` for destructive actions
- Form validation via async `validate()`

### Styling
```css
/* Scoped per component */
.container { max-width: 1400px; margin: 0 auto; padding: 20px; }
.text-danger { color: #f56c6c; }
.highlight { color: #1989fa; }
```

### Common Patterns
```javascript
// Mobile detection
const isMobile = ref(window.innerWidth <= 768)
window.addEventListener('resize', () => { isMobile.value = window.innerWidth <= 768 })

// Month options (last 12 months)
import dayjs from 'dayjs'
const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const d = dayjs().subtract(i, 'month')
    return { label: d.format('YYYY年MM月'), value: d.format('YYYY-MM') }
  })
)

// Form reset
Object.assign(form, { id: '', title: '', score: 0 })
```

## API Routes
Base: `https://develop.xinlantech.cn` | Dev prefix: `/zscmwages/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/zscmscore/get_page_meta` | Page metadata |
| GET | `/zscmscore/get_reporters` | Journalist list |
| GET | `/zscmscore/get_articles` | Article list |
| POST | `/zscmscore/article` | Create/update article |
| POST | `/zscmscore/score` | Score article |
| POST | `/zscmscore/login` | User login |

## Notes
- Pure JavaScript (no TypeScript)
- No ESLint/Prettier configured
- Chinese comments in codebase
- Auth via localStorage
- Base path: `/zscmwages/` (configured in vite.config.js)
