import os
import json
import importlib.util
from typing import Dict, List, Tuple, Callable, Any


def load_jsonl(file_path: str) -> List[Dict]:
    """
    加载JSONL文件
    Args:
        file_path: JSONL文件路径
    Returns:
        数据列表
    """
    data = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    data.append(json.loads(line))
    except Exception as e:
        print(f"加载文件失败: {e}")
        exit(1)
    return data


def load_custom_scoring_module(module_path: str) -> None:
    """
    加载自定义评分模块
    Args:
        module_path: 评分模块文件路径
    """
    if not os.path.exists(module_path):
        print(f"自定义评分模块文件不存在: {module_path}")
        return
    
    try:
        spec = importlib.util.spec_from_file_location("custom_scoring", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        print(f"成功加载自定义评分模块: {module_path}")
    except Exception as e:
        print(f"加载自定义评分模块失败: {e}")
    

def save_checkpoint(results: List[Dict], checkpoint_path: str) -> None:
    """
    保存中间结果到临时文件(以jsonl格式追加写入)，用于断点续测
    Args:
        results: 当前的评估结果列表
        checkpoint_path: 保存路径
    """
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(checkpoint_path), exist_ok=True)
        
        # 以追加模式写入jsonl格式
        with open(checkpoint_path, 'a', encoding='utf-8') as f:
            for result in results:
                f.write(json.dumps(result, ensure_ascii=False) + '\n')
    except Exception as e:
        print(f"\n保存断点续测数据失败: {e}")


def load_checkpoint(checkpoint_path: str) -> List[Dict]:
    """
    从临时文件(以jsonl格式)加载已有结果，用于断点续测
    Args:
        checkpoint_path: 保存路径
    Returns:
        已有的评估结果列表，如果文件不存在则返回空列表
    """
    if not os.path.exists(checkpoint_path):
        print(f"\n断点续测文件不存在: {checkpoint_path}")
        return []
    
    try:
        # 使用已有的load_jsonl函数加载jsonl格式文件
        results = load_jsonl(checkpoint_path)
        print(f"\n成功加载断点续测数据，共 {len(results)} 条记录")
        return results
    except Exception as e:
        print(f"\n加载断点续测数据失败: {e}")
        return []