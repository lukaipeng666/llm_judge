# 🎯 LLM-Judge 大模型评测框架

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/Framework-FastAPI-009688.svg)](https://fastapi.tiangolo.com)

*一个功能强大、易于使用的大语言模型自动化评测框架*

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [使用指南](#-使用指南) • [API文档](#-api接口) • [常见问题](#-常见问题)

</div>

---

## 📖 项目简介

LLM-Judge 是一个专为大规模语言模型（LLM）设计的自动化评测框架。该框架提供了完整的评测解决方案，从数据管理、模型调用、评分计算到结果展示，支持多种评分机制和并行处理，能够高效地评估模型在各种NLP任务上的性能表现。

### 🎯 核心价值

- **🚀 高效批量评测**：支持多线程并发，快速完成大规模数据集评测
- **🔌 灵活模型接入**：兼容 OpenAI API 和 vLLM 本地部署模型
- **📊 多维度评分**：支持 ROUGE、精确匹配、LLM 裁判等多种评分机制
- **💾 断点续测**：支持检查点机制，任务中断后可从断点继续
- **🎨 可视化界面**：提供现代化的 Web UI，轻松管理评测任务和查看结果
- **🔧 插件化扩展**：支持自定义评分函数，灵活适配各种评测需求

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     Web UI (React)                      │
│                    Port: 16386                          │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Backend API (FastAPI)                      │
│                  Port: 16385                            │
├─────────────────────────────────────────────────────────┤
│  • 任务管理    • 数据管理    • 用户认证                 │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│           Database Service (SQLite)                     │
│                  Port: 16384                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Evaluation Engine (Core)                   │
├─────────────────────────────────────────────────────────┤
│  • 数据加载    • 模型调用    • 批量处理                 │
│  • 评分计算    • 结果生成    • 报告输出                 │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ 功能特性

### 1️⃣ 多模型支持

- ✅ **vLLM 本地部署**：支持本地部署的 vLLM 推理服务
- ✅ **OpenAI 兼容 API**：兼容任何符合 OpenAI API 规范的模型服务
- ✅ **多 API 负载均衡**：支持配置多个 API 地址实现负载分发

### 2️⃣ 丰富的评分机制

| 评分方式 | 适用场景 | 说明 |
|---------|---------|------|
| **ROUGE** | 文本摘要、生成任务 | 基于 n-gram 重叠的评估指标 |
| **精确匹配** | 分类、标签任务 | 完全匹配或部分匹配评分 |
| **LLM 裁判** | 开放式生成任务 | 使用更强的模型作为裁判评估 |
| **自定义评分** | 特殊任务 | 通过插件系统注册自定义评分函数 |

### 3️⃣ 并行处理与性能优化

- 🚀 **多线程并发**：可配置工作线程数，充分利用计算资源
- 💾 **断点续测**：定期保存检查点，支持从中断处继续评估
- 📦 **批量处理**：自动批量处理大规模数据集
- ⏱️ **超时控制**：可配置 API 调用超时时间，防止任务挂起

### 4️⃣ 完善的 Web 管理界面

- 📊 **仪表板**：实时查看评测任务状态和统计信息
- 📁 **数据管理**：上传、管理评测数据集（支持 JSONL/CSV 格式）
- 🎯 **任务管理**：创建、监控、管理评测任务
- 📈 **结果展示**：可视化展示评测结果和 Badcase 分析
- 📄 **报告导出**：支持导出 JSON、TXT 和 Badcase 报告

### 5️⃣ 灵活的配置选项

- 🎛️ **温度控制**：可调节生成温度（temperature）
- 🎲 **采样参数**：支持 top-p 采样控制
- 📏 **Token 限制**：可配置最大生成 token 数
- 🎭 **角色选择**：支持选择不同的测试角色
- 🎯 **Badcase 阈值**：可自定义 Badcase 判定阈值

---

## 📋 环境依赖

### 系统要求

- **Python**: 3.8 或更高版本
- **Node.js**: 16+ (用于 Web 界面)
- **操作系统**: Linux / macOS / Windows

### Python 依赖包

```txt
openai>=1.0.0
rouge_score>=0.1.2
inputimeout>=1.0.0
requests>=2.25.0
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic<2.0.0
python-multipart>=0.0.6
PyJWT>=2.8.0
httpx>=0.25.0
pyyaml>=6.0
```

---

## 🚀 快速开始

### 安装步骤

```bash
# 1. 克隆项目
git clone ssh://git@code.in.wezhuiyi.com:60022/nlp-algorithm/bowenability/boweneval.git
cd boweneval

# 2. 切换到稳定版本
git checkout v.0.1.0

# 3. 安装 Python 依赖
pip install -r requirements.txt

# 4. 安装前端依赖
cd web-ui/frontend
npm install
cd ../..
```

### 启动服务

#### 方式一：一键启动所有服务（推荐）

```bash
bash start.sh
```

启动后会自动运行：
- 📊 数据库服务 (端口 16384)
- 🌐 后端 API (端口 16385)
- 🎨 前端界面 (端口 16386)

#### 方式二：单独启动服务

```bash
# 仅启动数据库服务
bash web-ui/start_database_only.sh

# 仅启动后端服务
bash web-ui/start_backend_only.sh

# 仅启动前端服务
bash web-ui/start_frontend_only.sh
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 🎨 **前端界面** | http://localhost:16386 | Web UI 管理界面 |
| 🌐 **后端 API** | http://localhost:16385 | RESTful API 服务 |
| 📊 **数据库服务** | http://localhost:16384 | 数据库 API 服务 |
| 📖 **后端 API 文档** | http://localhost:16385/docs | Swagger 文档 |
| 📖 **数据库 API 文档** | http://localhost:16384/docs | Swagger 文档 |

### 停止服务

```bash
bash stop.sh
```

---

## 📚 使用指南

### 通过 Web UI 进行评测（推荐）

1. **登录系统**
   - 访问 http://localhost:16386
   - 使用默认账号登录或注册新账号

2. **上传数据集**
   - 进入「数据管理」页面
   - 上传 JSONL 或 CSV 格式的测试数据
   - 系统支持自动格式转换

3. **创建评测任务**
   - 进入「评测任务」页面
   - 填写任务配置：
     - 选择数据集
     - 配置模型 API
     - 选择评分函数
     - 设置并发参数

4. **查看结果**
   - 在「结果」页面查看评测进度
   - 查看详细报告和 Badcase 分析
   - 导出评测报告

---

### CSV 格式

系统支持 CSV 上传，会自动转换为 JSONL 格式：

```csv
meta_description,human,assistant
请回答以下问题,什么是人工智能？,人工智能是...
翻译下列句子,Hello World,你好，世界
```

---

## ⚙️ 配置说明

### 配置文件：`web-ui/config.yaml`

```yaml
# 数据库服务配置
database_service:
  host: "0.0.0.0"
  port: 16384
  database_url: "llm_judge.db"

# Web API 服务配置
web_service:
  host: "0.0.0.0"
  port: 16385
  database_service_url: "http://localhost:16384"

# 前端服务配置
frontend_service:
  port: 16386
  host: "0.0.0.0"
```

### 自定义评分函数

创建自定义评分模块（例如 `my_scoring.py`）：

```python
from function_register.plugin import register_scoring_function

@register_scoring_function("my_custom_scorer")
def my_custom_scorer(prediction, reference, **kwargs):
    """
    自定义评分函数
    
    Args:
        prediction: 模型预测输出
        reference: 参考答案
        **kwargs: 其他参数
    
    Returns:
        float: 评分结果 (0-1)
    """
    # 实现你的评分逻辑
    score = compute_similarity(prediction, reference)
    return score
```

---

## 🎨 支持的数据集

框架支持多种中文 NLP 任务的数据集评估：

### 📖 阅读理解与问答
- **CMRC2018** - 中文机器阅读理解
- **DRCD** - 繁体中文阅读理解
- **C³** - 中文多选阅读理解
- **CHID** - 成语填空

### 📝 文本分类
- **TNEWS** - 今日头条新闻分类
- **IFLYTEK** - 长文本分类
- **AFQMC** - 蚂蚁金融问题匹配

### 💬 自然语言推理
- **OCNLI** - 中文自然语言推理
- **CMNLI** - 中文多类别自然语言推理

### 🎭 情感分析
- **WAIMAI** - 外卖评论情感分析
- **OCEMOTION** - 中文情感分类

### 🔤 命名实体识别
- **CLUENER** - 细粒度命名实体识别
- **CMeEE** - 中文医学实体识别

### 🧩 其他任务
- **CLUEWSC2020** - 代词消解
- **CSL** - 论文关键词识别
- **BUSTM** - 小布助手语义匹配
- **CHID** - 成语填空

### 🌟 指令遵循与对话
- **MTBench101** - 多轮对话评测
- **LIVEBENCH** - 实时能力评估

### 🏥 垂直领域
- **医疗领域**：CMB, CMedQA, CHIP 等
- **金融领域**：FinQA, FinRE 等
- **法律领域**：CAIL, LegalQA 等

---

## 🛠️ 开发指南

### 项目结构

```
boweneval/
├── main.py                    # 主程序入口
├── requirements.txt           # Python 依赖
├── start.sh                   # 启动脚本
├── stop.sh                    # 停止脚本
│
├── batch/                     # 批量处理模块
│   └── batch_process.py       # 并行评估逻辑
│
├── call_model/                # 模型调用模块
│   └── model_call.py          # API 调用封装
│
├── data_load/                 # 数据加载模块
│   └── load_and_save.py       # 数据读取和保存
│
├── messages/                  # 消息处理模块
│   └── messages_process.py    # 消息格式化
│
├── score/                     # 评分模块
│   └── get_score.py           # 评分函数获取
│
├── function_register/         # 插件注册模块
│   └── plugin.py              # 评分函数注册器
│
├── result_gen/                # 结果生成模块
│   └── report.py              # 报告生成和聚合
│
└── web-ui/                    # Web 界面
    ├── config.yaml            # 配置文件
    ├── backend/               # 后端服务
    │   ├── api/               # API 接口
    │   │   ├── app.py         # FastAPI 应用
    │   │   ├── auth.py        # 认证逻辑
    │   │   └── csv_to_jsonl.py
    │   └── database/          # 数据库服务
    │       ├── client/        # 数据库客户端
    │       └── service/       # 数据库服务
    │
    └── frontend/              # 前端界面
        ├── src/
        │   ├── pages/         # 页面组件
        │   ├── services/      # API 服务
        │   └── stores/        # 状态管理
        └── package.json
```

### 添加新的评分函数

1. 在 `function_register/plugin.py` 中添加新函数：

```python
@register_scoring_function("new_scorer")
def new_scoring_function(prediction, reference, **kwargs):
    # 实现评分逻辑
    return score
```

2. 或创建独立的评分模块并在运行时加载

### 扩展数据加载器

修改 `data_load/load_and_save.py` 以支持新的数据格式

### 自定义报告格式

修改 `result_gen/report.py` 中的报告生成逻辑

---

## ❓ 常见问题

### Q: 如何修改端口号？

**A:** 编辑 `web-ui/config.yaml` 文件，修改对应服务的端口配置。

### Q: 支持哪些模型 API？

**A:** 支持任何兼容 OpenAI API 规范的服务，包括：
- OpenAI 官方 API
- Azure OpenAI
- 本地部署的 vLLM
- FastChat
- Ollama（需配置兼容接口）

### Q: 如何查看日志？

**A:** 

```bash
# 查看所有日志
tail -f web-ui/logs/*.log

# 查看特定服务日志
tail -f web-ui/logs/backend.log
tail -f web-ui/logs/database.log
tail -f web-ui/logs/frontend.log
```

### Q: 数据库文件在哪里？

**A:** SQLite 数据库文件位于 `web-ui/backend/database/service/llm_judge.db`

### Q: 如何重置数据库？

**A:** 

```bash
# 停止所有服务
bash stop.sh

# 删除数据库文件
rm web-ui/backend/database/service/llm_judge.db

# 重新启动服务（会自动创建新数据库）
bash start.sh
```

### Q: 前端无法连接后端？

**A:** 检查以下几点：
1. 确认所有服务都已启动
2. 检查防火墙设置
3. 查看后端日志排查错误
4. 确认配置文件中的端口号正确

---

## 🔍 性能优化建议

### 1. 并发优化

```bash
# 根据 CPU 核心数和 API 限制调整工作线程
python main.py --max_workers 16  # 适用于高性能服务器
```

### 2. 批量大小优化

调整 `--checkpoint_interval` 平衡性能和可靠性：
- 较小值（如 10）：更频繁保存，更安全但稍慢
- 较大值（如 100）：更快但中断时丢失更多进度

### 3. 超时设置

```bash
# 为慢速模型增加超时时间
python main.py --timeout 1200  # 20 分钟
```

### 4. 采样优化

```bash
# 快速测试时使用小样本
python main.py --sample-size 100  # 只测试前 100 条
```

---

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **提交 Pull Request**

### 代码规范

- 遵循 PEP 8 Python 代码规范
- 添加必要的注释和文档字符串
- 编写单元测试
- 确保所有测试通过

### 问题反馈

- 使用 Issue 报告 Bug
- 使用 Issue 提出新功能建议
- 详细描述问题和复现步骤

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

特别感谢：
- OpenAI 提供的 API 规范
- vLLM 项目提供的高效推理引擎
- FastAPI 提供的优秀 Web 框架
- React 和 Vite 提供的前端开发工具

---

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- **Issue**: [项目 Issue 页面](ssh://git@code.in.wezhuiyi.com:60022/nlp-algorithm/bowenability/boweneval.git)
- **Email**: 项目维护者邮箱

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

Made with ❤️ by NLP Algorithm Team

</div>
