#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大模型测评脚本
"""

import argparse
import os
import yaml
from llm_judge.data_load.load_and_save import load_jsonl, load_custom_scoring_module
from llm_judge.function_register.plugin import SCORING_FUNCTIONS_plugin, initialize_langdetect_profiles
from llm_judge.result_gen.report import generate_report, aggregate_results
from llm_judge.score.get_score import get_scoring_function
from llm_judge.batch.batch_process import batch_evaluate

def get_config_defaults():
    """
    从配置文件中读取默认值
    """
    config_file = "config.yaml"
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        return config
    return {}

def parse_args():
    """
    解析命令行参数
    """
    parser = argparse.ArgumentParser(description='大模型测评脚本')
    # 从配置文件获取默认值，如果配置文件不存在则使用默认值
    config = get_config_defaults()
    llm_config = config.get('llm_service', {})
    default_api_urls = llm_config.get('api_url', "http://localhost:8000/generate/chat/completions")
    parser.add_argument('--api_urls', nargs='+', default=default_api_urls, help='兼容OpenAI的地址')
    default_model = llm_config.get('model', "Qwen/Qwen-1.8B-Chat")
    parser.add_argument('--model', default=default_model, help='vllm模型名称')
    parser.add_argument('--data_file', default=None, help='测试数据文件路径')
    parser.add_argument('--data_id', type=int, default=None, help='数据库中的数据ID')
    parser.add_argument('--scoring', default='rouge', help='评分函数名称')
    parser.add_argument('--scoring_module', type=str, default="./function_register/plugin.py", help='自定义评分模块文件路径')
    parser.add_argument('--output', default='evaluation_report.json', help='评分报告输出文件路径')
    parser.add_argument('--max_workers', type=int, default=4, help='最大工作线程数')
    parser.add_argument('--badcase_threshold', type=float, default=1, help='Badcase判断阈值')
    parser.add_argument('--report_dir', type=str, default='./reports', help='报告输出目录')
    parser.add_argument('--report_format', type=str, default='json, txt, badcases', help='报告格式，逗号分隔')
    parser.add_argument('--output_json', action='store_true', help='将JSON报告输出到stdout')
    parser.add_argument('--user_id', type=int, default=None, help='用户ID（output_json模式下必须）')
    parser.add_argument('--task_id', type=str, default=None, help='任务ID（output_json模式下必须）')
    parser.add_argument('--database_service_url', type=str, default=None, help='数据库服务URL（output_json模式下必须）')
    parser.add_argument('--test-mode', action='store_true', help='测试模式，不实际调用API')
    parser.add_argument('--sample-size', type=int, default=0, help='只测试指定数量的样本，0表示全部测试')
    parser.add_argument('--checkpoint_path', type=str, default=None, help='断点续测文件输出保存路径')
    parser.add_argument('--checkpoint_interval', type=int, default=32, help='保存检查点的间隔数量')
    parser.add_argument('--resume', action='store_true', help='从检查点继续运行')
    parser.add_argument('--role', type=str, default="assistant", help='选择指定的测试角色')
    parser.add_argument('--timeout', type=int, default=600, help='API调用超时时间（秒）')
    parser.add_argument('--max-tokens', type=int, default=16384, help='API调用超时时间（秒）')
    default_api_key = llm_config.get('api_key', "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    parser.add_argument('--api_key', type=str, default=default_api_key, help='API KEY')
    parser.add_argument('--is_vllm', action='store_true', default=False, help='是否使用vllm')
    parser.add_argument('--temperature', type=float, default=0.0, help='生成温度')
    parser.add_argument('--top-p', type=float, default=1.0, help='Top P采样参数')
    parser.add_argument('--auth_token', type=str, default=None, help='JWT token for backend API authentication')

    return parser.parse_args()


def main():
    """主函数"""
    # 解析命令行参数
    initialize_langdetect_profiles()
    
    args = parse_args()
    
    # 加载自定义评分模块（如果提供）
    if args.scoring_module:
        load_custom_scoring_module(args.scoring_module)
    
    # 确保使用的评分函数存在
    if args.scoring not in SCORING_FUNCTIONS_plugin:
        print(f"错误: 评分函数 '{args.scoring}' 未注册")
        print(f"可用的评分函数: {list(SCORING_FUNCTIONS_plugin.keys())}")
        exit(1)
    

    # 加载测试数据（支持本地文件或数据库）
    if args.data_id and args.user_id and args.database_service_url:
        print(f"从数据库加载测试数据: data_id={args.data_id}")
        # 获取数据和文件名
        import httpx
        with httpx.Client(base_url=args.database_service_url, timeout=30.0) as client:
            response = client.get(f"/api/user-data/{args.user_id}/{args.data_id}")
            response.raise_for_status()
            result = response.json()
            args.data_filename = result.get("filename", "unknown")  # 保存文件名到args
        test_data = load_jsonl(
            data_id=args.data_id,
            user_id=args.user_id,
            database_service_url=args.database_service_url
        )
    elif args.data_file:
        print(f"加载测试数据: {args.data_file}")
        test_data = load_jsonl(file_path=args.data_file)
        args.data_filename = os.path.basename(args.data_file)  # 保存文件名到args
    else:
        print("错误: 必须指定 --data_file 或 --data_id")
        exit(1)
    print(f"加载完成，共 {len(test_data)} 条数据")
    
    # 获取评分函数
    scoring_func = get_scoring_function(args.scoring, SCORING_FUNCTIONS_plugin)
    
    print(f"使用评分函数: {args.scoring}")
    print(f"API地址: {args.api_urls}")
    print(f"模型名称: {args.model}")
    print(f"Badcase阈值: {args.badcase_threshold}")
    
    # 如果指定了样本数量，则只取部分数据
    if args.sample_size > 0 and args.sample_size < len(test_data):
        test_data = test_data[:args.sample_size]
        print(f"使用样本数据: {args.sample_size} 条")
    
    # 进度回调函数，直接通过HTTP API保存进度到数据库
    def progress_callback(phase: str, current: int, total: int, progress_pct: float):
        if args.database_service_url and args.task_id:
            try:
                import httpx
                with httpx.Client(base_url=args.database_service_url, timeout=5.0) as client:
                    client.put(f"/api/user-tasks/{args.task_id}", json={
                        "updates": {
                            "progress": progress_pct,
                            "message": f"{phase}: {current}/{total} ({progress_pct:.1f}%)"
                        }
                    })
            except Exception:
                pass  # 保存失败不影响主流程
    
    # 批量评估
    results, badcases = batch_evaluate(
        test_data,
        args.api_urls,
        scoring_func,
        max_workers=args.max_workers,
        badcase_threshold=args.badcase_threshold,
        test_mode=args.test_mode,
        model=args.model,
        checkpoint_path=args.checkpoint_path,
        checkpoint_interval=args.checkpoint_interval,
        resume=args.resume,
        role_test=args.role,
        timeout=args.timeout,
        max_tokens=args.max_tokens,
        api_key=args.api_key,
        is_vllm=args.is_vllm,
        temperature=getattr(args, 'temperature', 0.0),
        top_p=getattr(args, 'top_p', 1.0),
        progress_callback=progress_callback,
        auth_token=getattr(args, 'auth_token', None)
    )

    # 汇总结果
    summary = aggregate_results(results)
    # 生成报告
    report_formats = [fmt.strip() for fmt in args.report_format.split(',')]

    generate_report(
        summary, results, badcases, args.report_dir, report_formats, args,
        user_id=args.user_id,
        task_id=args.task_id,
        database_service_url=args.database_service_url,
        progress_callback=progress_callback
    )

if __name__ == "__main__":
    main()