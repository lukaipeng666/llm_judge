import os
import json
import time
import argparse
from typing import Dict, List, Any

def generate_report(summary: Dict[str, Any], results: List[Dict], badcases: List[Dict], 
                   report_dir: str, report_formats: List[str], args: argparse.Namespace):
    """
    生成评估报告
    Args:
        summary: 汇总统计信息
        results: 所有评估结果
        badcases: Badcase列表
        report_dir: 报告输出目录
        report_formats: 报告格式列表
        args: 命令行参数
    """
    # 确保报告目录存在
    os.makedirs(report_dir, exist_ok=True)
    
    # 生成报告文件名（基于时间戳）
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    base_filename = f"evaluation_report_{timestamp}"
    
    # 准备报告数据
    summary["badcase_count"] = len(badcases)
    report_data = {
        'timestamp': timestamp,
        'config': vars(args),
        'summary': summary,
        'badcases': badcases,
    }
    
    # 生成JSON格式报告
    if 'json' in report_formats:
        json_report_path = os.path.join(report_dir, f"{base_filename}.json")
        with open(json_report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        print(f"JSON报告已保存: {json_report_path}")
    
    # 生成文本格式报告
    if 'txt' in report_formats:
        txt_report_path = os.path.join(report_dir, f"{base_filename}.txt")
        with open(txt_report_path, 'w', encoding='utf-8') as f:
            # 写入报告头部
            f.write("="*80 + "\n")
            f.write("大模型评估报告\n")
            f.write("="*80 + "\n\n")
            
            # 写入配置信息
            f.write("配置信息:\n")
            f.write(f"  评估时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"  数据文件: {args.data_file}\n")
            f.write(f"  评分函数: {args.scoring}\n")
            f.write(f"  API地址: {args.api_url}\n")
            f.write(f"  Badcase阈值: {args.badcase_threshold}\n\n")
            
            # 写入汇总统计
            f.write("汇总统计:\n")
            f.write(f"  总数据量: {summary.get('total_count', 0)}\n")
            f.write(f"  正确数量: {summary.get('correct_count', 0)}\n")
            f.write(f"  准确率: {summary.get('accuracy', 0):.4f}\n")
            f.write(f"  平均分: {summary.get('average_score', 0):.4f}\n")
            f.write(f"  平均推理时间: {summary.get('average_inference_time', 0):.4f}秒\n")
            f.write(f"  Badcase数量: {len(badcases)}\n\n")
            
            # 写入ROUGE分数
            if summary.get('rouge_scores'):
                f.write("ROUGE分数:\n")
                for key, value in summary['rouge_scores'].items():
                    f.write(f"  {key}: {value:.4f}\n")
                f.write("\n")
            
            # 写入Badcase详情
            f.write("Badcase详情:\n")
            f.write("-"*80 + "\n")
            
            if badcases:
                for i, badcase in enumerate(badcases, 1):
                    f.write(f"Badcase #{i}:\n")
                    f.write(f"  索引: {badcase.get('index', 'N/A')}\n")
                    if 'user_input' in badcase and badcase['user_input']:
                        f.write(f"  用户输入: {badcase['user_input'][:100]}{'...' if len(badcase['user_input']) > 100 else ''}\n")
                    if 'model_output' in badcase:
                        f.write(f"  模型输出: {badcase['model_output']}\n")
                    if 'reference_output' in badcase:
                        f.write(f"  参考答案: {badcase['reference_output']}\n")
                    if 'score' in badcase:
                        f.write(f"  得分: {badcase['score']}\n")
                    if 'error' in badcase:
                        f.write(f"  错误信息: {badcase['error']}\n")
                    if 'details' in badcase:
                        f.write(f"  详情: {badcase['details']}\n")
                    f.write("-"*80 + "\n")
            else:
                f.write("  无Badcase\n")
        print(f"文本报告已保存: {txt_report_path}")
    
    # 生成单独的Badcase详情文件
    if badcases and 'badcase' in report_formats:
        badcase_path = os.path.join(report_dir, f"badcases_{timestamp}.json")
        badcase_data = [{
            'index': bc.get('index'),
            'user_input': bc.get('user_input'),
            'model_output': bc.get('model_output'),
            'reference_output': bc.get('reference_output'),
            'score': bc.get('score'),
            'details': bc.get('details')
        } for bc in badcases]
        with open(badcase_path, 'w', encoding='utf-8') as f:
            json.dump(badcase_data, f, ensure_ascii=False, indent=2)
        print(f"Badcase详情已保存: {badcase_path}")


def aggregate_results(results: List[Dict]) -> Dict[str, Any]:
    """
    汇总评估结果
    Args:
        results: 评估结果列表
    Returns:
        汇总统计信息
    """
    if not results:
        return {}
    
    # 计算平均分
    scores = [r['score'] for r in results if 'score' in r]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    
    # 计算准确率（对于分类任务）
    correct_count = sum(1 for r in results if 'is_badcase' in r and r['is_badcase'] == 0)
    accuracy = correct_count / len(results) if results else 0.0
    
    # 计算平均推理时间
    inference_times = [r['inference_time'] for r in results if 'inference_time' in r]
    avg_inference_time = sum(inference_times) / len(inference_times) if inference_times else 0.0
    
    # 汇总ROUGE分数（如果可用）
    rouge_scores = {'rouge1': [], 'rouge2': [], 'rougeL': []}
    for r in results:
        if 'details' in r:
            for key in rouge_scores:
                if key in r['details']:
                    rouge_scores[key].append(r['details'][key])
    
    avg_rouge_scores = {}
    for key, values in rouge_scores.items():
        if values:
            avg_rouge_scores[key] = sum(values) / len(values)
    
    # 构建汇总结果
    summary = {
        'total_count': len(results),
        'correct_count': correct_count,
        'accuracy': accuracy,
        'average_score': avg_score,
        'average_inference_time': avg_inference_time,
        'rouge_scores': avg_rouge_scores
    }
    
    return summary