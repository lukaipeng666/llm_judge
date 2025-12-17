# LLM-Judge 大模型评测框架

LLM-Judge 是一个用于大规模语言模型（LLM）评测的自动化框架。该框架支持多种评测任务和数据集，能够批量评估模型性能并生成详细的评估报告。

## 📋 目录结构

```
.
├── batch/                 # 批量处理模块
├── call_model/            # 模型调用接口
├── data_load/             # 数据加载模块
├── data_raw/              # 原始数据文件
├── function_register/     # 评分函数注册模块
├── messages/              # 消息处理模块
├── reports/               # 评估报告输出目录
├── result_gen/            # 报告生成模块
├── score/                 # 评分计算模块
├── main.py                # 主程序入口
├── run.sh                 # 运行脚本
├── requirements.txt       # 依赖
├── 流程图.png             # 项目细节流程
└── README.md              # 项目说明文档

```

## 🚀 快速开始

### 环境依赖

- Python 3.8+
- 必要的Python包（见requirements.txt）

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd llm-judge

# 安装依赖
pip install -r requirements.txt
```

### 基本使用

```bash
# 方式1: 使用Python直接运行
python main.py --help

# 方式2: 使用运行脚本
bash run.sh
```

## 📊 支持的数据集

框架支持多种中文NLP任务的数据集评估，包括但不限于：

- **问答任务** (QA): CMRC2018, DRCD等
- **文本分类**: TNEWS, IFLYTEK, AFQMC等
- **代词消解**: CLUEWSC2020
- **情感分析**: WAIMAI, OCEMOTION
- **阅读理解**: CMB, CSL等
- **指令遵循**: MTBench101, LIVEBENCH等
- **专业领域**: 医疗、金融、法律等垂直领域数据集

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

### 5. 多格式报告
- JSON格式详细报告
- TXT格式可读报告
- Badcase专项分析

## 🛠️ 命令行参数

```bash
python main.py \
    --api_urls http://localhost:8000/v1 \          # 模型API地址
    --model your-model-name \                      # 模型名称
    --data_file /path/to/data.jsonl \              # 测试数据文件
    --scoring rouge \                              # 评分函数
    --max_workers 32 \                             # 最大并发数
    --badcase_threshold 0.5 \                      # Badcase阈值
    --report_dir ./reports \                       # 报告输出目录
    --checkpoint_path ./checkpoint.json \           # 断点续测文件
    --resume \                                     # 启用断点续测
    [--test-mode]                                  # 测试模式
```

## 📈 评估流程

1. **数据加载**: 从JSONL文件加载测试数据
2. **模型调用**: 并行调用模型API获取输出
3. **评分计算**: 使用指定评分函数评估结果
4. **结果汇总**: 统计准确率、平均分等指标
5. **报告生成**: 生成JSON/TXT格式评估报告

## 🔧 自定义扩展

### 添加新的评分函数

在 `function_register/plugin.py` 中添加新的评分函数：

```python
@register_scoring_function('your_score_name')
def evaluate_your_task(messages: list, model_output: str, reference_output: str) -> Dict[str, Any]:
    # 实现评分逻辑
    return {
        'score': calculated_score,
        'is_badcase': 0 or 1,
        'details': {...}
    }
```

### 添加新的数据集

将数据整理为JSONL格式，每行一个JSON对象：

```json
{
  "meta": {
    "meta_descriptional": "任务说明"
  },
  "turns": [
    {"role": "Human", "text": "用户输入"},
    {"role": "assistant", "text": "参考答案"}
  ]
}
```

## 📤 输出报告

评估完成后将在指定的报告目录中生成：

- `evaluation_report_TIMESTAMP.json`: 详细评估结果
- `evaluation_report_TIMESTAMP.txt`: 可读性报告
- `badcases_TIMESTAMP.json`: Badcase详细信息

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者。