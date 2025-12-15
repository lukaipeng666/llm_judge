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
    // 可以在这里添加 token 等
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
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ==================== API 接口 ====================

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
  return api.get(`/reports/${encodeURIComponent(dataset)}/${encodeURIComponent(model)}`)
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
 * 取消任务
 */
export const cancelTask = (taskId) => {
  return api.delete(`/tasks/${taskId}`)
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

export default api
