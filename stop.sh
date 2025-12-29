#!/bin/bash

# LLM Judge - 停止所有服务
echo "========================================="
echo "🛑 停止所有服务..."
echo "========================================="

# 检查是否在正确的目录
if [ ! -f "config.yaml" ] || [ ! -d "backend/cmd/web-api" ]; then
    echo "❌ Error: 请在项目根目录下运行此脚本"
    echo "   使用方法: bash stop.sh"
    exit 1
fi

# 创建日志目录变量
LOG_DIR="./logs"

# 读取PID文件并停止进程
STOP_COUNT=0

# 停止前端服务
if [ -f "$LOG_DIR/frontend.pid" ]; then
    FE_PID=$(cat "$LOG_DIR/frontend.pid")
    if ps -p $FE_PID > /dev/null 2>&1; then
        echo "🎨 停止前端服务 (PID: $FE_PID)..."
        kill $FE_PID
        STOP_COUNT=$((STOP_COUNT + 1))
    else
        echo "🎨 前端服务未运行 (PID文件存在但进程不存在)"
    fi
    rm -f "$LOG_DIR/frontend.pid"
else
    echo "🎨 前端服务PID文件不存在"
fi

# 停止Go后端API服务
if [ -f "$LOG_DIR/web-api.pid" ]; then
    API_PID=$(cat "$LOG_DIR/web-api.pid")
    if ps -p $API_PID > /dev/null 2>&1; then
        echo "🌐 停止Go后端API服务 (PID: $API_PID)..."
        kill $API_PID
        STOP_COUNT=$((STOP_COUNT + 1))
    else
        echo "🌐 Go后端API服务未运行 (PID文件存在但进程不存在)"
    fi
    rm -f "$LOG_DIR/web-api.pid"
else
    echo "🌐 Go后端API服务PID文件不存在"
fi

# 停止数据库服务
if [ -f "$LOG_DIR/database.pid" ]; then
    DB_PID=$(cat "$LOG_DIR/database.pid")
    if ps -p $DB_PID > /dev/null 2>&1; then
        echo "📊 停止数据库服务 (PID: $DB_PID)..."
        kill $DB_PID
        STOP_COUNT=$((STOP_COUNT + 1))
    else
        echo "📊 数据库服务未运行 (PID文件存在但进程不存在)"
    fi
    rm -f "$LOG_DIR/database.pid"
else
    echo "📊 数据库服务PID文件不存在"
fi

# 停止Redis服务
if [ -f "$LOG_DIR/redis.pid" ]; then
    REDIS_PID=$(cat "$LOG_DIR/redis.pid")
    if ps -p $REDIS_PID > /dev/null 2>&1; then
        echo "🔴 停止Redis服务 (PID: $REDIS_PID)..."
        kill $REDIS_PID
        STOP_COUNT=$((STOP_COUNT + 1))
    else
        echo "🔴 Redis服务未运行 (PID文件存在但进程不存在)"
    fi
    rm -f "$LOG_DIR/redis.pid"
else
    echo "🔴 Redis服务PID文件不存在"
fi

# 查找并杀死可能残留的相关进程
echo "🔍 查找可能残留的服务进程..."
FE_PROCESSES=$(ps aux | grep "npm run dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$FE_PROCESSES" ]; then
    echo "🎨 停止残留的前端进程: $FE_PROCESSES"
    kill $FE_PROCESSES 2>/dev/null
    STOP_COUNT=$((STOP_COUNT + 1))
fi

BACKEND_PROCESSES=$(ps aux | grep "bin/web-api" | grep -v grep | awk '{print $2}')
if [ ! -z "$BACKEND_PROCESSES" ]; then
    echo "🌐 停止残留的Go后端进程: $BACKEND_PROCESSES"
    kill $BACKEND_PROCESSES 2>/dev/null
    STOP_COUNT=$((STOP_COUNT + 1))
fi

DATABASE_PROCESSES=$(ps aux | grep "bin/database-service" | grep -v grep | awk '{print $2}')
if [ ! -z "$DATABASE_PROCESSES" ]; then
    echo "📊 停止残留的数据库进程: $DATABASE_PROCESSES"
    kill $DATABASE_PROCESSES 2>/dev/null
    STOP_COUNT=$((STOP_COUNT + 1))
fi

REDIS_PROCESSES=$(ps aux | grep "redis-server" | grep -v grep | awk '{print $2}')
if [ ! -z "$REDIS_PROCESSES" ]; then
    echo "🔴 停止残留的Redis进程: $REDIS_PROCESSES"
    kill $REDIS_PROCESSES 2>/dev/null
    STOP_COUNT=$((STOP_COUNT + 1))
fi

echo ""
if [ $STOP_COUNT -gt 0 ]; then
    echo "✅ 成功停止 $STOP_COUNT 个服务/进程"
else
    echo "ℹ️  没有找到正在运行的相关服务"
fi
echo "========================================="
