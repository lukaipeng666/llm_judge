# 🎯 LLM Judge Go

<div align="center">

**一个强大的大语言模型评估与评分平台**

[![Python Version](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/)
[![Go Version](https://img.shields.io/badge/go-1.21+-00ADD8?logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/react-18-61DAFB?logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [配置说明](#-配置说明) • [使用指南](#-使用指南) • [开发文档](#-开发文档)

</div>

---

## 📖 项目简介

LLM Judge Go 是一个专业的大语言模型评估平台，提供完整的模型评估、任务管理和结果可视化功能。无论是研究者还是工程师，都可以通过本平台轻松进行LLM模型的质量评估和性能分析。

### ✨ 核心亮点

- 🚀 **高性能评估** - 支持批量并行评估，大幅提升评估效率
- 🎨 **现代化界面** - 基于 React + Ant Design 的美观 Web UI
- 🔧 **灵活配置** - 支持多种评分算法和自定义评分插件
- 📊 **可视化报告** - 详细的评估报告和数据分析
- 🛡️ **企业级架构** - 微服务设计，支持高并发和水平扩展
- 💻 **双模式使用** - 支持 Web 界面和命令行两种使用方式

---

## 🎨 功能特性

### 🔍 模型评估
- ✅ 支持多种 LLM 模型（OpenAI API 格式、VLLM 等）
- ✅ 内置多种评分算法（ROUGE 等）
- ✅ 自定义评分插件系统
- ✅ 批量并行评估能力
- ✅ JSONL 格式数据支持

### 🖥️ Web 管理界面
- ✅ 直观的仪表板和任务管理
- ✅ 实时任务状态监控
- ✅ 数据管理和上传
- ✅ 详细的评估报告展示
- ✅ 用户认证和权限管理

### ⚙️ 后端服务
- ✅ RESTful API 设计
- ✅ JWT 用户认证
- ✅ SQLite 数据存储
- ✅ Redis 缓存支持
- ✅ 优雅的服务管理脚本

### 📈 数据分析
- ✅ 多维度评估指标统计
- ✅ 评估结果导出
- ✅ 历史记录查询
- ✅ 趋势分析图表

---

## 🏗️ 项目架构

```
llm-judge_go/
├── 📂 backend/              # Go 后端服务
│   ├── cmd/                # 服务入口
│   │   ├── database-service/    # 数据库服务
│   │   └── web-api/             # Web API 服务
│   ├── internal/           # 内部模块
│   │   ├── api/            # API 处理器
│   │   ├── core/           # 核心业务逻辑
│   │   ├── model/          # 数据模型
│   │   ├── repository/     # 数据访问层
│   │   └── service/        # 服务层
│   └── pkg/                # 公共包
│
├── 📂 frontend/            # React 前端应用
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── stores/        # 状态管理
│   │   └── layouts/       # 布局组件
│   └── dist/              # 构建产物
│
├── 📂 llm_judge/           # Python 核心评估模块
│   ├── data_load/         # 数据加载
│   ├── function_register/ # 评分函数注册
│   ├── call_model/        # 模型调用
│   ├── batch/             # 批处理
│   ├── score/             # 评分模块
│   ├── result_gen/        # 结果生成
│   └── messages/          # 消息处理
│
├── 📂 data/                # 数据存储目录
├── 📂 logs/                # 日志文件目录
├── 📄 config.yaml          # 配置文件
├── 📄 main.py              # Python CLI 入口
├── 📄 start.sh             # 服务启动脚本
├── 📄 stop.sh              # 服务停止脚本
└── 📄 requirements.txt     # Python 依赖
```

---

## 🚀 快速开始

### 📋 环境要求

- **Python**: 3.10+
- **Go**: 1.21+
- **Node.js**: 16+
- **Redis**: 6.0+

### 🔧 安装步骤

#### 1️⃣ 克隆项目

```bash
git clone <repository-url>
cd llm-judge_go
```

#### 2️⃣ 安装 Python 依赖

```bash
pip install -r requirements.txt
```

#### 3️⃣ 安装前端依赖

```bash
cd frontend
npm install
cd ..
```

#### 4️⃣ 配置服务

编辑 `config.yaml` 文件，配置必要的参数：

```yaml
# LLM 服务配置
llm_service:
  api_url: "http://localhost:8000/v1"
  api_key: "your-api-key"
  model: "/path/to/your/model"

# 管理员账户
admin:
  username: "admin"
  password_hash: "your-password-hash"  # SHA256 加密
```

#### 5️⃣ 启动服务

```bash
# 一键启动所有服务
bash start.sh
```

启动脚本会自动启动：
- 🗄️ Redis 服务 (端口: 16387)
- 🗃️ Go 数据库服务 (端口: 16384)
- 🌐 Go Web API 服务 (端口: 16385)
- 🎨 React 前端服务 (端口: 16386)

#### 6️⃣ 访问应用

打开浏览器访问：`http://localhost:16386`

默认管理员账户：
- 用户名：`admin`
- 密码：查看 `config.yaml` 中的配置

---

## ⚙️ 配置说明

### 📄 config.yaml 配置项

```yaml
# ==================== 服务端口配置 ====================
database_service:
  port: 16384              # 数据库服务端口

web_service:
  port: 16385              # Web API 服务端口

frontend_service:
  port: 16386              # 前端服务端口

redis_service:
  port: 16387              # Redis 缓存服务端口
  host: "localhost"

# ==================== LLM 服务配置 ====================
llm_service:
  api_url: "http://localhost:8000/v1"  # LLM API 地址
  api_key: "sk-xxx"                     # API 密钥
  model: "/path/to/model"               # 模型路径
  timeout: 60                           # 请求超时时间（秒）
  max_retries: 3                        # 最大重试次数

# ==================== 管理员配置 ====================
admin:
  username: "admin"                     # 管理员用户名
  password_hash: "xxx"                  # SHA256 加密的密码

# ==================== JWT 配置 ====================
jwt:
  secret_key: "llm-judge-secret-key"   # JWT 密钥
  expire_hours: 24                      # Token 过期时间（小时）

# ==================== 评估配置 ====================
evaluation:
  max_workers: 8                        # 最大并行工作线程数
  batch_size: 32                        # 批处理大小
  default_scoring: "rouge"              # 默认评分算法
```

---

## 📚 使用指南

### 🌐 Web 界面使用

#### 1. 登录系统
- 访问 `http://localhost:16386`
- 使用管理员账户登录

#### 2. 创建评估任务
- 导航到「评估页面」
- 上传 JSONL 格式的测试数据
- 选择评估模型和评分算法
- 提交任务

#### 3. 查看任务状态
- 在「任务页面」查看所有任务
- 实时监控任务进度
- 查看任务日志

#### 4. 查看评估报告
- 在「报告页面」查看评估结果
- 下载详细报告
- 分析评估数据

### 💻 命令行使用

#### 基础评估

```bash
python main.py \
  --data_file test.jsonl \
  --model Qwen-1.8B-Chat
```

#### 批量评估

```bash
python main.py \
  --data_file data.jsonl \
  --max_workers 8 \
  --batch_size 32
```

#### 自定义评分

```bash
python main.py \
  --data_file test.jsonl \
  --scoring custom \
  --scoring_module my_scoring.py
```

#### 指定 LLM API

```bash
python main.py \
  --data_file test.jsonl \
  --api_url http://localhost:8000/v1 \
  --api_key sk-xxx \
  --model /path/to/model
```

### 📝 数据格式

测试数据应为 JSONL 格式，每行一个 JSON 对象：

```json
{
  "id": "test_001",
  "prompt": "什么是人工智能？",
  "reference": "人工智能是计算机科学的一个分支...",
  "metadata": {
    "category": "科学",
    "difficulty": "简单"
  }
}
```

---

## 🔧 开发文档

### 🛠️ 技术栈

#### 后端
- **语言**: Go 1.21+
- **框架**: Gin Web Framework
- **数据库**: SQLite
- **缓存**: Redis
- **认证**: JWT

#### 前端
- **框架**: React 18
- **UI 库**: Ant Design 5.0
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **构建工具**: Vite

#### 核心模块
- **语言**: Python 3.10+
- **LLM 集成**: OpenAI API 格式
- **评分算法**: ROUGE、自定义算法

### 🔄 开发工作流

#### 启动开发环境

```bash
# 启动所有服务
bash start.sh

# 或分别启动
python main.py --dev              # Python 开发模式
cd backend && go run cmd/web-api/main.go  # Go 后端
cd frontend && npm run dev        # React 前端
```

#### 停止服务

```bash
bash stop.sh
```

### 📦 构建生产版本

#### 后端构建

```bash
cd backend
go build -o bin/web-api cmd/web-api/main.go
go build -o bin/database-service cmd/database-service/main.go
```

#### 前端构建

```bash
cd frontend
npm run build
```

### 🧪 测试

```bash
# 后端测试
cd backend
go test ./...

# 前端测试
cd frontend
npm test
```

---

## 📖 API 文档

### 认证接口

#### POST /api/auth/login
用户登录

**请求体：**
```json
{
  "username": "admin",
  "password": "password"
}
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": 1,
      "username": "admin"
    }
  }
}
```

### 任务管理接口

#### POST /api/task/create
创建评估任务

#### GET /api/task/list
获取任务列表

#### GET /api/task/:id
获取任务详情

### 数据管理接口

#### POST /api/data/upload
上传测试数据

#### GET /api/data/list
获取数据列表

更多 API 文档请参考：[API 详细文档](docs/api.md)

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 📋 代码规范

- **Go**: 遵循 [Effective Go](https://golang.org/doc/effective_go) 规范
- **Python**: 遵循 [PEP 8](https://pep8.org/) 规范
- **React**: 遵循 [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- 💼 **项目主页**: [GitHub Repository](https://github.com/your-username/llm-judge_go)
- 🐛 **问题反馈**: [Issues](https://github.com/your-username/llm-judge_go/issues)
- 📧 **邮箱**: your-email@example.com

---

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

特别感谢以下开源项目：
- [Gin](https://github.com/gin-gonic/gin)
- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)
- [Zustand](https://github.com/pmndrs/zustand)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by LLM Judge Team

</div>
