import time
import sys
from tqdm import tqdm
from typing import Dict, List, Tuple, Callable, Any
from llm_judge.data_load.load_and_save import save_checkpoint, load_checkpoint
from llm_judge.call_model.model_call import call_model_api
from llm_judge.messages.messages_process import prepare_prompt
from llm_judge.score.get_score import process_score_item
from inputimeout import inputimeout, TimeoutOccurred
from concurrent.futures import ProcessPoolExecutor, as_completed, ThreadPoolExecutor
import multiprocessing

# 进度回调辅助函数
def report_progress(phase: str, current: int, total: int, progress_callback: Callable = None):
    """报告进度，支持stdout和数据库API两种方式"""
    # 整个流程分为三个阶段：
    # 阶段1：获取模型输出 (0%-60%)
    # 阶段2：评分处理 (60%-80%)
    # 阶段3：保存报告 (80%-100%)
    if phase == "获取模型输出":
        # 获取模型输出阶段占总进度的60%
        progress_pct = (current / total * 60) if total > 0 else 0
    elif phase == "评分处理":
        # 评分处理阶段占总进度的10% (60%-80%)
        progress_pct = 60 + (current / total * 10) if total > 0 else 60
    elif phase == "保存报告":
        # 保存报告阶段占总进度的10% (80%-100%)
        progress_pct = 80 + (current / total * 10) if total > 0 else 80
    else:
        # 其他阶段保持原有计算方式
        progress_pct = (current / total * 100) if total > 0 else 0
    
    # 如果有回调函数，调用它
    if progress_callback:
        progress_callback(phase, current, total, progress_pct)


def evaluate_single_item(item: Dict, api_url: str, item_index: int = 0, test_mode: bool = False, model: str = None, timeout: int = 600, api_key: str = None, max_tokens: int = 16384, is_vllm: bool = False, temperature: float = 0.0, top_p: float = 1.0, auth_token: str = None) -> Dict[str, Any]:
    """
    获取单个数据项的模型输出（不进行评分）
    Args:
        item: 已展开的数据条目
        api_url: vllm API地址
        item_index: 全局数据项索引
        test_mode: 是否为测试模式
        model: 模型名称
        auth_token: JWT token for backend API authentication
    Returns:
        包含模型输出的字典，尚未评分
    """
    # 获取已准备好的消息和参考答案
    messages = item['messages'][:-1]  # 去掉最后一个assistant消息作为参考
    reference_output = item['reference_output']

    # 调用API获取模型输出
    start_time = time.time()
    model_output = call_model_api(api_url, api_key, messages, model, max_tokens=max_tokens, timeout=timeout, is_vllm=is_vllm, temperature=temperature, top_p=top_p, auth_token=auth_token)
    inference_time = time.time() - start_time
    
    # 构建结果字典（不进行评分）
    result = {
        'index': item_index,
        'original_index': item['original_index'],
        'expanded_index': item['expanded_index'],
        'user_input': messages,
        'model_output': model_output,
        'reference_output': reference_output,
        'inference_time': inference_time,
        'test_mode': test_mode
    }
    return result

def batch_evaluate(test_data: List[Dict], api_urls: list, scoring_func: Callable,
                  max_workers: int = 4, badcase_threshold: float = 0.5, test_mode: bool = False, model: str = None,
                  checkpoint_path: str = None, checkpoint_interval: int = 10,
                  resume: bool = False, role_test: str = "assistant",
                  timeout: int = 600, max_tokens: int = 16384, api_key: str = None,
                  is_vllm: bool = False, temperature: float = 0.0, top_p: float = 1.0,
                  progress_callback: Callable = None, auth_token: str = None) -> Tuple[List[Dict], List[Dict]]:
    """
    批量评估数据：先获取所有模型输出，再统一评分（并行处理评分）
    Args:
        test_data: 测试数据列表
        api_urls: vllm API地址
        scoring_func: 评分函数
        max_workers: 最大工作线程数
        badcase_threshold: Badcase判断阈值
        test_mode: 是否为测试模式
        model: 模型名称
        checkpoint_path: 断点续测文件路径，如果为None则不启用断点续测
        checkpoint_interval: 保存断点续测数据的间隔（每处理多少条数据保存一次）
        auth_token: JWT token for backend API authentication
    Returns:
        (所有结果列表, badcase结果列表)
    """
    results = []
    badcases = []
    
    # 第一步：先将所有数据转换为展开后的格式（处理多轮对话）
    print(f"开始处理数据，共 {len(test_data)} 条原始数据")
    expanded_data = []
    for idx, item in enumerate(test_data):
        # 使用prepare_prompt将多轮对话展开
        messages_package = prepare_prompt(item, role_test)
        # 为每条展开的数据添加原始索引
        for i, messages in enumerate(messages_package):
            expanded_item = {
                'original_index': idx,
                'expanded_index': i,
                'messages': messages,
                'reference_output': messages[-1]['content'] if messages else ''
            }
            expanded_data.append(expanded_item)
    
    total_count = len(expanded_data)
    print(f"数据展开完成，共 {total_count} 条测试数据{', 测试模式' if test_mode else ''}")
    # 现在加载断点续测数据
    processed_indices = set()
    if checkpoint_path and resume:
        existing_results = load_checkpoint(checkpoint_path)
        if existing_results:
            results = existing_results
            # 收集已处理的索引（使用全局索引）
            processed_indices = {r['index'] for r in results if 'index' in r}
            print(f"已处理 {len(processed_indices)} 条数据，将继续处理剩余数据")
    
    # 初始化进度条
    remaining_count = total_count - len(processed_indices)
    pbar = tqdm(total=remaining_count, desc="获取模型输出", unit="条")
    
    # 准备未处理的数据和对应的API URL
    unprocessed_data = []
    unprocessed_api_urls = []
    unprocessed_global_indices = []
    
    api_urls = api_urls * (len(expanded_data) // len(api_urls) + 1)
    api_urls = api_urls[:len(expanded_data)]

    for global_idx, (item, api_url) in enumerate(zip(expanded_data, api_urls)):        
        # 只添加未处理的数据
        if global_idx not in processed_indices:
            unprocessed_data.append(item)
            unprocessed_api_urls.append(api_url)
            unprocessed_global_indices.append(global_idx)
    
    # 处理测试模式的特殊情况
    if test_mode and len(unprocessed_data) > 16:
        unprocessed_data = unprocessed_data[:16]
        unprocessed_api_urls = unprocessed_api_urls[:16]
        unprocessed_global_indices = unprocessed_global_indices[:16]
        test_mode = False
    
    print(f"待处理数据: {len(unprocessed_data)} 条，模型: {model}，工作线程数: {multiprocessing.cpu_count()}")
    sys.stdout.flush()
    
    # 第一步：并行获取未处理数据的模型输出（不评分）
    result_last_len = 0
    if unprocessed_data:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # 提交所有任务（参数需可序列化，model 若为大模型实例需注意内存占用）
            future_to_index = {
                executor.submit(
                    evaluate_single_item,
                    unprocessed_data[i],
                    unprocessed_api_urls[i],
                    global_idx,
                    test_mode,
                    model,
                    timeout,
                    api_key,
                    max_tokens,
                    is_vllm,
                    temperature,
                    top_p,
                    auth_token,
                ): global_idx
                for i, global_idx in enumerate(unprocessed_global_indices)
            }
            
            # 收集结果
            for i, future in enumerate(as_completed(future_to_index)):
                global_idx = future_to_index[future]
                try:
                    result = future.result()
                    results.append(result)
                    pbar.update(1)
                    
                    # 报告进度（每10条更新一次，确保更频繁的进度反馈）
                    if i % 10 == 0 or i == len(future_to_index) - 1:
                        current_progress = len(results) - len(processed_indices)
                        report_progress("获取模型输出", current_progress, remaining_count, progress_callback)
                    
                    # 定期保存断点续测数据
                    if checkpoint_path and len(results) % checkpoint_interval == 0 and resume:
                        results_add = results[result_last_len:]
                        save_checkpoint(results_add, checkpoint_path)
                        result_last_len = len(results)
                        
                except Exception as e:
                    print(f"\n获取第 {global_idx} 条数据输出时出错: {e}")
                    error_result = {
                        'index': global_idx,
                        'error': str(e),
                        'test_mode': test_mode
                    }
                    results.append(error_result)
                    pbar.update(1)
                    
                    # 报告进度（即使出错也要报告）
                    if i % 10 == 0 or i == len(future_to_index) - 1:
                        current_progress = len(results) - len(processed_indices)
                        report_progress("获取模型输出", current_progress, remaining_count, progress_callback)
                    
                    # 出错时保存断点
                    if checkpoint_path and resume:
                        results_add = results[result_last_len:]
                        save_checkpoint(results_add, checkpoint_path)
                        result_last_len = len(results)

    # 关闭进度条
    pbar.close()
    if checkpoint_path and result_last_len != 0 and resume:
        results_add = results[result_last_len:]
        save_checkpoint(results_add, checkpoint_path)
        print("保存了最后一组内容")

    print("如果需要修改并发数，则输入对应的修改内容（按回车键忽略）：")
    while True:
        max_workers_rewrite = ""
        try:
            # 等待10秒输入，超时抛出TimeoutOccurred异常
            max_workers_rewrite = inputimeout(prompt="", timeout=3)
        except TimeoutOccurred:
            # 超时则默认空字符串（等效于按回车）
            print("\n超时未输入，默认不修改并发数")  # 可选：提示超时
        except Exception as e:
            print("当前非可写入环境")
        
        if max_workers_rewrite:
            try:
                max_workers = int(max_workers_rewrite)
                break
            except ValueError:  # 更精准的异常捕获（仅捕获数字转换错误）
                print("请输入有效的数字，重新输入：")
        else:
            max_workers = min(multiprocessing.cpu_count() // 2, max_workers)
            break

    print(f"最终并发数设置为：{max_workers}")
    
    # 按索引排序结果
    if results:
        results.sort(key=lambda x: x['index'])
        # 计算实际已处理的数据数量（不包括error的）
        processed_count = sum(1 for r in results if 'output' in r or 'score' in r)
        print(f"模型输出获取完成！已处理: {processed_count} 条数据")
    else:
        print(f"模型输出获取完成！已处理: 0条数据")

    # 第二步：并行对未评分的结果进行评分
    # 找出未评分的结果（没有'score'字段的结果）
    unscored_results = []
    scored_indices = []
    for i, result in enumerate(results):
        if 'score' not in result or 'error' in result:
            unscored_results.append(result)
            scored_indices.append(i)
    # 如果有未评分的结果，进行评分
    if unscored_results:
        print(f"开始统一评分（并行处理），共 {len(unscored_results)} 条未评分结果...")
        pbar = tqdm(total=len(unscored_results), desc="评分进度", unit="条")
        
        # 使用并行处理进行评分
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # 提交所有评分任务（参数必须可序列化）
                future_to_index = {
                    executor.submit(
                        process_score_item,
                        result,
                        scoring_func,
                        badcase_threshold
                    ): (i, result) 
                    for i, result in zip(scored_indices, unscored_results)
                }
                
                # 收集评分结果
                for j, future in enumerate(as_completed(future_to_index)):
                    try:
                        i, original_result = future_to_index[future]
                        scored_result, is_badcase = future.result()
                        
                        # 更新主进程的 results 列表
                        results[i] = scored_result
                        # 收集 badcase
                        if is_badcase:
                            badcases.append(scored_result)
                        # 更新进度条
                        if pbar:
                            pbar.update(1)
                        
                        # 报告评分进度（每10条更新一次）
                        if j % 50 == 0 or j == len(future_to_index) - 1:
                            scored_count = sum(1 for fut in future_to_index if fut.done())
                            report_progress("评分处理", scored_count, len(unscored_results), progress_callback)
                            
                    except Exception as e:
                        print(f"\n处理评分任务时出错: {e}")
                        if pbar:
                            pbar.update(1)  # 出错也更新进度条
                        
                        # 报告评分进度（即使出错）
                        scored_count = sum(1 for fut in future_to_index if fut.done())
                        report_progress("评分处理", scored_count, len(unscored_results), progress_callback)
            
        if pbar:
            pbar.close()
    else:
        badcases = [r for r in results if r.get('is_badcase', 0) == 1]
        print(f"所有结果已评分，无需重新评分")
    
    print(f"评分完成！Badcase数量: {len(badcases)}")
    return results, badcases