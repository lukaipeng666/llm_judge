import { create } from 'zustand'
import * as api from '../services/api'

/**
 * 评测配置 Store
 */
export const useEvaluationStore = create((set, get) => ({
  // 状态
  scoringFunctions: [],
  dataFiles: [],
  availableModels: [],
  loading: false,
  error: null,

  // 表单默认值
  formData: {
    api_urls: ['http://localhost:8000/v1'],
    model: '',
    data_file: '',
    scoring: 'rouge',
    scoring_module: './function_register/plugin.py',
    max_workers: 4,
    badcase_threshold: 0.5,
    report_dir: './reports',
    report_format: 'json, txt, badcases',
    test_mode: false,
    sample_size: 0,
    checkpoint_path: '',
    checkpoint_interval: 32,
    resume: false,
    role: 'assistant',
    timeout: 600,
    max_tokens: 16384,
    api_key: 'sk-xxx',
  },

  // Actions
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),

  resetFormData: () => set((state) => ({
    formData: {
      api_urls: ['http://localhost:8000/v1'],
      model: '',
      data_file: '',
      scoring: 'rouge',
      scoring_module: './function_register/plugin.py',
      max_workers: 4,
      badcase_threshold: 0.5,
      report_dir: './reports',
      report_format: 'json, txt, badcases',
      test_mode: false,
      sample_size: 0,
      checkpoint_path: '',
      checkpoint_interval: 32,
      resume: false,
      role: 'assistant',
      timeout: 600,
      max_tokens: 16384,
      api_key: 'sk-xxx',
    }
  })),

  fetchScoringFunctions: async () => {
    try {
      set({ loading: true })
      const res = await api.getScoringFunctions()
      set({ scoringFunctions: res.scoring_functions, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchDataFiles: async () => {
    try {
      set({ loading: true })
      const res = await api.getDataFiles()
      set({ dataFiles: res.data_files, loading: false })
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
}))

/**
 * 任务管理 Store
 */
export const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,

  fetchTasks: async () => {
    try {
      set({ loading: true })
      const res = await api.getAllTasks()
      set({ tasks: res.tasks, loading: false })
    } catch (err) {
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
      await api.cancelTask(taskId)
      get().fetchTasks()
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },
}))

/**
 * 报告 Store
 */
export const useReportStore = create((set, get) => ({
  reports: [],
  currentReport: null,
  loading: false,
  error: null,

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
}))
