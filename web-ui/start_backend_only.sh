#!/bin/bash

# LLM Judge Web UI - 仅启动后端API服务
echo "========================================="
echo "🌐 启动后端API服务..."
echo "========================================="

# 检查是否在正确的目录
if [ ! -f "backend/api/app.py" ]; then
    echo "❌ Error: 请在web-ui目录下运行此脚本"
    echo "   使用方法: cd web-ui && bash start_backend_only.sh"
    exit 1
fi

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python3未找到"
    exit 1
fi

# 检查依赖
echo "📦 检查Python依赖..."
python3 -c "import fastapi, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  缺少依赖包"
    echo "📥 安装所需包..."
    pip3 install fastapi uvicorn
fi

# 启动服务
echo "🚀 启动后端API服务..."
echo "🌐 API地址: http://localhost:8080"
echo "📖 API文档: http://localhost:8080/docs"
echo "========================================="

# 在 backend 目录下运行，设置 PYTHONPATH 使其能访问根目录的模块
cd backend
PYTHONPATH="$PWD/../..:$PYTHONPATH" python3 -m uvicorn api.app:app --host 0.0.0.0 --port 8080 --reload
