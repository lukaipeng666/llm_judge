#!/bin/bash

# LLM Judge - 启动所有服务(前端、后端、数据库)
echo "========================================="
echo "🚀 启动LLM Judge所有服务"
echo "========================================="

# 检查是否在正确的目录
if [ ! -f "web-ui/backend/database/service/database_service.py" ] || [ ! -f "web-ui/frontend/package.json" ]; then
    echo "❌ Error: 请在项目根目录下运行此脚本"
    echo "   使用方法: bash start.sh"
    exit 1
fi

# 创建日志目录
LOG_DIR="./web-ui/logs"
mkdir -p "$LOG_DIR"

# 检查并杀掉占用端口的进程
echo "🔍 检查端口占用情况..."
PORTS=(16384 16385 16386)
PORT_NAMES=("数据库服务" "后端API服务" "前端开发服务器")
KILLED_COUNT=0

for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    PORT_NAME=${PORT_NAMES[$i]}
    PID=$(lsof -ti :$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "⚠️  端口 $PORT ($PORT_NAME) 被进程 $PID 占用，正在终止..."
        kill -9 $PID 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ 已终止占用端口 $PORT 的进程 $PID"
            KILLED_COUNT=$((KILLED_COUNT + 1))
        else
            echo "❌ 无法终止进程 $PID，请手动检查"
        fi
        sleep 1
    else
        echo "✅ 端口 $PORT ($PORT_NAME) 可用"
    fi
done

if [ $KILLED_COUNT -gt 0 ]; then
    echo "⏳ 等待端口释放..."
    sleep 2
fi

echo ""

# 启动数据库服务
echo "📊 启动数据库服务..."
cd web-ui/backend
nohup python3 -m uvicorn database.service.database_service:app --host 0.0.0.0 --port 16384 > "../logs/database.log" 2>&1 &
DB_PID=$!
cd ../..

# 等待数据库服务启动（增强的健康检查）
echo "⏳ 等待数据库服务启动..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:16384/health > /dev/null 2>&1; then
        echo "✅ 数据库服务启动成功 (PID: $DB_PID)"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ 数据库服务启动失败 (超过30秒等待)"
        echo "📋 错误日志:"
        tail -20 "$LOG_DIR/database.log"
        kill $DB_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# 启动后端API服务
echo "🌐 启动后端API服务..."
cd web-ui/backend
export PYTHONPATH="$PWD/../..:$PYTHONPATH"
nohup python3 -m uvicorn api.app:app --host 0.0.0.0 --port 16385 > "../logs/backend.log" 2>&1 &
API_PID=$!
cd ../..

# 等待后端服务启动（增强的健康检查）
echo "⏳ 等待后端API服务启动..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:16385/ > /dev/null 2>&1; then
        echo "✅ 后端API服务启动成功 (PID: $API_PID)"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ 后端API服务启动失败 (超过30秒等待)"
        echo "📋 错误日志:"
        tail -20 "$LOG_DIR/backend.log"
        kill $DB_PID $API_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
cd web-ui/frontend
nohup npm run dev -- --host 0.0.0.0 --port 16386 > "../logs/frontend.log" 2>&1 &
FE_PID=$!
cd ../..

# 保存PID到文件
echo "$DB_PID" > "$LOG_DIR/database.pid"
echo "$API_PID" > "$LOG_DIR/backend.pid"
echo "$FE_PID" > "$LOG_DIR/frontend.pid"

# 获取本机局域网IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="<本机IP>"
fi

echo ""
echo "========================================="
echo "✅ 所有服务启动成功"
echo "========================================="
echo "📊 数据库服务: http://localhost:16384"
echo "   - API文档: http://localhost:16384/docs"
echo "   - 健康检查: http://localhost:16384/health"
echo ""
echo "🌐 后端API服务: http://localhost:16385"
echo "   - API文档: http://localhost:16385/docs"
echo ""
echo "🎨 前端界面:"
echo "   - 本机访问: http://localhost:16386"
echo "   - 局域网访问: http://$LOCAL_IP:16386"
echo ""
echo "📝 服务PID:"
echo "   - 数据库: $DB_PID"
echo "   - 后端API: $API_PID"
echo "   - 前端: $FE_PID"
echo ""
echo "🛑 停止服务请运行: bash stop.sh"
echo "📋 查看日志: tail -f web-ui/logs/*.log"
echo "========================================="
