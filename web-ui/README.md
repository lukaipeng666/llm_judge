# LLM-Judge Web UI

LLM-Judge Web UI 是一个用于大规模语言模型（LLM）评测的可视化管理系统。该系统提供了友好的Web界面，支持评测任务配置、数据管理、任务监控、报告查看等功能。

## 🚀 快速开始

### 环境依赖

- Node.js 16+
- Python 3.8+
- npm 或 yarn

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd llm-judge

# 安装前端依赖
cd web-ui/frontend
npm install

# 返回项目根目录
cd ../..

# 安装Python依赖
pip install -r requirements.txt
```

### 启动服务

项目提供了多种启动方式：

#### 1. 一键启动所有服务（推荐）

```bash
# 在项目根目录下执行
bash start.sh
```

这将同时启动：
- 数据库服务（端口 8081）
- 后端API服务（端口 8080）
- 前端开发服务器（端口 5173）

#### 2. 分别启动各组件

```bash
# 启动数据库服务
cd web-ui
bash start_database_only.sh

# 启动后端API服务
cd web-ui
bash start_backend_only.sh

# 启动前端开发服务器
cd web-ui
bash start_frontend_only.sh
```

### 访问界面

启动成功后，可以通过以下地址访问：

- 本机访问: http://localhost:5173
- 局域网访问: http://<本机IP>:5173

默认管理员账号：
- 用户名: admin
- 密码: suanfazu2025

## 🏗️ 项目架构

```
web-ui/
├── backend/              # 后端服务
│   ├── api/              # API接口层
│   │   ├── app.py        # API主应用
│   │   ├── auth.py       # 认证模块
│   │   └── csv_to_jsonl.py  # CSV转换工具
│   └── database/         # 数据库服务
│       ├── client/       # 数据库客户端
│       ├── service/      # 数据库服务端
│       └── database.py   # 数据库核心逻辑
├── frontend/             # 前端应用
│   ├── src/              # 源代码
│   │   ├── layouts/      # 页面布局
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API服务封装
│   │   ├── stores/       # 状态管理
│   │   ├── App.jsx       # 应用根组件
│   │   └── main.jsx      # 应用入口
│   ├── package.json      # 前端依赖配置
│   └── vite.config.js    # 构建配置
├── config.yaml           # 系统配置文件
├── start_backend_only.sh # 仅启动后端脚本
├── start_database_only.sh # 仅启动数据库脚本
└── start_frontend_only.sh # 仅启动前端脚本
```

## 🎨 功能特性

### 用户管理
- 用户注册/登录
- 管理员权限控制
- 多用户隔离

### 数据管理
- 支持JSONL和CSV格式数据上传
- 数据文件预览和管理
- 数据集描述和分类

### 评测配置
- 灵活的API配置（支持多个API地址）
- 多种模型选择
- 丰富的评测参数设置
- 支持多种评分函数

### 任务管理
- 实时任务状态监控
- 任务进度跟踪
- 任务取消和删除
- 断点续测支持

### 报告查看
- 评测报告列表展示
- 详细报告查看
- 数据可视化分析
- Badcase分析

### 管理员功能
- 全局用户管理
- 全局任务监控
- 数据文件管理

## ⚙️ 配置说明

系统配置文件位于 `web-ui/config.yaml`：

```yaml
# 数据库服务配置
database_service:
  host: "0.0.0.0"
  port: 8081
  database_url: "llm_judge.db"

# Web API服务配置
web_service:
  host: "0.0.0.0"
  port: 8080
  database_service_url: "http://localhost:8081"

# 前端服务配置
frontend_service:
  port: 5173
  host: "0.0.0.0"
```

## 🛠️ 开发指南

### 前端开发

```bash
# 进入前端目录
cd web-ui/frontend

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 后端开发

```bash
# 启动数据库服务（开发模式）
cd web-ui/backend
python3 -m uvicorn database.service.database_service:app --host 0.0.0.0 --port 8081 --reload

# 启动API服务（开发模式）
cd web-ui/backend
PYTHONPATH="$PWD/../..:$PYTHONPATH" python3 -m uvicorn api.app:app --host 0.0.0.0 --port 8080 --reload
```

### API文档

- 数据库服务文档: http://localhost:8081/docs
- 后端API文档: http://localhost:8080/docs

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者。