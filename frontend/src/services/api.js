import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加 token 到请求头
    const token = localStorage.getItem('llm_judge_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail || error.message || '请求失败'
    const errorMsg = `[HTTP ${status}] ${detail}`
    console.error('API Error:', errorMsg, error.response?.data)

    // 处理401未授权错误
    if (status === 401) {
      const requestUrl = error.config?.url || ''

      // 如果是登录接口的401错误，不要自动刷新（让前端处理错误提示）
      if (requestUrl.includes('/auth/login')) {
        return Promise.reject(new Error(errorMsg))
      }

      // 其他401错误才清除token并跳转到登录页
      localStorage.removeItem('llm_judge_token')
      localStorage.removeItem('llm_judge_user')
      window.location.href = '/login'
    }

    return Promise.reject(new Error(errorMsg))
  }
)

// ==================== API 接口 ====================

// ---------- 认证相关 ----------

/**
 * 用户注册
 */
export const register = (username, password, email) => {
  return api.post('/auth/register', { username, password, email })
}

/**
 * 用户登录
 */
export const login = (username, password) => {
  return api.post('/auth/login', { username, password })
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = () => {
  return api.get('/auth/me')
}

// ---------- 用户数据管理 ----------

/**
 * 获取用户数据文件列表
 */
export const getUserDataFiles = () => {
  return api.get('/user/data')
}

/**
 * 上传用户数据文件
 */
export const uploadUserDataFile = (file, description) => {
  const formData = new FormData()
  formData.append('file', file)
  if (description) {
    formData.append('description', description)
  }
  return api.post('/user/data', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 更新用户数据文件描述（已废弃，保留用于兼容）
 */
export const updateUserDataFile = (id, description) => {
  return api.put(`/user/data/${id}?description=${encodeURIComponent(description)}`)
}

/**
 * 编辑用户数据内容（单独或批量）
 */
export const editUserDataContent = (dataId, editRequest) => {
  return api.put(`/user/data/${dataId}/edit`, editRequest)
}

/**
 * 编辑单条数据的完整内容（支持一次修改多个允许的字段）
 */
export const editSingleItemComplete = (dataId, itemIndex, editedItem) => {
  return api.put(`/user/data/${dataId}/edit-item`, {
    item_index: itemIndex,
    edited_item: editedItem
  })
}

/**
 * 删除用户数据文件
 */
export const deleteUserDataFile = (id) => {
  return api.delete(`/user/data/${id}`)
}

/**
 * 获取用户数据文件的详细内容（JSONL数据）
 */
export const getUserDataContent = (dataId) => {
  return api.get(`/user/data/${dataId}/content`)
}

/**
 * 删除单条数据
 */
export const deleteSingleItem = (dataId, itemIndex) => {
  return api.delete(`/user/data/${dataId}/items/${itemIndex}`)
}

/**
 * 批量删除数据
 */
export const batchDeleteItems = (dataId, itemIndices) => {
  return api.request({
    method: 'delete',
    url: `/user/data/${dataId}/items`,
    data: { item_indices: itemIndices }
  })
}

/**
 * 添加单条数据
 */
export const addSingleItem = (dataId, newItem) => {
  return api.post(`/user/data/${dataId}/items`, {
    new_item: newItem
  })
}

/**
 * 导入并追加CSV或JSONL数据
 */
export const appendDataFile = (dataId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/user/data/${dataId}/append`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ---------- 评测配置 ----------

/**
 * 获取可用的评分函数列表
 */
export const getScoringFunctions = () => {
  return api.get('/scoring-functions')
}

/**
 * 获取数据文件列表
 */
export const getDataFiles = () => {
  return api.get('/data-files')
}

/**
 * 获取所有报告列表
 */
export const getReports = () => {
  return api.get('/reports')
}

/**
 * 获取报告详情
 */
export const getReportDetail = (dataset, model) => {
  // 使用查询参数而不是路径参数，以避免特殊字符问题
  return api.get('/reports/detail', {
    params: { dataset, model }
  })
}

/**
 * 删除报告
 */
export const deleteReport = (reportId) => {
  return api.delete(`/reports/${reportId}`)
}

/**
 * 启动评测任务
 */
export const startEvaluation = (config) => {
  return api.post('/evaluate', config)
}

/**
 * 获取任务状态
 */
export const getTaskStatus = (taskId) => {
  return api.get(`/tasks/${taskId}`)
}

/**
 * 获取所有任务列表
 */
export const getAllTasks = () => {
  return api.get('/tasks')
}

/**
 * 取消或删除任务
 */
export const cancelTask = (taskId) => {
  return api.delete(`/tasks/${taskId}`)
}

/**
 * 更新任务信息
 */
export const updateTask = (taskId, updates) => {
  return api.put(`/tasks/${taskId}`, updates)
}

/**
 * 获取可用模型列表
 */
export const getAvailableModels = () => {
  return api.get('/models')
}

/**
 * 获取可用数据集列表
 */
export const getAvailableDatasets = () => {
  return api.get('/datasets')
}

// ---------- 管理员接口 ----------

/**
 * 管理员获取所有用户
 */
export const getAdminUsers = () => {
  return api.get('/admin/users')
}

/**
 * 管理员删除用户
 */
export const deleteAdminUser = (userId) => {
  return api.delete(`/admin/users/${userId}`)
}

/**
 * 管理员获取所有任务
 */
export const getAdminTasks = () => {
  return api.get('/admin/tasks')
}

/**
 * 管理员终止任务
 */
export const terminateAdminTask = (taskId) => {
  return api.post(`/admin/tasks/${taskId}/terminate`)
}

/**
 * 管理员获取所有数据
 */
export const getAdminData = () => {
  return api.get('/admin/data')
}

/**
 * 管理员删除用户数据
 */
export const deleteAdminData = (userId, dataId) => {
  return api.delete(`/admin/users/${userId}/data/${dataId}`)
}

// ---------- 模型配置接口 ----------

/**
 * 获取所有可用的模型配置（普通用户）
 */
export const getModelConfigs = () => {
  return api.get('/model-configs')
}

/**
 * 管理员获取所有模型配置
 */
export const getAdminModelConfigs = () => {
  return api.get('/admin/model-configs')
}

/**
 * 管理员创建模型配置
 */
export const createAdminModelConfig = (config) => {
  return api.post('/admin/model-configs', config)
}

/**
 * 管理员更新模型配置
 */
export const updateAdminModelConfig = (configId, updates) => {
  return api.put(`/admin/model-configs/${configId}`, updates)
}

/**
 * 管理员删除模型配置
 */
export const deleteAdminModelConfig = (configId) => {
  return api.delete(`/admin/model-configs/${configId}`)
}

export default api
