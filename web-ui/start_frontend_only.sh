#!/bin/bash

# LLM Judge Web UI - 仅启动前端
echo "========================================="
echo "🎨 启动前端开发服务器..."
echo "========================================="

# 检查是否在正确的目录
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: 请在web-ui目录下运行此脚本"
    echo "   使用方法: cd web-ui && bash start_frontend_only.sh"
    exit 1
fi

# 进入前端目录
cd frontend

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js未找到，请先安装Node.js"
    exit 1
fi

# 检查npm环境
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm未找到，请先安装npm"
    exit 1
fi

# 检查依赖
echo "📦 检查前端依赖..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  未找到node_modules目录"
    echo "📥 安装前端依赖..."
    npm install
fi

# 启动开发服务器
echo "🚀 启动前端开发服务器..."
echo "🌐 访问地址: http://localhost:5173"
echo "========================================="
npm run dev -- --host 0.0.0.0 --port 5173