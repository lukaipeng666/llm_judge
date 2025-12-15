#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM Judge Web UI - 后端 API 服务
基于 FastAPI 构建，提供评测任务管理和结果查询接口
"""

import os
import sys
import json
import asyncio
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# 添加项目根目录到 Python 路径
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from function_register.plugin import SCORING_FUNCTIONS_plugin, initialize_langdetect_profiles

# 初始化 FastAPI 应用
app = FastAPI(
    title="LLM Judge Web UI API",
    description="大模型评测系统 Web 接口",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 存储运行中的任务状态
running_tasks: Dict[str, Dict[str, Any]] = {}

# ==================== 数据模型 ====================

class EvaluationConfig(BaseModel):
    """评测配置模型"""
    api_urls: List[str] = ["http://localhost:8000/v1"]
    model: str = "Qwen/Qwen-1.8B-Chat"
    data_file: str = ""
    scoring: str = "rouge"
    scoring_module: str = "./function_register/plugin.py"
    max_workers: int = 4
    badcase_threshold: float = 0.5
    report_dir: str = "./reports"
    report_format: str = "json, txt, badcases"
    test_mode: bool = False
    sample_size: int = 0
    checkpoint_path: Optional[str] = None
    checkpoint_interval: int = 32
    resume: bool = False
    role: str = "assistant"
    timeout: int = 600
    max_tokens: int = 16384
    api_key: str = "sk-xxx"


class TaskStatus(BaseModel):
    """任务状态模型"""
    task_id: str
    status: str  # pending, running, completed, failed
    progress: float = 0.0
    message: str = ""
    config: Optional[Dict] = None
    result: Optional[Dict] = None
    created_at: str = ""
    updated_at: str = ""


class ReportSummary(BaseModel):
    """报告摘要模型"""
    dataset: str
    model: str
    report_path: str
    timestamp: str
    summary: Dict


# ==================== API 接口 ====================

@app.get("/")
async def root():
    """根路径 - API 健康检查"""
    return {
        "status": "ok",
        "message": "LLM Judge Web UI API is running",
        "version": "1.0.0"
    }


@app.get("/api/scoring-functions")
async def get_scoring_functions():
    """获取所有可用的评分函数列表"""
    initialize_langdetect_profiles()
    return {
        "scoring_functions": list(SCORING_FUNCTIONS_plugin.keys())
    }


@app.get("/api/data-files")
async def get_data_files():
    """获取 data_raw 目录下的所有数据文件"""
    data_dir = PROJECT_ROOT / "data_raw"
    files = []
    
    if data_dir.exists():
        for file in data_dir.glob("*.jsonl"):
            files.append({
                "name": file.name,
                "path": str(file),
                "size": file.stat().st_size
            })
    
    return {"data_files": files}


@app.get("/api/reports")
async def get_reports():
    """获取所有评测报告列表"""
    reports_dir = PROJECT_ROOT / "reports"
    reports = []
    
    if reports_dir.exists():
        for dataset_dir in reports_dir.iterdir():
            if dataset_dir.is_dir():
                for model_dir in dataset_dir.iterdir():
                    if model_dir.is_dir():
                        for report_file in model_dir.glob("evaluation_report_*.json"):
                            try:
                                with open(report_file, 'r', encoding='utf-8') as f:
                                    data = json.load(f)
                                    reports.append({
                                        "dataset": dataset_dir.name,
                                        "model": model_dir.name,
                                        "report_path": str(report_file),
                                        "timestamp": data.get("timestamp", ""),
                                        "summary": data.get("summary", {})
                                    })
                            except Exception as e:
                                continue
    
    # 按时间戳排序，最新的在前面
    reports.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"reports": reports}


@app.get("/api/reports/{dataset}/{model}")
async def get_report_detail(dataset: str, model: str):
    """获取指定报告的详细信息"""
    reports_dir = PROJECT_ROOT / "reports" / dataset / model
    
    if not reports_dir.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    
    # 获取最新的报告文件
    report_files = list(reports_dir.glob("evaluation_report_*.json"))
    if not report_files:
        raise HTTPException(status_code=404, detail="No report files found")
    
    latest_report = max(report_files, key=lambda x: x.stat().st_mtime)
    
    try:
        with open(latest_report, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/evaluate")
async def start_evaluation(config: EvaluationConfig, background_tasks: BackgroundTasks):
    """启动评测任务"""
    task_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 构建命令行参数
    cmd = [
        sys.executable, str(PROJECT_ROOT / "main.py"),
        "--api_urls", *config.api_urls,
        "--model", config.model,
        "--data_file", config.data_file,
        "--scoring", config.scoring,
        "--scoring_module", config.scoring_module,
        "--max_workers", str(config.max_workers),
        "--badcase_threshold", str(config.badcase_threshold),
        "--report_dir", config.report_dir,
        "--report_format", config.report_format,
        "--role", config.role,
        "--timeout", str(config.timeout),
        "--max-tokens", str(config.max_tokens),
        "--api_key", config.api_key,
    ]
    
    if config.test_mode:
        cmd.append("--test-mode")
    
    if config.sample_size > 0:
        cmd.extend(["--sample-size", str(config.sample_size)])
    
    if config.checkpoint_path:
        cmd.extend(["--checkpoint_path", config.checkpoint_path])
        cmd.extend(["--checkpoint_interval", str(config.checkpoint_interval)])
    
    if config.resume:
        cmd.append("--resume")
    
    # 初始化任务状态
    running_tasks[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "progress": 0.0,
        "message": "Task created, waiting to start...",
        "config": config.dict(),
        "result": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "process": None
    }
    
    # 在后台运行任务
    background_tasks.add_task(run_evaluation_task, task_id, cmd)
    
    return {
        "task_id": task_id,
        "status": "pending",
        "message": "Evaluation task created"
    }


async def run_evaluation_task(task_id: str, cmd: List[str]):
    """在后台运行评测任务"""
    try:
        running_tasks[task_id]["status"] = "running"
        running_tasks[task_id]["message"] = "Evaluation in progress..."
        running_tasks[task_id]["updated_at"] = datetime.now().isoformat()
        
        # 使用 subprocess 运行任务
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=str(PROJECT_ROOT),
            text=True
        )
        
        running_tasks[task_id]["process"] = process
        
        # 读取输出
        output_lines = []
        for line in process.stdout:
            output_lines.append(line.strip())
            # 解析进度信息
            if "%" in line:
                try:
                    # 尝试提取进度百分比
                    import re
                    match = re.search(r'(\d+(?:\.\d+)?)\s*%', line)
                    if match:
                        running_tasks[task_id]["progress"] = float(match.group(1))
                except:
                    pass
            running_tasks[task_id]["message"] = line.strip()
            running_tasks[task_id]["updated_at"] = datetime.now().isoformat()
        
        process.wait()
        
        if process.returncode == 0:
            running_tasks[task_id]["status"] = "completed"
            running_tasks[task_id]["progress"] = 100.0
            running_tasks[task_id]["message"] = "Evaluation completed successfully"
        else:
            running_tasks[task_id]["status"] = "failed"
            running_tasks[task_id]["message"] = f"Evaluation failed with return code {process.returncode}"
        
        running_tasks[task_id]["result"] = {
            "output": "\n".join(output_lines[-50:])  # 保留最后50行输出
        }
        
    except Exception as e:
        running_tasks[task_id]["status"] = "failed"
        running_tasks[task_id]["message"] = str(e)
    
    running_tasks[task_id]["updated_at"] = datetime.now().isoformat()


@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str):
    """获取任务状态"""
    if task_id not in running_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = running_tasks[task_id].copy()
    task.pop("process", None)  # 不返回进程对象
    return task


@app.get("/api/tasks")
async def get_all_tasks():
    """获取所有任务列表"""
    tasks = []
    for task_id, task in running_tasks.items():
        task_copy = task.copy()
        task_copy.pop("process", None)
        tasks.append(task_copy)
    
    tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"tasks": tasks}


@app.delete("/api/tasks/{task_id}")
async def cancel_task(task_id: str):
    """取消运行中的任务"""
    if task_id not in running_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = running_tasks[task_id]
    if task["status"] == "running" and task.get("process"):
        task["process"].terminate()
        task["status"] = "cancelled"
        task["message"] = "Task cancelled by user"
        task["updated_at"] = datetime.now().isoformat()
    
    return {"message": "Task cancelled"}


@app.get("/api/models")
async def get_available_models():
    """获取常用模型列表（可从历史记录中提取）"""
    models = set()
    reports_dir = PROJECT_ROOT / "reports"
    
    if reports_dir.exists():
        for dataset_dir in reports_dir.iterdir():
            if dataset_dir.is_dir():
                for model_dir in dataset_dir.iterdir():
                    if model_dir.is_dir():
                        models.add(model_dir.name)
    
    return {"models": sorted(list(models))}


@app.get("/api/datasets")
async def get_available_datasets():
    """获取可用的数据集列表"""
    datasets = set()
    reports_dir = PROJECT_ROOT / "reports"
    
    if reports_dir.exists():
        for dataset_dir in reports_dir.iterdir():
            if dataset_dir.is_dir():
                datasets.add(dataset_dir.name)
    
    return {"datasets": sorted(list(datasets))}


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8080,
        reload=True
    )
