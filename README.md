# LLM-Judge 大模型评测框架

LLM-Judge 是一个用于大规模语言模型（LLM）评测的自动化框架。该框架支持多种评测任务和数据集，能够批量评估模型性能并通过Web界面展示详细的评估报告。

## 🚀 快速开始

### 环境依赖

- Python 3.8+
- Node.js 16+ (用于Web界面)
- 必要的Python包（见requirements.txt）

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd llm-judge

# 安装Python依赖
pip install -r requirements.txt

# 安装前端依赖
cd web-ui/frontend
npm install
cd ../..
```

### 启动Web界面（推荐方式）

```bash
# 启动所有服务
bash start.sh

# 停止所有服务
bash stop.sh
```

启动后访问 `http://localhost:5173` 查看Web界面。

### 访问地址

- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:8080
- **数据库服务**: http://localhost:8081
- **API文档**: http://localhost:8080/docs

## ⚙️ 核心功能

### 1. 多模型支持
- 支持本地部署的vLLM模型
- 兼容OpenAI API接口的模型服务

### 2. 多种评分机制
- **ROUGE评分**: 用于文本摘要和生成任务
- **精确匹配**: 用于分类和标签任务
- **LLM裁判**: 使用更强的模型作为裁判进行评估
- **自定义评分**: 支持插件化扩展评分函数

### 3. 并行处理
- 支持多线程并发评估，提高处理效率
- 可配置最大工作线程数

### 4. 断点续测
- 支持检查点机制，避免重复计算
- 可从中断处继续评估任务

### 6. Web界面管理
- 可视化任务管理
- 数据集管理
- 评估结果展示
- 报告查看

## 📊 支持的数据集

框架支持多种中文NLP任务的数据集评估，包括但不限于：

- **问答任务** (QA): CMRC2018, DRCD等
- **文本分类**: TNEWS, IFLYTEK, AFQMC等
- **代词消解**: CLUEWSC2020
- **情感分析**: WAIMAI, OCEMOTION
- **阅读理解**: CMB, CSL等
- **指令遵循**: MTBench101, LIVEBENCH等
- **专业领域**: 医疗、金融、法律等垂直领域数据集

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者。