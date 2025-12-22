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

# 从 config.yaml 读取端口配置
CONFIG_FILE="web-ui/config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: 配置文件 $CONFIG_FILE 不存在"
    exit 1
fi

# 使用 Python 解析 YAML 配置文件
DB_PORT=$(python3 -c "
import yaml
import sys
try:
    with open('$CONFIG_FILE', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
        db_port = config.get('database_service', {}).get('port')
        if db_port:
            print(db_port)
        else:
            print('16384', file=sys.stderr)
            sys.exit(1)
except Exception as e:
    print('Error: 无法读取数据库服务端口配置', file=sys.stderr)
    sys.exit(1)
") || exit 1

WEB_PORT=$(python3 -c "
import yaml
import sys
try:
    with open('$CONFIG_FILE', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
        web_port = config.get('web_service', {}).get('port')
        if web_port:
            print(web_port)
        else:
            print('16385', file=sys.stderr)
            sys.exit(1)
except Exception as e:
    print('Error: 无法读取后端API服务端口配置', file=sys.stderr)
    sys.exit(1)
") || exit 1

FE_PORT=$(python3 -c "
import yaml
import sys
try:
    with open('$CONFIG_FILE', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
        fe_port = config.get('frontend_service', {}).get('port')
        if fe_port:
            print(fe_port)
        else:
            print('16386', file=sys.stderr)
            sys.exit(1)
except Exception as e:
    print('Error: 无法读取前端服务端口配置', file=sys.stderr)
    sys.exit(1)
") || exit 1

# 验证端口是否成功读取
if [ -z "$DB_PORT" ] || [ -z "$WEB_PORT" ] || [ -z "$FE_PORT" ]; then
    echo "❌ Error: 无法从配置文件读取端口信息"
    exit 1
fi

echo "📋 从配置文件读取的端口:"
echo "   - 数据库服务: $DB_PORT"
echo "   - 后端API服务: $WEB_PORT"
echo "   - 前端服务: $FE_PORT"
echo ""

# 端口检测和清理
echo "🔍 检测端口占用情况..."
PORTS=($DB_PORT $WEB_PORT $FE_PORT)
PORT_NAMES=("数据库服务" "后端API服务" "前端开发服务器")
for i in "${!PORTS[@]}"; do
    PORT=${PORTS[$i]}
    NAME=${PORT_NAMES[$i]}
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "⚠️  检测到端口 $PORT ($NAME) 被进程 $PID 占用，正在终止..."
        kill -9 $PID 2>/dev/null
        sleep 1
        # 再次检查是否成功终止
        PID_CHECK=$(lsof -ti:$PORT 2>/dev/null)
        if [ -n "$PID_CHECK" ]; then
            echo "❌ 无法终止占用端口 $PORT 的进程，请手动检查"
        else
            echo "✅ 端口 $PORT 已释放"
        fi
    else
        echo "✅ 端口 $PORT ($NAME) 可用"
    fi
done
echo ""

# 创建日志目录
LOG_DIR="./web-ui/logs"
mkdir -p "$LOG_DIR"

# 启动数据库服务
echo "📊 启动数据库服务..."
cd web-ui/backend
nohup python3 -m uvicorn database.service.database_service:app --host 0.0.0.0 --port $DB_PORT > "../logs/database.log" 2>&1 &
DB_PID=$!
cd ../..

# 等待数据库服务启动（增强的健康检查）
echo "⏳ 等待数据库服务启动..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:$DB_PORT/health > /dev/null 2>&1; then
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
nohup python3 -m uvicorn api.app:app --host 0.0.0.0 --port $WEB_PORT > "../logs/backend.log" 2>&1 &
API_PID=$!
cd ../..

# 等待后端服务启动（增强的健康检查）
echo "⏳ 等待后端API服务启动..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:$WEB_PORT/ > /dev/null 2>&1; then
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
nohup npm run dev -- --host 0.0.0.0 --port $FE_PORT > "../logs/frontend.log" 2>&1 &
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
echo "📊 数据库服务: http://localhost:$DB_PORT"
echo "   - API文档: http://localhost:$DB_PORT/docs"
echo "   - 健康检查: http://localhost:$DB_PORT/health"
echo ""
echo "🌐 后端API服务: http://localhost:$WEB_PORT"
echo "   - API文档: http://localhost:$WEB_PORT/docs"
echo ""
echo "🎨 前端界面:"
echo "   - 本机访问: http://localhost:$FE_PORT"
echo "   - 局域网访问: http://$LOCAL_IP:$FE_PORT"
echo ""
echo "📝 服务PID:"
echo "   - 数据库: $DB_PID"
echo "   - 后端API: $API_PID"
echo "   - 前端: $FE_PID"
echo ""
echo "🛑 停止服务请运行: bash stop.sh"
echo "📋 查看日志: tail -f web-ui/logs/*.log"
echo "========================================="
