# LLM Judge Web UI

大模型评测系统的 Web 用户界面，提供可视化的评测配置、任务管理和结果展示功能。

## 目录结构

```
web-ui/
├── backend/                    # 后端 API 服务
│   ├── app.py                 # FastAPI 主应用
│   └── requirements.txt       # Python 依赖
│
├── frontend/                   # 前端 React 应用
│   ├── src/
│   │   ├── layouts/           # 布局组件
│   │   │   └── MainLayout.jsx # 主布局（侧边栏+头部）
│   │   │
│   │   ├── pages/             # 页面组件
│   │   │   ├── DashboardPage.jsx    # 仪表盘
│   │   │   ├── EvaluationPage.jsx   # 评测配置
│   │   │   ├── TasksPage.jsx        # 任务管理
│   │   │   ├── ReportsPage.jsx      # 报告列表
│   │   │   ├── ReportDetailPage.jsx # 报告详情
│   │   │   └── ResultsPage.jsx      # 结果分析
│   │   │
│   │   ├── services/          # API 服务层
│   │   │   └── api.js         # Axios 封装
│   │   │
│   │   ├── stores/            # 状态管理
│   │   │   └── index.js       # Zustand stores
│   │   │
│   │   ├── App.jsx            # 路由配置
│   │   ├── main.jsx           # 应用入口
│   │   └── index.css          # 全局样式
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── start.sh                   # 一键启动脚本
├── start_backend.sh           # 单独启动后端
├── start_frontend.sh          # 单独启动前端
└── README.md                  # 说明文档
```

## 快速开始

### 前置要求

- Python 3.8+
- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 后端依赖
cd web-ui/backend
pip install -r requirements.txt

# 前端依赖
cd web-ui/frontend
npm install
```

### 启动服务

**方式一：一键启动**

```bash
cd web-ui
chmod +x start.sh
./start.sh
```

**方式二：分别启动**

```bash
# 终端 1 - 启动后端
cd web-ui/backend
python app.py

# 终端 2 - 启动前端
cd web-ui/frontend
npm run dev
```

### 访问地址

- 前端界面: http://localhost:3000
- 后端 API: http://localhost:8080

## 功能说明

### 1. 仪表盘
- 显示评测概览统计
- 最近评测报告列表
- 任务状态监控
- 快速操作入口

### 2. 评测配置
- **基础配置**: API 地址、模型名称、数据文件、评分函数
- **高级配置**: 线程数、阈值、超时等
- **断点续测**: 检查点配置
- **调试选项**: 测试模式

### 3. 任务管理
- 查看所有评测任务
- 实时进度跟踪
- 任务取消功能
- 详细日志查看

### 4. 历史报告
- 报告列表浏览
- 多维度筛选
- 详细报告查看
- Badcase 分析

### 5. 结果分析
- 模型排行榜
- 数据集统计
- 性能对比矩阵

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/scoring-functions` | GET | 获取评分函数列表 |
| `/api/data-files` | GET | 获取数据文件列表 |
| `/api/reports` | GET | 获取报告列表 |
| `/api/reports/{dataset}/{model}` | GET | 获取报告详情 |
| `/api/evaluate` | POST | 启动评测任务 |
| `/api/tasks` | GET | 获取任务列表 |
| `/api/tasks/{id}` | GET | 获取任务状态 |
| `/api/tasks/{id}` | DELETE | 取消任务 |
| `/api/models` | GET | 获取模型列表 |
| `/api/datasets` | GET | 获取数据集列表 |

## 技术栈

### 后端
- FastAPI - Web 框架
- Uvicorn - ASGI 服务器
- Pydantic - 数据验证

### 前端
- React 18 - UI 框架
- Vite - 构建工具
- Ant Design 5 - UI 组件库
- React Router 6 - 路由
- Zustand - 状态管理
- Axios - HTTP 客户端
