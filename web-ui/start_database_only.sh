#!/bin/bash

# LLM Judge Web UI - 仅启动数据库服务
echo "========================================="
echo "📊 启动数据库服务..."
echo "========================================="

# 检查是否在正确的目录
if [ ! -f "backend/database/service/database_service.py" ]; then
    echo "❌ Error: 请在web-ui目录下运行此脚本"
    echo "   使用方法: cd web-ui && bash start_database_only.sh"
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

# 启动数据库服务
echo "🚀 启动数据库服务..."
echo "🌐 服务地址: http://localhost:8081"
echo "📖 API文档: http://localhost:8081/docs"
echo "========================================="

# 在 backend 目录下运行
cd backend
python3 -m uvicorn database.service.database_service:app --host 0.0.0.0 --port 8081 --reload
