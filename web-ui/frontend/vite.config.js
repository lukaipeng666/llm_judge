import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'

// 读取配置文件
const configPath = path.resolve(__dirname, '../config.yaml')
let frontendConfig = { host: '0.0.0.0', port: 5173 }
let backendConfig = { host: '127.0.0.1', port: 8080 }

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
  server: {
    port: frontendConfig.port,
    host: frontendConfig.host,
    proxy: {
      '/api': {
        target: `http://${backendConfig.host}:${backendConfig.port}`,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
