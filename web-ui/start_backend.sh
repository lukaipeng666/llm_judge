#!/bin/bash

# LLM Judge Web UI - 单独启动后端

echo "启动后端 API 服务..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"

# 安装依赖
pip install -r requirements.txt

# 启动服务
python app.py
