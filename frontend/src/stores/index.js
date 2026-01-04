import { create } from 'zustand'
import * as api from '../services/api'

// Token 管理工具
const TOKEN_KEY = 'llm_judge_token'
const USER_KEY = 'llm_judge_user'

const getToken = () => localStorage.getItem(TOKEN_KEY)
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
const removeToken = () => localStorage.removeItem(TOKEN_KEY)

const getUser = () => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}
const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user))
const removeUser = () => localStorage.removeItem(USER_KEY)

// 默认 LLM API URL（从 Vite 环境变量或配置文件读取）
const defaultApiUrl = typeof __LLM_API_URL__ !== 'undefined' ? __LLM_API_URL__ : 'http://localhost:8000/v1'

/**
 * 统一的 Store（合并所有功能）
 */
const useStore = create((set, get) => ({
  // ==================== 认证状态 ====================
  token: getToken(),
  user: getUser(),
  isAuthenticated: !!getToken(),

  // ==================== 通用状态 ====================
  loading: false,
  error: null,

  // ==================== 评测配置 ====================
  scoringFunctions: [],
  dataFiles: [],
  availableModels: [],
  formData: {
    api_urls: [defaultApiUrl],
    model: '',
    data_file: '',
    scoring: 'rouge',
    scoring_module: './function_register/plugin.py',
    max_workers: 4,
    badcase_threshold: 1,
    report_dir: './reports',
    report_format: 'json, txt, badcases',
    test_mode: false,
    sample_size: 2147483648,
    checkpoint_path: '',
    checkpoint_interval: 32,
    resume: false,
    role: 'assistant',
    timeout: 10,
    max_tokens: 1024,
    api_key: 'sk-xxx',
    is_vllm: true,
    temperature: 0.0,
    top_p: 1.0,
  },

  // ==================== 任务管理 ====================
  tasks: [],
  currentTask: null,

  // ==================== 报告管理 ====================
  reports: [],
  currentReport: null,

  // ==================== 用户数据管理 ====================
  userDataFiles: [],
  currentDataDetail: null,
  dataDetailLoading: false,

  // ==================== Actions: 认证 ====================
  
  login: async (username, password) => {
    try {
      set({ loading: true, error: null })
      const res = await api.login(username, password)
      setToken(res.access_token)
      setUser(res.user)
      set({ 
        token: res.access_token, 
        user: res.user, 
        isAuthenticated: true,
        loading: false 
      })
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  register: async (username, password, email) => {
    try {
      set({ loading: true, error: null })
      const res = await api.register(username, password, email)
      setToken(res.access_token)
      setUser(res.user)
      set({ 
        token: res.access_token, 
        user: res.user, 
        isAuthenticated: true,
        loading: false 
      })
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  logout: () => {
    removeToken()
    removeUser()
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      tasks: [],
      reports: [],
      userDataFiles: [],
      currentDataDetail: null
    })
  },

  // ==================== Actions: 评测配置 ====================
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),

  resetFormData: () => set((state) => ({
    formData: {
      api_urls: [defaultApiUrl],
      model: '',
      data_file: '',
      scoring: 'rouge',
      scoring_module: './function_register/plugin.py',
      max_workers: 4,
      badcase_threshold: 1,
      report_dir: './reports',
      report_format: 'json, txt, badcases',
      test_mode: false,
      sample_size: 2147483648,
      checkpoint_path: '',
      checkpoint_interval: 32,
      resume: false,
      role: 'assistant',
      timeout: 10,
      max_tokens: 1024,
      api_key: 'sk-xxx',
      is_vllm: true,
      temperature: 0.0,
      top_p: 1.0,
    }
  })),

  fetchScoringFunctions: async () => {
    try {
      set({ loading: true })
      const res = await api.getScoringFunctions()
      console.log('[DEBUG] fetchScoringFunctions response:', res)
      console.log('[DEBUG] scoring_functions:', res.scoring_functions)
      set({ scoringFunctions: res.scoring_functions || [], loading: false, error: null })
    } catch (err) {
      console.error('[ERROR] fetchScoringFunctions failed:', err)
      set({ error: err.message, loading: false })
    }
  },

  fetchDataFiles: async () => {
    try {
      set({ loading: true })
      const res = await api.getDataFiles()
      set({ dataFiles: res.data_files, loading: false, error: null })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchAvailableModels: async () => {
    try {
      const res = await api.getAvailableModels()
      set({ availableModels: res.models })
    } catch (err) {
      set({ error: err.message })
    }
  },

  // ==================== Actions: 用户数据管理 ====================
  
  fetchUserDataFiles: async () => {
    try {
      set({ loading: true })
      const res = await api.getUserDataFiles()
      console.log('[DEBUG] fetchUserDataFiles response:', res)
      set({ userDataFiles: res.data_files || [], loading: false, error: null })
    } catch (err) {
      console.error('[ERROR] fetchUserDataFiles failed:', err.message)
      set({ error: err.message, loading: false })
    }
  },

  uploadUserDataFile: async (file, description) => {
    try {
      await api.uploadUserDataFile(file, description)
      // 重新加载数据文件列表
      await get().fetchUserDataFiles()
      // 同时更新评测配置中的数据文件列表
      await get().fetchDataFiles()
    } catch (err) {
      throw err
    }
  },

  updateUserDataFile: async (id, description) => {
    try {
      await api.updateUserDataFile(id, description)
      await get().fetchUserDataFiles()
    } catch (err) {
      throw err
    }
  },

  deleteUserDataFile: async (id) => {
    try {
      await api.deleteUserDataFile(id)
      await get().fetchUserDataFiles()
      await get().fetchDataFiles()
    } catch (err) {
      throw err
    }
  },

  fetchDataContent: async (dataId) => {
    try {
      set({ dataDetailLoading: true })
      const res = await api.getUserDataContent(dataId)
      set({ currentDataDetail: res, dataDetailLoading: false })
      return res
    } catch (err) {
      set({ error: err.message, dataDetailLoading: false })
      throw err
    }
  },

  clearDataDetail: () => set({ currentDataDetail: null }),


  // ==================== Actions: 任务管理 ====================
  
  fetchTasks: async (silent = false) => {
    try {
      if (!silent) {
        set({ loading: true })
      }
      const res = await api.getAllTasks()
      console.log('[TaskStore] Fetched tasks:', res.tasks.length, 'tasks', silent ? '(silent)' : '')
      res.tasks.forEach(task => {
        if (task.status === 'running') {
          console.log(`[TaskStore] Task ${task.task_id}: ${task.progress}% - ${task.message}`)
        }
      })
      set({ tasks: res.tasks, loading: false })
    } catch (err) {
      console.error('[TaskStore] Fetch tasks error:', err)
      set({ error: err.message, loading: false })
    }
  },

  fetchTaskStatus: async (taskId) => {
    try {
      const res = await api.getTaskStatus(taskId)
      set({ currentTask: res })
      return res
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  startEvaluation: async (config) => {
    try {
      set({ loading: true })
      const res = await api.startEvaluation(config)
      set({ loading: false })
      return res
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  cancelTask: async (taskId) => {
    try {
      // 乐观更新：先从本地状态移除
      const currentTasks = get().tasks
      set({ tasks: currentTasks.filter(t => t.task_id !== taskId) })

      // 然后调用API
      await api.cancelTask(taskId)

      // 最后刷新确保数据一致
      await get().fetchTasks(true)
    } catch (err) {
      // 如果失败，重新加载原始数据
      await get().fetchTasks(true)
      set({ error: err.message })
      throw err
    }
  },

  deleteTask: async (taskId) => {
    try {
      // 乐观更新：先从本地状态移除
      const currentTasks = get().tasks
      set({ tasks: currentTasks.filter(t => t.task_id !== taskId) })

      // 然后调用API
      await api.cancelTask(taskId)

      // 最后刷新确保数据一致
      await get().fetchTasks(true)
    } catch (err) {
      // 如果失败，重新加载原始数据
      await get().fetchTasks(true)
      set({ error: err.message })
      throw err
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      // 乐观更新：先更新本地状态
      const currentTasks = get().tasks
      set({
        tasks: currentTasks.map(t =>
          t.task_id === taskId ? { ...t, ...updates } : t
        )
      })

      // 然后调用API
      await api.updateTask(taskId, updates)

      // 最后刷新确保数据一致
      await get().fetchTasks(true)
    } catch (err) {
      // 如果失败，重新加载原始数据
      await get().fetchTasks(true)
      set({ error: err.message })
      throw err
    }
  },

  // ==================== Actions: 报告管理 ====================
  
  fetchReports: async () => {
    try {
      set({ loading: true })
      const res = await api.getReports()
      set({ reports: res.reports, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchReportDetail: async (dataset, model) => {
    try {
      set({ loading: true })
      const res = await api.getReportDetail(dataset, model)
      set({ currentReport: res, loading: false })
      return res
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  deleteReport: async (reportId) => {
    try {
      await api.deleteReport(reportId)
      // 删除后重新加载报告列表
      await get().fetchReports()
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },
}))

export default useStore
