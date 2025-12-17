from typing import Dict, Tuple, Callable

def get_scoring_function(name: str, SCORING_FUNCTIONS: Dict[str, Callable]) -> Callable:
    """
    根据名称获取评分函数
    Args:
        name: 评分函数名称
    Returns:
        评分函数
    Raises:
        ValueError: 如果评分函数不存在
    """
    if name not in SCORING_FUNCTIONS:
        raise ValueError(f"评分函数 {name} 不存在，请先注册")
    return SCORING_FUNCTIONS[name]

def process_score_item(result: Dict, scoring_func: Callable, badcase_threshold: float) -> Tuple[Dict, bool]:
    """
    处理单个结果的评分
    Args:
        result: 包含模型输出的结果字典
        scoring_func: 评分函数
        badcase_threshold: Badcase判断阈值
    Returns:
        (更新后的结果字典, 是否为badcase)
    """
    is_badcase = False
    
    try:
        # 使用评分函数进行评分
        scores = scoring_func(result['user_input'], result['model_output'], result['reference_output'])
        # 添加评分结果
        if 'score' in scores:
            result['score'] = scores['score']
        result['is_badcase'] = scores['is_badcase']
        result['details'] = scores.get('details', {})
        
        # 检查是否为badcase
        if result['is_badcase'] or result['score'] < badcase_threshold:
            result['is_badcase'] = 1
            is_badcase = True
            
    except Exception as e:
        print(f"\n评分出错: {e}")
        print(result)
        result['error'] = str(e)
        result['is_badcase'] = 1
        is_badcase = True
    
    return result, is_badcase