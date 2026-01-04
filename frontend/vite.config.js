import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'

// 读取配置文件
const configPath = path.resolve(__dirname, '../config.yaml')
let frontendConfig = { host: '0.0.0.0', port: 5173 }
let backendConfig = { host: '127.0.0.1', port: 8080 }
let llmApiUrl = 'http://localhost:8000/v1' // 默认 LLM API URL

if (fs.existsSync(configPath)) {
  try {
    const fileContents = fs.readFileSync(configPath, 'utf8')
    const yamlConfig = yaml.load(fileContents)
    
    // 从 YAML 配置中提取不同名称的配置段落
    if (yamlConfig.frontend_service) {
      frontendConfig = yamlConfig.frontend_service
    } else if (yamlConfig.frontend) {
      frontendConfig = yamlConfig.frontend
    }
    
    if (yamlConfig.web_service) {
      backendConfig = yamlConfig.web_service
    } else if (yamlConfig.backend) {
      backendConfig = yamlConfig.backend
    }
    
    // 读取 LLM API URL
    if (yamlConfig.llm_service && yamlConfig.llm_service.api_url) {
      llmApiUrl = yamlConfig.llm_service.api_url
    }
    
    console.log('✓ 配置文件加载成功')
  } catch (e) {
    console.warn('⚠ 配置文件加载失败，使用默认配置:', e.message)
  }
} else {
  console.warn('⚠ 配置文件不存在，使用默认配置')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 从配置文件读取 LLM API URL 并作为全局常量提供给前端
    __LLM_API_URL__: JSON.stringify(llmApiUrl),
  },
  server: {
    port: frontendConfig.port,
    host: frontendConfig.host,
    proxy: {
      '/api': {
        // 0.0.0.0是监听地址，不能作为连接目标，必须用127.0.0.1
        target: `http://127.0.0.1:${backendConfig.port}`,
        changeOrigin: true,
      },
    },
    // 减少文件监听器的使用，避免 ENOSPC 错误
    watch: {
      usePolling: true,
      interval: 1000,
    }
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
