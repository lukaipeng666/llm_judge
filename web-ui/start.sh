#!/bin/bash

# LLM Judge Web UI 启动脚本

echo "======================================"
echo "  LLM Judge Web UI 启动脚本"
echo "======================================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$SCRIPT_DIR"

# 检查是否在虚拟环境中
if [ -z "$VIRTUAL_ENV" ]; then
    echo "提示: 建议在虚拟环境中运行"
fi

# 启动后端服务
echo ""
echo "启动后端 API 服务..."
cd backend

# 安装依赖
if [ ! -f ".deps_installed" ]; then
    echo "安装后端依赖..."
    pip install -r requirements.txt
    touch .deps_installed
fi

# 后台启动后端
python app.py &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 2

# 启动前端服务
echo ""
echo "启动前端开发服务器..."
cd "$SCRIPT_DIR/frontend"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 启动前端
npm run dev &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "======================================"
echo "  服务已启动"
echo "  后端地址: http://localhost:8080"
echo "  前端地址: http://localhost:3000"
echo "======================================"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待并处理退出
cleanup() {
    echo ""
    echo "正在停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "服务已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 保持脚本运行
wait
