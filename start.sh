#!/bin/bash

# LLM Judge - 启动所有服务(前端、后端、数据库)
echo "========================================="
echo "🚀 启动LLM Judge所有服务"
echo "========================================="

# 检查是否在正确的目录
if [ ! -f "config.yaml" ] || [ ! -d "backend/cmd/web-api" ]; then
    echo "❌ Error: 请在项目根目录下运行此脚本"
    echo "   使用方法: bash start.sh"
    exit 1
fi

# 从 config.yaml 读取端口配置
CONFIG_FILE="config.yaml"
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
echo "   - Go后端API服务: $WEB_PORT"
echo "   - 前端服务: $FE_PORT"
echo ""

# 端口检测和清理
echo "🔍 检测端口占用情况..."
PORTS=($DB_PORT $WEB_PORT $FE_PORT)
PORT_NAMES=("数据库服务" "Go后端API服务" "前端开发服务器")
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
LOG_DIR="./logs"
mkdir -p "$LOG_DIR"

# 获取Redis配置
REDIS_PORT=$(python3 -c "
import yaml
import sys
try:
    with open('$CONFIG_FILE', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
        redis_port = config.get('redis_service', {}).get('port', 6379)
        print(redis_port)
except Exception as e:
    print('6379')
") || echo "6379"

# 检查Redis端口
echo "🔍 检测Redis端口占用..."
REDIS_PID=$(lsof -ti:$REDIS_PORT 2>/dev/null)
if [ -n "$REDIS_PID" ]; then
    echo "⚠️  检测到端口 $REDIS_PORT (Redis) 被进程 $REDIS_PID 占用，正在终止..."
    kill -9 $REDIS_PID 2>/dev/null
    sleep 1
fi

# 启动Redis服务
echo "🔴 启动Redis服务..."

# 查找 redis-server 可执行文件
REDIS_SERVER=""
REDIS_CLI=""

# 1. 首先检查 PATH 中是否有 redis-server
if command -v redis-server &> /dev/null; then
    REDIS_SERVER=$(command -v redis-server)
    REDIS_CLI=$(command -v redis-cli 2>/dev/null || echo "")
fi

# 2. 如果 PATH 中没有，尝试在常见位置查找
if [ -z "$REDIS_SERVER" ]; then
    # 常见 Redis 安装位置
    POSSIBLE_PATHS=(
        "/tmp/redis-stable/src/redis-server"
        "/usr/local/bin/redis-server"
        "/usr/bin/redis-server"
        "/opt/redis/bin/redis-server"
        "$HOME/redis-stable/src/redis-server"
        "$HOME/.local/bin/redis-server"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$path" ] && [ -x "$path" ]; then
            REDIS_SERVER="$path"
            # 尝试找到对应的 redis-cli
            CLI_PATH="${path%/*}/redis-cli"
            if [ -f "$CLI_PATH" ] && [ -x "$CLI_PATH" ]; then
                REDIS_CLI="$CLI_PATH"
            fi
            echo "📌 在 $path 找到 redis-server"
            break
        fi
    done
fi

# 3. 如果找到了 redis-server，启动服务
if [ -n "$REDIS_SERVER" ]; then
    # 如果找到了 redis-cli，使用它；否则尝试在相同目录查找
    if [ -z "$REDIS_CLI" ]; then
        REDIS_DIR=$(dirname "$REDIS_SERVER")
        if [ -f "$REDIS_DIR/redis-cli" ] && [ -x "$REDIS_DIR/redis-cli" ]; then
            REDIS_CLI="$REDIS_DIR/redis-cli"
        fi
    fi
    
    # Redis服务器日志输出到redis.log
    # 禁用持久化：--save "" 禁用RDB快照，--appendonly no 禁用AOF
    nohup "$REDIS_SERVER" --port $REDIS_PORT --save "" --appendonly no --daemonize no >> "$LOG_DIR/redis.log" 2>&1 &
    REDIS_SERVER_PID=$!
    
    # 等待Redis启动
    echo "⏳ 等待Redis服务启动..."
    max_attempts=10
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        # 使用找到的 redis-cli 或默认的 redis-cli
        if [ -n "$REDIS_CLI" ]; then
            if "$REDIS_CLI" -p $REDIS_PORT ping > /dev/null 2>&1; then
                echo "✅ Redis服务启动成功 (PID: $REDIS_SERVER_PID, Port: $REDIS_PORT)"
                break
            fi
        elif command -v redis-cli &> /dev/null; then
            if redis-cli -p $REDIS_PORT ping > /dev/null 2>&1; then
                echo "✅ Redis服务启动成功 (PID: $REDIS_SERVER_PID, Port: $REDIS_PORT)"
                break
            fi
        else
            # 如果没有 redis-cli，等待一段时间后假设启动成功
            sleep 2
            if ps -p $REDIS_SERVER_PID > /dev/null 2>&1; then
                echo "✅ Redis服务启动成功 (PID: $REDIS_SERVER_PID, Port: $REDIS_PORT)"
                break
            fi
        fi
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            echo "⚠️  Redis服务启动超时，流量控制功能可能不可用"
            echo "   请确保已安装redis-server: brew install redis (macOS) 或 apt install redis-server (Linux)"
        fi
        sleep 1
    done
    
    # 保存Redis PID
    echo "$REDIS_SERVER_PID" > "$LOG_DIR/redis.pid"
else
    echo "⚠️  未找到redis-server，流量控制功能将不可用"
    echo "   请安装Redis: brew install redis (macOS) 或 apt install redis-server (Linux)"
    echo "   或参考 README.md 中的 Redis 安装说明"
fi

# 启动数据库服务
echo "📊 启动数据库服务..."

# 检查数据库服务二进制文件是否存在
if [ ! -f "./backend/bin/database-service" ]; then
    echo "⚠️  数据库服务二进制文件不存在，正在编译..."
    export PATH=$PATH:/usr/local/go/bin
    mkdir -p backend/bin
    cd backend && go build -o bin/database-service cmd/database-service/main.go && cd ..
    if [ $? -ne 0 ]; then
        echo "❌ Go编译失败，请检查Go环境"
        exit 1
    fi
    echo "✅ 数据库服务编译成功"
fi

nohup ./backend/bin/database-service --port $DB_PORT > "$LOG_DIR/database.log" 2>&1 &
DB_PID=$!

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

# 启动Go后端API服务
echo "🌐 启动Go后端API服务..."

# 检查二进制文件是否存在
if [ ! -f "./backend/bin/web-api" ]; then
    echo "⚠️  Go二进制文件不存在，正在编译..."
    export PATH=$PATH:/usr/local/go/bin
    mkdir -p backend/bin
    cd backend && go build -o bin/web-api cmd/web-api/main.go && cd ..
    if [ $? -ne 0 ]; then
        echo "❌ Go编译失败，请检查Go环境"
        exit 1
    fi
    echo "✅ Go编译成功"
fi

nohup ./backend/bin/web-api > "$LOG_DIR/web-api.log" 2>&1 &
API_PID=$!

# 等待Go后端服务启动（增强的健康检查）
echo "⏳ 等待Go后端API服务启动..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:$WEB_PORT/ > /dev/null 2>&1; then
        echo "✅ Go后端API服务启动成功 (PID: $API_PID)"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Go后端API服务启动失败 (超过30秒等待)"
        echo "📋 错误日志:"
        tail -20 "$LOG_DIR/web-api.log"
        kill $DB_PID $API_PID 2>/dev/null
        exit 1
    fi
    sleep 1
done

# 启动前端开发服务器
echo "🎨 启动前端开发服务器..."
cd frontend

# 检查前端依赖是否安装
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "⚠️  前端依赖未安装，正在安装..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败"
        cd ..
        exit 1
    fi
    echo "✅ 前端依赖安装成功"
fi

nohup npm run dev -- --host 0.0.0.0 --port $FE_PORT > "../logs/frontend.log" 2>&1 &
FE_PID=$!
cd ..

# 等待前端服务启动
echo "⏳ 等待前端服务启动..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:$FE_PORT > /dev/null 2>&1; then
        echo "✅ 前端服务启动成功 (PID: $FE_PID)"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "⚠️  前端服务启动超时，但可能正在启动中"
        echo "📋 日志:"
        tail -20 "$LOG_DIR/frontend.log"
    fi
    sleep 1
done

# 保存PID到文件
echo "$DB_PID" > "$LOG_DIR/database.pid"
echo "$API_PID" > "$LOG_DIR/web-api.pid"
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
echo "🔴 Redis服务: localhost:$REDIS_PORT"
echo "   - 日志输出到: $LOG_DIR/backend.log"
echo ""
echo "📊 数据库服务: http://localhost:$DB_PORT"
echo "   - API文档: http://localhost:$DB_PORT/docs"
echo "   - 健康检查: http://localhost:$DB_PORT/health"
echo ""
echo "🌐 Go后端API服务: http://localhost:$WEB_PORT"
echo "   - API文档: http://localhost:$WEB_PORT/docs"
echo ""
echo "🎨 前端界面:"
echo "   - 本机访问: http://localhost:$FE_PORT"
echo "   - 局域网访问: http://$LOCAL_IP:$FE_PORT"
echo ""
echo "📝 服务PID:"
if [ -f "$LOG_DIR/redis.pid" ]; then
    echo "   - Redis: $(cat $LOG_DIR/redis.pid)"
fi
echo "   - 数据库: $DB_PID"
echo "   - Go后端API: $API_PID"
echo "   - 前端: $FE_PID"
echo ""
echo "🛑 停止服务请运行: bash stop.sh"
echo "📋 查看日志: tail -f logs/*.log"
echo "========================================="
