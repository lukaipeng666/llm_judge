#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM Benchmark 可视化展示
类似于大模型能力公布时的美观柱状图
"""

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from matplotlib import font_manager
import matplotlib.patches as mpatches

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'STHeiti', 'PingFang SC']
plt.rcParams['axes.unicode_minus'] = False

# 定义美观的配色方案
COLORS = {
    'Qwen3-1.7B': '#FF6B6B',
    'Bowen_General_v2.2_1.5B_20240923': '#4ECDC4',
    'Bowen_General_v3.0_1.7B_20250526': '#45B7D1',
    'Qwen3-14B': '#96CEB4',
    'Bowen_General_v3.0_14B_20250718': '#FFEAA7',
    'Bowen_General_v3.1_14B_20250905': '#DDA0DD',
    'Bowen_General_v2.2_14B_20240923': '#98D8C8',
}

# 简化的模型名称映射
MODEL_SHORT_NAMES = {
    'Qwen3-1.7B': 'Qwen3-1.7B',
    'Bowen_General_v2.2_1.5B_20240923': 'Bowen-1.5B-v2.2',
    'Bowen_General_v3.0_1.7B_20250526': 'Bowen-1.7B-v3.0',
    'Qwen3-14B': 'Qwen3-14B',
    'Bowen_General_v3.0_14B_20250718': 'Bowen-14B-v3.0',
    'Bowen_General_v3.1_14B_20250905': 'Bowen-14B-v3.1',
    'Bowen_General_v2.2_14B_20240923': 'Bowen-14B-v2.2',
}


def load_data():
    """加载并解析 CSV 数据"""
    # 1.7B 级别模型数据
    models_1_7b = {
        'Qwen3-1.7B': {
            '通用能力': 59.28, '对话交互': 50.64, '对话分析': 68.40, '知识&能力': 94.33, '总体': 60.11
        },
        'Bowen_General_v2.2_1.5B_20240923': {
            '通用能力': 55.92, '对话交互': 49.17, '对话分析': 66.56, '知识&能力': 94.24, '总体': 57.83
        },
        'Bowen_General_v3.0_1.7B_20250526': {
            '通用能力': 55.23, '对话交互': 49.01, '对话分析': 68.05, '知识&能力': 92.02, '总体': 57.38
        },
    }
    
    # 14B 级别模型数据
    models_14b = {
        'Qwen3-14B': {
            '通用能力': 77.38, '对话交互': 67.89, '对话分析': 71.93, '知识&能力': 98.98, '总体': 75.48
        },
        'Bowen_General_v3.0_14B_20250718': {
            '通用能力': 76.85, '对话交互': 66.58, '对话分析': 71.41, '知识&能力': 98.80, '总体': 74.71
        },
        'Bowen_General_v3.1_14B_20250905': {
            '通用能力': 75.92, '对话交互': 66.69, '对话分析': 70.74, '知识&能力': 97.78, '总体': 74.16
        },
        'Bowen_General_v2.2_14B_20240923': {
            '通用能力': 75.29, '对话交互': 64.06, '对话分析': 71.51, '知识&能力': 99.26, '总体': 73.14
        },
    }
    
    return models_1_7b, models_14b


def plot_comparison_bar(data, title, ax, show_legend=True):
    """绘制分组柱状图"""
    models = list(data.keys())
    categories = ['通用能力', '对话交互', '对话分析', '知识&能力', '总体']
    
    x = np.arange(len(categories))
    width = 0.18
    multiplier = 0
    
    for model in models:
        offset = width * multiplier
        values = [data[model][cat] for cat in categories]
        short_name = MODEL_SHORT_NAMES.get(model, model)
        bars = ax.bar(x + offset, values, width, label=short_name, 
                     color=COLORS.get(model, '#888888'),
                     edgecolor='white', linewidth=0.8)
        
        # 在柱子顶部添加数值标签
        for bar, val in zip(bars, values):
            height = bar.get_height()
            ax.annotate(f'{val:.1f}',
                       xy=(bar.get_x() + bar.get_width() / 2, height),
                       xytext=(0, 3),
                       textcoords="offset points",
                       ha='center', va='bottom',
                       fontsize=8, fontweight='bold',
                       color='#333333')
        
        multiplier += 1
    
    ax.set_ylabel('分数 (%)', fontsize=12, fontweight='bold')
    ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x + width * (len(models) - 1) / 2)
    ax.set_xticklabels(categories, fontsize=11, fontweight='bold')
    ax.set_ylim(0, 110)
    
    # 添加网格线
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax.set_axisbelow(True)
    
    # 设置背景色
    ax.set_facecolor('#FAFAFA')
    
    if show_legend:
        ax.legend(loc='upper left', fontsize=9, framealpha=0.95,
                 fancybox=True, shadow=True)
    
    # 添加边框美化
    for spine in ax.spines.values():
        spine.set_color('#DDDDDD')


def plot_radar_chart(data, title, ax):
    """绘制雷达图"""
    categories = ['通用能力', '对话交互', '对话分析', '知识&能力']
    num_vars = len(categories)
    
    # 计算角度
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    angles += angles[:1]  # 闭合
    
    ax.set_theta_offset(np.pi / 2)
    ax.set_theta_direction(-1)
    
    # 设置标签
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=10, fontweight='bold')
    
    for model, values_dict in data.items():
        values = [values_dict[cat] for cat in categories]
        values += values[:1]  # 闭合
        
        short_name = MODEL_SHORT_NAMES.get(model, model)
        color = COLORS.get(model, '#888888')
        
        ax.plot(angles, values, 'o-', linewidth=2, label=short_name, color=color)
        ax.fill(angles, values, alpha=0.15, color=color)
    
    ax.set_ylim(0, 100)
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1), fontsize=8)


def plot_overall_comparison():
    """绘制总体性能对比图"""
    models_1_7b, models_14b = load_data()
    
    fig = plt.figure(figsize=(20, 14))
    fig.suptitle('大模型能力评测对比 (OpenCompass Benchmark)', 
                 fontsize=22, fontweight='bold', y=0.98, color='#2C3E50')
    
    # 创建子图布局
    gs = fig.add_gridspec(2, 3, hspace=0.35, wspace=0.25,
                          left=0.05, right=0.95, top=0.90, bottom=0.08)
    
    # 1.7B 级别柱状图
    ax1 = fig.add_subplot(gs[0, :2])
    plot_comparison_bar(models_1_7b, '1.7B 级别模型能力对比', ax1)
    
    # 14B 级别柱状图
    ax2 = fig.add_subplot(gs[1, :2])
    plot_comparison_bar(models_14b, '14B 级别模型能力对比', ax2)
    
    # 1.7B 雷达图
    ax3 = fig.add_subplot(gs[0, 2], projection='polar')
    plot_radar_chart(models_1_7b, '1.7B 能力雷达图', ax3)
    
    # 14B 雷达图
    ax4 = fig.add_subplot(gs[1, 2], projection='polar')
    plot_radar_chart(models_14b, '14B 能力雷达图', ax4)
    
    # 添加水印/来源信息
    fig.text(0.99, 0.01, 'Source: OpenCompass Benchmark | Generated by LLM-Judge',
             fontsize=9, color='gray', ha='right', va='bottom', alpha=0.7)
    
    plt.savefig('/Users/lukaipeng2/Desktop/llm-judge/model_comparison.png', 
                dpi=150, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.show()
    print("✅ 图表已保存到: model_comparison.png")


def plot_detailed_metrics():
    """绘制详细指标对比图"""
    # 详细指标数据
    detailed_data = {
        'Qwen3-14B': {
            '输出安全性': 61.34, '多语言能力': 78.03, '逻辑推理': 67.92,
            '专业领域': 65.71, '指令遵循': 57.30, '语义匹配': 64.60,
            '知识遵循': 98.45, '情感分析': 52.70
        },
        'Bowen_General_v3.0_14B_20250718': {
            '输出安全性': 62.90, '多语言能力': 74.59, '逻辑推理': 74.23,
            '专业领域': 64.64, '指令遵循': 55.27, '语义匹配': 63.35,
            '知识遵循': 98.00, '情感分析': 51.71
        },
        'Bowen_General_v3.1_14B_20250905': {
            '输出安全性': 61.41, '多语言能力': 77.79, '逻辑推理': 71.55,
            '专业领域': 63.21, '指令遵循': 53.23, '语义匹配': 65.78,
            '知识遵循': 96.16, '情感分析': 50.17
        },
        'Bowen_General_v2.2_14B_20240923': {
            '输出安全性': 63.31, '多语言能力': 70.23, '逻辑推理': 74.04,
            '专业领域': 57.86, '指令遵循': 51.57, '语义匹配': 66.71,
            '知识遵循': 98.71, '情感分析': 51.67
        },
    }
    
    fig, ax = plt.subplots(figsize=(16, 8))
    fig.suptitle('14B 模型详细能力指标对比', fontsize=18, fontweight='bold', color='#2C3E50')
    
    categories = list(list(detailed_data.values())[0].keys())
    x = np.arange(len(categories))
    width = 0.2
    
    for i, (model, values_dict) in enumerate(detailed_data.items()):
        values = [values_dict[cat] for cat in categories]
        short_name = MODEL_SHORT_NAMES.get(model, model)
        bars = ax.bar(x + i * width, values, width, label=short_name,
                     color=COLORS.get(model, '#888888'),
                     edgecolor='white', linewidth=0.8)
        
        for bar, val in zip(bars, values):
            height = bar.get_height()
            ax.annotate(f'{val:.1f}',
                       xy=(bar.get_x() + bar.get_width() / 2, height),
                       xytext=(0, 2),
                       textcoords="offset points",
                       ha='center', va='bottom',
                       fontsize=7, fontweight='bold')
    
    ax.set_ylabel('分数 (%)', fontsize=12, fontweight='bold')
    ax.set_xticks(x + width * 1.5)
    ax.set_xticklabels(categories, fontsize=10, fontweight='bold', rotation=15)
    ax.set_ylim(0, 110)
    ax.yaxis.grid(True, linestyle='--', alpha=0.3)
    ax.set_axisbelow(True)
    ax.set_facecolor('#FAFAFA')
    ax.legend(loc='upper right', fontsize=9, framealpha=0.95)
    
    plt.tight_layout()
    plt.savefig('/Users/lukaipeng2/Desktop/llm-judge/detailed_metrics.png',
                dpi=150, bbox_inches='tight', facecolor='white')
    plt.show()
    print("✅ 图表已保存到: detailed_metrics.png")


def plot_horizontal_bar():
    """绘制水平柱状图 - 类似大模型发布时的风格"""
    models_1_7b, models_14b = load_data()
    
    # 合并所有模型数据
    all_models = {**models_1_7b, **models_14b}
    
    # 按总体分数排序
    sorted_models = sorted(all_models.items(), key=lambda x: x[1]['总体'], reverse=True)
    
    fig, ax = plt.subplots(figsize=(14, 10))
    fig.suptitle('大模型综合能力排行榜', fontsize=20, fontweight='bold', y=0.96, color='#2C3E50')
    
    model_names = [MODEL_SHORT_NAMES.get(m[0], m[0]) for m in sorted_models]
    scores = [m[1]['总体'] for m in sorted_models]
    colors = [COLORS.get(m[0], '#888888') for m in sorted_models]
    
    y_pos = np.arange(len(model_names))
    
    bars = ax.barh(y_pos, scores, color=colors, edgecolor='white', 
                   linewidth=1.5, height=0.6)
    
    # 添加分数标签
    for bar, score in zip(bars, scores):
        width = bar.get_width()
        ax.annotate(f'{score:.2f}',
                   xy=(width, bar.get_y() + bar.get_height()/2),
                   xytext=(5, 0),
                   textcoords="offset points",
                   ha='left', va='center',
                   fontsize=12, fontweight='bold',
                   color='#333333')
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(model_names, fontsize=12, fontweight='bold')
    ax.set_xlabel('综合评分 (%)', fontsize=12, fontweight='bold')
    ax.set_xlim(0, 85)
    ax.xaxis.grid(True, linestyle='--', alpha=0.3)
    ax.set_axisbelow(True)
    ax.set_facecolor('#FAFAFA')
    ax.invert_yaxis()  # 最高分在顶部
    
    # 添加分割线区分不同级别 (14B有4个模型，1.7B有3个模型)
    ax.axhline(y=3.5, color='#888888', linestyle='--', linewidth=2, alpha=0.6)
    ax.text(82, 1.5, '14B 级别', fontsize=10, color='#E74C3C', 
            fontweight='bold', ha='right', va='center')
    ax.text(82, 5, '1.7B 级别', fontsize=10, color='#3498DB',
            fontweight='bold', ha='right', va='center')
    
    # 添加背景色块
    ax.axhspan(-0.5, 3.5, facecolor='#E8F8F5', alpha=0.3)
    ax.axhspan(3.5, 6.5, facecolor='#EBF5FB', alpha=0.3)
    
    for spine in ax.spines.values():
        spine.set_color('#DDDDDD')
    
    plt.tight_layout()
    plt.savefig('/Users/lukaipeng2/Desktop/llm-judge/ranking_chart.png',
                dpi=150, bbox_inches='tight', facecolor='white')
    plt.show()
    print("✅ 图表已保存到: ranking_chart.png")


if __name__ == '__main__':
    print("=" * 60)
    print("🎨 LLM Benchmark 可视化展示")
    print("=" * 60)
    
    # 生成所有图表
    print("\n📊 生成综合对比图...")
    plot_overall_comparison()
    
    print("\n📈 生成详细指标图...")
    plot_detailed_metrics()
    
    print("\n🏆 生成排行榜...")
    plot_horizontal_bar()
    
    print("\n" + "=" * 60)
    print("✨ 所有图表生成完成!")
    print("=" * 60)
