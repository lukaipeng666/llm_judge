import os
import json
import time
import argparse
import httpx
from typing import Dict, List, Any, Optional

def generate_report(summary: Dict[str, Any], results: List[Dict], badcases: List[Dict], 
                   report_dir: str, report_formats: List[str], args: argparse.Namespace,
                   user_id: Optional[int] = None, task_id: Optional[str] = None,
                   database_service_url: Optional[str] = None):
    """
    生成评估报告
    Args:
        summary: 汇总统计信息
        results: 所有评估结果
        badcases: Badcase列表
        report_dir: 报告输出目录
        report_formats: 报告格式列表
        args: 命令行参数
        user_id: 用户ID（output_json模式下必须）
        task_id: 任务ID（output_json模式下必须）
        database_service_url: 数据库服务URL（output_json模式下必须）
    """
    try:
        # 准备报告数据
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        summary["badcase_count"] = len(badcases)
        
        # 过滤敏感路径信息，避免安全风险
        safe_config = {}
        sensitive_keys = {'report_dir', 'checkpoint_path', 'scoring_module', 'database_service_url'}
        for k, v in vars(args).items():
            if k not in sensitive_keys:
                safe_config[k] = v
        
        report_data = {
            'timestamp': timestamp,
            'config': safe_config,
            'summary': summary,
            'badcases': badcases,
        }
        
        # 通过HTTP API保存报告
        if user_id and task_id and database_service_url:
            client = httpx.Client(base_url=database_service_url, timeout=30.0)
            # 使用data_filename（已在main.py中设置），如果没有则使用data_file
            dataset_name = getattr(args, 'data_filename', None)
            if not dataset_name:
                data_file_path = getattr(args, 'data_file', 'unknown')
                dataset_name = os.path.basename(data_file_path) if data_file_path and data_file_path != 'unknown' else 'unknown'
            
            response = client.post("/api/user-reports", json={
                "user_id": user_id,
                "task_id": task_id,
                "dataset": dataset_name,
                "model": getattr(args, 'model', 'unknown'),
                "report_content": json.dumps(report_data, ensure_ascii=False),
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "summary": summary
            })
            response.raise_for_status()
            client.close()
            print(f"[INFO] 报告已保存到数据库，Report ID: {response.json().get('report_id')}")
        else:
            print("[WARNING] output_json模式但缺少user_id、task_id或database_service_url，无法保存到数据库")
    except Exception as e:
        print(f"[ERROR] 保存报告到数据库失败: {e}")
        import traceback
        traceback.print_exc()
    return


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