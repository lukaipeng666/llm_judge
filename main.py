#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
大模型测评脚本
"""

import argparse
import os
from data_load.load_and_save import load_jsonl, load_custom_scoring_module
from function_register.plugin import SCORING_FUNCTIONS_plugin, initialize_langdetect_profiles
from result_gen.report import generate_report, aggregate_results
from score.get_score import get_scoring_function
from batch.batch_process import batch_evaluate

def parse_args():
    """
    解析命令行参数
    """
    parser = argparse.ArgumentParser(description='大模型测评脚本')
    parser.add_argument('--api_urls', nargs='+', default="http://localhost:8000/generate/chat/completions", help='兼容OpenAI的地址')
    parser.add_argument('--model', default="Qwen/Qwen-1.8B-Chat", help='vllm模型名称')
    parser.add_argument('--data_file', default=None, help='测试数据文件路径')
    parser.add_argument('--data_id', type=int, default=None, help='数据库中的数据ID')
    parser.add_argument('--scoring', default='rouge', help='评分函数名称')
    parser.add_argument('--scoring_module', type=str, default="./function_register/plugin.py", help='自定义评分模块文件路径')
    parser.add_argument('--output', default='evaluation_report.json', help='评分报告输出文件路径')
    parser.add_argument('--max_workers', type=int, default=4, help='最大工作线程数')
    parser.add_argument('--badcase_threshold', type=float, default=0.5, help='Badcase判断阈值')
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
    parser.add_argument('--api_key', type=str, default="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", help='API KEY')
    parser.add_argument('--is_vllm', type=bool, default=False, help='是否使用vllm')

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
        progress_callback=progress_callback
    )

    # 汇总结果
    summary = aggregate_results(results)
    # 生成报告
    report_formats = [fmt.strip() for fmt in args.report_format.split(',')]
    # 无论什么模式，都先生成报告（保存到数据库或文件）
    generate_report(
        summary, results, badcases, args.report_dir, report_formats, args,
        user_id=args.user_id,
        task_id=args.task_id,
        database_service_url=args.database_service_url
    )

if __name__ == "__main__":
    main()