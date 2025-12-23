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
import threading
import shutil
import time
import redis
import logging
from collections import deque, defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from urllib.parse import unquote, quote
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import yaml

# 配置日志
logger = logging.getLogger(__name__)

# 导入认证和数据库模块
from .auth import UserRegister, UserLogin, Token, create_access_token, get_current_user

# 处理数据库客户端的导入
from pathlib import Path
import sys
DB_CLIENT_PATH = Path(__file__).parent.parent / "database" / "client"
if str(DB_CLIENT_PATH) not in sys.path:
    sys.path.insert(0, str(DB_CLIENT_PATH))
import database_client as db

# 添加项目根目录到 Python 路径
# app.py 位于 web-ui/backend/api/，需要向上4层到达 llm-judge 根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
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

# 添加自定义异常处理器
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """处理 Pydantic 验证错误，返回更详细的信息"""
    print(f"[ERROR] Validation error: {exc}")
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


# 存储运行中的进程对象（仅用于取消任务）
# 使用弱引用避免内存泄漏，并添加自动清理机制
running_processes: Dict[str, subprocess.Popen] = {}
processes_lock = threading.Lock()

# 自动注册限制：IP频率限制
auto_register_rate_limit: Dict[str, List[datetime]] = defaultdict(list)
rate_limit_lock = threading.Lock()
RATE_LIMIT_WINDOW = timedelta(minutes=5)  # 5分钟窗口
RATE_LIMIT_MAX_REQUESTS = 10  # 每个IP最多10次请求

# 添加URL安全编码/解码辅助函数
def url_safe_encode(value: str) -> str:
    """URL安全编码"""
    return quote(value, safe='')

def url_safe_decode(value: str) -> str:
    """URL安全解码"""
    return unquote(value)

def cleanup_finished_processes():
    """清理已结束的进程，防止内存泄漏"""
    with processes_lock:
        finished_tasks = []
        for task_id, process in running_processes.items():
            if process.poll() is not None:  # 进程已结束
                finished_tasks.append(task_id)
        for task_id in finished_tasks:
            del running_processes[task_id]
        if finished_tasks:
            print(f"[INFO] 自动清理 {len(finished_tasks)} 个已结束的进程")
        return len(finished_tasks)

# ==================== 数据模型 ====================

class EvaluationConfig(BaseModel):
    """评测配置模型"""
    api_urls: List[str] = ["http://localhost:8000/v1"]
    model: str = "Qwen/Qwen-1.8B-Chat"
    data_file: str = ""  # 改为 data_id
    scoring: str = "rouge"
    scoring_module: str = "./function_register/plugin.py"
    max_workers: int = 4
    badcase_threshold: float = 1
    report_format: str = "json, txt, badcases"
    test_mode: bool = False
    sample_size: int = 0
    checkpoint_path: Optional[str] = None
    checkpoint_interval: int = 32
    resume: bool = False
    role: str = "assistant"
    timeout: int = 600
    max_tokens: int = 8000
    api_key: str = "sk-xxx"
    is_vllm: bool = False
    temperature: Optional[float] = 0.0
    top_p: Optional[float] = 1.0


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

@app.on_event("startup")
async def startup_event():
    """服务启动时的初始化任务"""
    import asyncio
    
    # 配置日志格式和级别
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 设置uvicorn和fastapi的日志级别
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(logging.INFO)
    fastapi_logger = logging.getLogger("fastapi")
    fastapi_logger.setLevel(logging.INFO)
    
    # 确保我们的logger也使用INFO级别
    logger.setLevel(logging.INFO)
    
    # 清理 Redis 中遗留的并发计数器（防止之前服务崩溃导致计数器残留）
    try:
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        
        redis_config = yaml_config.get('redis_service', {})
        redis_host = redis_config.get('host', 'localhost')
        redis_port = redis_config.get('port', 6379)
        redis_db = redis_config.get('db', 0)
        
        redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            decode_responses=True
        )
        
        # 查找并删除所有并发计数器 key
        cursor = 0
        deleted_count = 0
        while True:
            cursor, keys = redis_client.scan(cursor, match="model_concurrency:*", count=100)
            for key in keys:
                redis_client.delete(key)
                deleted_count += 1
            if cursor == 0:
                break
        
        if deleted_count > 0:
            logger.info(f"[Redis] 启动时清理了 {deleted_count} 个遗留的并发计数器")
        else:
            logger.debug("[Redis] 启动时没有发现遗留的并发计数器")
    except redis.ConnectionError as e:
        logger.warning(f"[Redis] 启动时清理并发计数器失败（Redis未连接）: {e}")
    except Exception as e:
        logger.warning(f"[Redis] 启动时清理并发计数器失败: {e}")
    
    async def periodic_cleanup():
        """定期清理已结束的进程"""
        while True:
            await asyncio.sleep(60)  # 每60秒清理一次
            cleanup_finished_processes()
    
    # 启动后台清理任务
    asyncio.create_task(periodic_cleanup())
    logger.info("进程自动清理任务已启动（每60秒执行一次）")


@app.get("/")
async def root():
    """根路径 - API 健康检查"""
    # 顺便触发一次进程清理
    cleanup_finished_processes()
    return {
        "status": "ok",
        "message": "LLM Judge Web UI API is running",
        "version": "2.0.0",
        "features": ["multi-user", "authentication", "data-management"],
        "active_processes": len(running_processes)
    }


# ==================== 用户认证接口 ====================

@app.post("/api/auth/register", response_model=Token)
async def register(user: UserRegister):
    """用户注册"""
    # 创建用户
    user_id = db.create_user(user.username, user.password, user.email)
    if not user_id:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # 生成token
    access_token = create_access_token(data={"user_id": user_id, "username": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user.username,
            "email": user.email
        }
    }

@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """用户登录"""
    user = db.verify_user(credentials.username, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # 生成token
    access_token = create_access_token(data={"user_id": user["id"], "username": user["username"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


def check_rate_limit(client_ip: str) -> bool:
    """检查IP频率限制"""
    with rate_limit_lock:
        now = datetime.now()
        # 清理过期的请求记录
        auto_register_rate_limit[client_ip] = [
            req_time for req_time in auto_register_rate_limit[client_ip]
            if now - req_time < RATE_LIMIT_WINDOW
        ]
        
        # 检查是否超过限制
        if len(auto_register_rate_limit[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            return False
        
        # 记录本次请求
        auto_register_rate_limit[client_ip].append(now)
        return True


@app.post("/api/auth/auto-login", response_model=Token)
async def auto_login(credentials: UserLogin, request: Request):
    """
    自动注册并登录
    如果用户不存在，自动注册；如果存在，验证密码并登录
    用于外部系统免密登录集成
    
    安全限制：
    1. admin用户不能使用此接口自动登录
    2. 自动注册有频率限制（每个IP 5分钟内最多10次）
    """
    # 禁止admin用户使用自动登录
    if credentials.username.lower() == "admin":
        raise HTTPException(
            status_code=403, 
            detail="Admin users cannot use auto-login. Please use the regular login endpoint."
        )
    
    # 获取客户端IP
    client_ip = request.client.host if request.client else "unknown"
    
    # 先尝试验证用户（登录）
    user = db.verify_user(credentials.username, credentials.password)
    
    if user:
        # 用户存在且密码正确，直接登录
        access_token = create_access_token(data={"user_id": user["id"], "username": user["username"]})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    # 用户不存在或密码错误，尝试注册
    # 检查频率限制（仅对注册请求进行限制）
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail=f"Too many auto-register requests. Maximum {RATE_LIMIT_MAX_REQUESTS} requests per {RATE_LIMIT_WINDOW.seconds // 60} minutes."
        )
    
    # 检查用户是否已存在（通过尝试创建用户）
    user_id = db.create_user(credentials.username, credentials.password, None)
    
    if user_id:
        # 注册成功，生成token
        access_token = create_access_token(data={"user_id": user_id, "username": credentials.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "username": credentials.username,
                "email": None
            }
        }
    else:
        # 用户已存在但密码错误
        raise HTTPException(status_code=401, detail="Invalid username or password")


@app.get("/api/auth/me")
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """获取当前登录用户信息"""
    user = db.get_user_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_current_admin_user(current_user: Dict = Depends(get_current_user)):
    """验证当前用户是否为管理员"""
    if current_user["username"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@app.get("/api/scoring-functions")
async def get_scoring_functions():
    """获取所有可用的评分函数列表"""
    initialize_langdetect_profiles()
    return {
        "scoring_functions": list(SCORING_FUNCTIONS_plugin.keys())
    }


@app.get("/api/models")
async def get_available_models(current_user: Dict = Depends(get_current_user)):
    """获取可用的模型列表(从用户历史报告中提取)"""
    try:
        reports = db.get_user_reports(current_user["user_id"])
        # 从报告中提取唯一的模型名称
        models = sorted(list(set(report["model"] for report in reports if report.get("model"))))
        return {"models": models}
    except Exception as e:
        print(f"[ERROR] Failed to get available models: {str(e)}")
        # 如果出错,返回空列表而不是抛出异常
        return {"models": []}


# ==================== 用户数据管理接口 ====================

@app.get("/api/user/data")
async def get_user_data_files(current_user: Dict = Depends(get_current_user)):
    """获取当前用户的数据文件列表"""
    try:
        data_list = db.get_user_data_list(current_user["user_id"])
        print(f"[DEBUG] User {current_user['user_id']} data_list: {len(data_list)} files")
        return {"data_files": data_list}
    except Exception as e:
        print(f"[ERROR] Failed to get user data list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve data files: {str(e)}")


@app.get("/api/user/data/{data_id}/content")
async def get_user_data_content(data_id: int, current_user: Dict = Depends(get_current_user)):
    """获取用户数据文件的内容（JSONL格式，每行解析为JSON对象）"""
    try:
        # 获取数据信息
        user_data = db.get_user_data_by_id(current_user["user_id"], data_id)
        if not user_data:
            raise HTTPException(status_code=404, detail="Data file not found or access denied")
        
        # 解析JSONL内容
        file_content = user_data.get("file_content", "")
        lines = file_content.strip().split('\n')
        
        jsonl_data = []
        for i, line in enumerate(lines):
            if line.strip():
                try:
                    jsonl_data.append(json.loads(line))
                except json.JSONDecodeError as e:
                    # 返回解析错误信息
                    return {
                        "filename": user_data["filename"],
                        "description": user_data.get("description", ""),
                        "total_count": len([l for l in lines if l.strip()]),
                        "data": jsonl_data,
                        "error": f"Failed to parse line {i + 1}: {str(e)}"
                    }
        
        return {
            "filename": user_data["filename"],
            "description": user_data.get("description", ""),
            "total_count": len(jsonl_data),
            "data": jsonl_data,
            "error": None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/user/data/validate-csv")
async def validate_csv_file(file: UploadFile = File(...), 
                           current_user: Dict = Depends(get_current_user)):
    """验证CSV文件并转换为JSONL格式（不保存文件）"""
    try:
        # 延迟导入
        from .csv_to_jsonl import convert_csv_to_jsonl_in_memory
        
        # 验证文件类型
        if not file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only .csv files are supported")
        
        # 读取文件内容
        content = await file.read()
        csv_content = content.decode('utf-8-sig')
        
        # 转换CSV并获取验证信息
        jsonl_data, validation_info = convert_csv_to_jsonl_in_memory(csv_content)
        
        # 如果有错误，返回详细错误信息
        if validation_info["errors"]:
            return {
                "success": False,
                "message": "CSV文件验证失败",
                "validation": validation_info,
                "preview_data": []
            }
        
        # 成功转换，返回预览数据和统计信息
        preview_data = jsonl_data[:5]  # 只返回前5条作为预览
        return {
            "success": True,
            "message": "CSV文件验证成功",
            "validation": {
                "total_rows": validation_info["total_rows"],
                "valid_rows": validation_info["valid_rows"],
                "empty_rows": validation_info["empty_rows"],
                "headers_info": validation_info["headers_info"],
                "warnings": validation_info["warnings"],
                "invalid_rows": validation_info["invalid_rows"]
            },
            "preview_data": preview_data
        }
    except Exception as e:
        import traceback
        error_detail = f"Validation error: {str(e)}\n{traceback.format_exc()}"
        print(f"[ERROR] CSV validation failed: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/api/user/data")
async def upload_user_data(file: UploadFile = File(...), description: str = "", 
                           current_user: Dict = Depends(get_current_user)):
    """上传用户数据文件（支持JSONL和CSV）"""
    try:
        file_content = ""
        
        if file.filename.endswith(".jsonl"):
            # JSONL文件直接上传
            content = await file.read()
            file_content = content.decode('utf-8')
            
            # 验证是否是有效的JSONL格式
            lines = file_content.strip().split('\n')
            for line in lines:
                if line.strip():
                    json.loads(line)  # 验证每行是JSON
        
        elif file.filename.endswith(".csv"):
            # 延迟导入CSV转换模块
            from .csv_to_jsonl import convert_csv_to_jsonl_in_memory
            
            # CSV文件需要先转换为JSONL
            csv_content = (await file.read()).decode('utf-8-sig')
            
            # 转换CSV并验证
            jsonl_data, validation_info = convert_csv_to_jsonl_in_memory(csv_content)
            
            # 检查转换是否成功
            if validation_info["errors"]:
                error_msg = "CSV转换失败: " + "; ".join(validation_info["errors"])
                raise HTTPException(status_code=400, detail=error_msg)
            
            # 转换成功，生成JSONL内容
            file_content = "\n".join(
                json.dumps(obj, ensure_ascii=False) for obj in jsonl_data
            )
            # 更新filename为jsonl后缀
            original_filename = file.filename
            file.filename = original_filename.replace(".csv", ".jsonl")
        
        else:
            raise HTTPException(status_code=400, detail="Only .jsonl and .csv files are supported")
        
        # 创建数据库记录
        data_id = db.create_user_data(
            user_id=current_user["user_id"],
            filename=file.filename,
            file_content=file_content,
            description=description
        )
        
        return {
            "id": data_id,
            "filename": file.filename,
            "size": len(file_content.encode('utf-8')),
            "description": description,
            "message": "File uploaded successfully"
        }
    
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSONL format")
    except Exception as e:
        import traceback
        error_detail = f"Upload error: {str(e)}\n{traceback.format_exc()}"
        print(f"[ERROR] Upload failed: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)


@app.put("/api/user/data/{data_id}")
async def update_user_data_info(data_id: int, description: str, 
                                 current_user: Dict = Depends(get_current_user)):
    """更新用户数据文件描述（保留用于兼容性，但不再使用）"""
    success = db.update_user_data(current_user["user_id"], data_id, description)
    if not success:
        raise HTTPException(status_code=404, detail="Data file not found or access denied")
    return {"message": "Data file updated successfully"}


class DataEditRequest(BaseModel):
    """数据编辑请求模型"""
    edit_type: str  # "single" 或 "batch"
    item_index: Optional[int] = None  # 单独编辑时的数据索引
    field_type: str  # "meta_description" 或 "turn_text"
    role: Optional[str] = None  # 编辑turn_text时的角色（human/assistant等）
    turn_index: Optional[int] = None  # 编辑turn_text时的turn索引
    new_value: str  # 新值


class SingleItemEditRequest(BaseModel):
    """单条数据完整编辑请求模型"""
    item_index: int  # 数据索引
    edited_item: Dict[str, Any]  # 编辑后的完整JSON对象


class BatchDeleteItemsRequest(BaseModel):
    """批量删除数据项请求模型"""
    item_indices: List[int]  # 要删除的数据索引列表


class AddItemRequest(BaseModel):
    """添加单条数据请求模型"""
    new_item: Dict[str, Any]  # 新数据项的完整JSON对象


def validate_item_edit(original_item: Dict, edited_item: Dict) -> Tuple[bool, Optional[str]]:
    """验证编辑后的JSON是否只修改了允许的字段"""
    # 检查结构是否一致（不允许修改JSON结构）
    original_keys = sorted(original_item.keys())
    edited_keys = sorted(edited_item.keys())
    if original_keys != edited_keys:
        return False, '不允许修改JSON结构，只能修改meta_description和turns中的text字段'
    
    # 检查meta字段
    if original_item.get("meta") and edited_item.get("meta"):
        original_meta_keys = sorted(original_item["meta"].keys())
        edited_meta_keys = sorted(edited_item["meta"].keys())
        if original_meta_keys != edited_meta_keys:
            return False, '不允许修改meta的结构，只能修改meta_description字段'
    elif original_item.get("meta") != edited_item.get("meta"):
        return False, '不允许修改meta的结构'
    
    # 检查turns字段
    if original_item.get("turns") and edited_item.get("turns"):
        if not isinstance(edited_item["turns"], list) or len(edited_item["turns"]) != len(original_item["turns"]):
            return False, '不允许修改turns数组的长度或结构'
        
        for i, (orig_turn, edit_turn) in enumerate(zip(original_item["turns"], edited_item["turns"])):
            # 检查turn的结构
            orig_turn_keys = sorted(orig_turn.keys())
            edit_turn_keys = sorted(edit_turn.keys())
            if orig_turn_keys != edit_turn_keys:
                return False, f'不允许修改turn {i + 1}的结构'
            
            # 检查role是否改变
            if orig_turn.get("role") != edit_turn.get("role"):
                return False, f'不允许修改turn {i + 1}的role字段'
            
            # text字段允许修改（不检查）
    elif original_item.get("turns") != edited_item.get("turns"):
        return False, '不允许修改turns的结构'
    
    # 检查其他字段是否改变
    for key in original_keys:
        if key in ["meta", "turns"]:
            continue
        if json.dumps(original_item[key], ensure_ascii=False, sort_keys=True) != json.dumps(edited_item[key], ensure_ascii=False, sort_keys=True):
            return False, f'不允许修改字段: {key}'
    
    return True, None


@app.put("/api/user/data/{data_id}/edit")
async def edit_user_data_content(data_id: int, edit_request: DataEditRequest,
                                 current_user: Dict = Depends(get_current_user)):
    """编辑用户数据内容（单独或批量）"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        # 获取当前数据内容
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get(f"/api/user-data/{current_user['user_id']}/{data_id}")
            response.raise_for_status()
            data_info = response.json()
            
            file_content = data_info.get("file_content", "")
            if not file_content:
                raise HTTPException(status_code=404, detail="Data content not found")
            
            # 解析JSONL内容
            data_items = []
            for line in file_content.split("\n"):
                line = line.strip()
                if line:
                    data_items.append(json.loads(line))
            
            # 执行编辑操作
            if edit_request.edit_type == "single":
                # 单独编辑
                if edit_request.item_index is None or edit_request.item_index < 0 or edit_request.item_index >= len(data_items):
                    raise HTTPException(status_code=400, detail="Invalid item index")
                
                item = data_items[edit_request.item_index]
                
                if edit_request.field_type == "meta_description":
                    # 编辑meta_description
                    if "meta" not in item:
                        item["meta"] = {}
                    item["meta"]["meta_description"] = edit_request.new_value
                elif edit_request.field_type == "turn_text":
                    # 编辑turn的text
                    if "turns" not in item:
                        raise HTTPException(status_code=400, detail="Item has no turns field")
                    if edit_request.turn_index is None or edit_request.turn_index < 0 or edit_request.turn_index >= len(item["turns"]):
                        raise HTTPException(status_code=400, detail="Invalid turn index")
                    if edit_request.role and item["turns"][edit_request.turn_index].get("role") != edit_request.role:
                        raise HTTPException(status_code=400, detail="Role mismatch")
                    item["turns"][edit_request.turn_index]["text"] = edit_request.new_value
                else:
                    raise HTTPException(status_code=400, detail="Invalid field_type")
                
            elif edit_request.edit_type == "batch":
                # 批量编辑
                if edit_request.field_type == "meta_description":
                    # 批量更新所有meta_description
                    for item in data_items:
                        if "meta" not in item:
                            item["meta"] = {}
                        item["meta"]["meta_description"] = edit_request.new_value
                elif edit_request.field_type == "turn_text":
                    # 批量更新指定角色的所有turn的text
                    if not edit_request.role:
                        raise HTTPException(status_code=400, detail="Role is required for batch edit turn_text")
                    for item in data_items:
                        if "turns" in item:
                            for turn in item["turns"]:
                                if turn.get("role") == edit_request.role:
                                    turn["text"] = edit_request.new_value
                else:
                    raise HTTPException(status_code=400, detail="Invalid field_type")
            else:
                raise HTTPException(status_code=400, detail="Invalid edit_type")
            
            # 将修改后的数据转换回JSONL格式
            updated_content = "\n".join(json.dumps(item, ensure_ascii=False) for item in data_items)
            
            # 更新数据库
            update_response = client.put(f"/api/user-data/{current_user['user_id']}/{data_id}/content", json={
                "file_content": updated_content
            })
            update_response.raise_for_status()
            
            return {
                "message": "Data edited successfully",
                "updated_count": len(data_items) if edit_request.edit_type == "batch" else 1
            }
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Database service error: {e.response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to edit data: {str(e)}")


@app.put("/api/user/data/{data_id}/edit-item")
async def edit_single_item_complete(data_id: int, edit_request: SingleItemEditRequest,
                                    current_user: Dict = Depends(get_current_user)):
    """编辑单条数据的完整内容（支持一次修改多个允许的字段）"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        # 获取当前数据内容
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get(f"/api/user-data/{current_user['user_id']}/{data_id}")
            response.raise_for_status()
            data_info = response.json()
            
            file_content = data_info.get("file_content", "")
            if not file_content:
                raise HTTPException(status_code=404, detail="Data content not found")
            
            # 解析JSONL内容
            data_items = []
            for line in file_content.split("\n"):
                line = line.strip()
                if line:
                    data_items.append(json.loads(line))
            
            # 验证索引
            if edit_request.item_index < 0 or edit_request.item_index >= len(data_items):
                raise HTTPException(status_code=400, detail="Invalid item index")
            
            original_item = data_items[edit_request.item_index]
            
            # 验证编辑后的JSON
            is_valid, error_msg = validate_item_edit(original_item, edit_request.edited_item)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)
            
            # 替换数据项
            data_items[edit_request.item_index] = edit_request.edited_item
            
            # 将修改后的数据转换回JSONL格式
            updated_content = "\n".join(json.dumps(item, ensure_ascii=False) for item in data_items)
            
            # 更新数据库
            update_response = client.put(f"/api/user-data/{current_user['user_id']}/{data_id}/content", json={
                "file_content": updated_content
            })
            update_response.raise_for_status()
            
            return {
                "message": "Data edited successfully",
                "updated_count": 1
            }
            
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Database service error: {e.response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to edit data: {str(e)}")


@app.delete("/api/user/data/{data_id}")
async def delete_user_data_file(data_id: int, current_user: Dict = Depends(get_current_user)):
    """删除用户数据文件"""
    # 删除数据库记录
    success = db.delete_user_data(current_user["user_id"], data_id)
    if not success:
        raise HTTPException(status_code=404, detail="Data file not found or access denied")
    
    return {"message": "Data file deleted successfully"}


@app.delete("/api/user/data/{data_id}/items/{item_index}")
async def delete_single_item(data_id: int, item_index: int, 
                             current_user: Dict = Depends(get_current_user)):
    """删除单条数据"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        # 获取当前数据内容
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get(f"/api/user-data/{current_user['user_id']}/{data_id}")
            response.raise_for_status()
            data_info = response.json()
            
            file_content = data_info.get("file_content", "")
            if not file_content:
                raise HTTPException(status_code=404, detail="Data content not found")
            
            # 解析JSONL内容
            data_items = []
            for line in file_content.split("\n"):
                line = line.strip()
                if line:
                    data_items.append(json.loads(line))
            
            # 验证索引
            if item_index < 0 or item_index >= len(data_items):
                raise HTTPException(status_code=400, detail="Invalid item index")
            
            # 删除指定索引的数据项
            data_items.pop(item_index)
            
            # 将修改后的数据转换回JSONL格式
            updated_content = "\n".join(json.dumps(item, ensure_ascii=False) for item in data_items)
            
            # 更新数据库
            update_response = client.put(f"/api/user-data/{current_user['user_id']}/{data_id}/content", json={
                "file_content": updated_content
            })
            update_response.raise_for_status()
            
            return {
                "message": "Item deleted successfully",
                "deleted_count": 1
            }
            
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Database service error: {e.response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")


@app.delete("/api/user/data/{data_id}/items")
async def batch_delete_items(data_id: int, delete_request: BatchDeleteItemsRequest,
                             current_user: Dict = Depends(get_current_user)):
    """批量删除数据"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        if not delete_request.item_indices:
            raise HTTPException(status_code=400, detail="No items to delete")
        
        # 获取当前数据内容
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get(f"/api/user-data/{current_user['user_id']}/{data_id}")
            response.raise_for_status()
            data_info = response.json()
            
            file_content = data_info.get("file_content", "")
            if not file_content:
                raise HTTPException(status_code=404, detail="Data content not found")
            
            # 解析JSONL内容
            data_items = []
            for line in file_content.split("\n"):
                line = line.strip()
                if line:
                    data_items.append(json.loads(line))
            
            # 验证索引并排序（从大到小删除，避免索引变化）
            item_indices = sorted(set(delete_request.item_indices), reverse=True)
            for idx in item_indices:
                if idx < 0 or idx >= len(data_items):
                    raise HTTPException(status_code=400, detail=f"Invalid item index: {idx}")
            
            # 删除指定索引的数据项（从后往前删除）
            deleted_count = 0
            for idx in item_indices:
                data_items.pop(idx)
                deleted_count += 1
            
            # 将修改后的数据转换回JSONL格式
            updated_content = "\n".join(json.dumps(item, ensure_ascii=False) for item in data_items)
            
            # 更新数据库
            update_response = client.put(f"/api/user-data/{current_user['user_id']}/{data_id}/content", json={
                "file_content": updated_content
            })
            update_response.raise_for_status()
            
            return {
                "message": "Items deleted successfully",
                "deleted_count": deleted_count
            }
            
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Database service error: {e.response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete items: {str(e)}")


@app.post("/api/user/data/{data_id}/items")
async def add_single_item(data_id: int, add_request: AddItemRequest,
                          current_user: Dict = Depends(get_current_user)):
    """添加单条数据"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        # 验证新数据项格式
        if not isinstance(add_request.new_item, dict):
            raise HTTPException(status_code=400, detail="Invalid item format")
        
        # 获取当前数据内容
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get(f"/api/user-data/{current_user['user_id']}/{data_id}")
            response.raise_for_status()
            data_info = response.json()
            
            file_content = data_info.get("file_content", "")
            
            # 解析JSONL内容
            data_items = []
            if file_content:
                for line in file_content.split("\n"):
                    line = line.strip()
                    if line:
                        data_items.append(json.loads(line))
            
            # 添加新数据项到末尾
            data_items.append(add_request.new_item)
            
            # 将修改后的数据转换回JSONL格式
            updated_content = "\n".join(json.dumps(item, ensure_ascii=False) for item in data_items)
            
            # 更新数据库
            update_response = client.put(f"/api/user-data/{current_user['user_id']}/{data_id}/content", json={
                "file_content": updated_content
            })
            update_response.raise_for_status()
            
            return {
                "message": "Item added successfully",
                "added_count": 1,
                "new_index": len(data_items) - 1
            }
            
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Database service error: {e.response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to add item: {str(e)}")


@app.post("/api/user/data/{data_id}/append")
async def append_data_file(data_id: int, file: UploadFile = File(...),
                           current_user: Dict = Depends(get_current_user)):
    """导入并追加CSV或JSONL数据到现有数据后面"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        # 验证文件格式
        if not file.filename.endswith(".jsonl") and not file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only .jsonl and .csv files are supported")
        
        new_items = []
        
        if file.filename.endswith(".jsonl"):
            # JSONL文件直接解析
            content = await file.read()
            file_content = content.decode('utf-8')
            
            # 解析JSONL内容
            lines = file_content.strip().split('\n')
            for line in lines:
                line = line.strip()
                if line:
                    try:
                        new_items.append(json.loads(line))
                    except json.JSONDecodeError as e:
                        raise HTTPException(status_code=400, detail=f"Invalid JSONL format: {str(e)}")
        
        elif file.filename.endswith(".csv"):
            # CSV文件需要先转换为JSONL
            from .csv_to_jsonl import convert_csv_to_jsonl_in_memory
            
            csv_content = (await file.read()).decode('utf-8-sig')
            
            # 转换CSV并验证
            jsonl_data, validation_info = convert_csv_to_jsonl_in_memory(csv_content)
            
            # 检查转换是否成功
            if validation_info["errors"]:
                error_msg = "CSV转换失败: " + "; ".join(validation_info["errors"])
                raise HTTPException(status_code=400, detail=error_msg)
            
            new_items = jsonl_data
        
        if not new_items:
            raise HTTPException(status_code=400, detail="No valid data items found in file")
        
        # 获取当前数据内容
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get(f"/api/user-data/{current_user['user_id']}/{data_id}")
            response.raise_for_status()
            data_info = response.json()
            
            file_content = data_info.get("file_content", "")
            
            # 解析现有JSONL内容
            data_items = []
            if file_content:
                for line in file_content.split("\n"):
                    line = line.strip()
                    if line:
                        data_items.append(json.loads(line))
            
            # 追加新数据项到末尾
            data_items.extend(new_items)
            
            # 将修改后的数据转换回JSONL格式
            updated_content = "\n".join(json.dumps(item, ensure_ascii=False) for item in data_items)
            
            # 更新数据库
            update_response = client.put(f"/api/user-data/{current_user['user_id']}/{data_id}/content", json={
                "file_content": updated_content
            })
            update_response.raise_for_status()
            
            return {
                "message": "Data appended successfully",
                "added_count": len(new_items),
                "total_count": len(data_items)
            }
            
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Database service error: {e.response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to append data: {str(e)}")


@app.get("/api/data-files")
async def get_data_files(current_user: Dict = Depends(get_current_user)):
    """获取当前用户的数据文件列表（仅用户上传的文件）"""
    files = []
    
    # 用户上传的数据文件（从数据库获取）
    user_data_list = db.get_user_data_list(current_user["user_id"])
    for data in user_data_list:
        files.append({
            "id": data["id"],
            "name": data["filename"],
            "size": data.get("file_size", 0),
            "type": "user",
            "description": data.get("description", "")
        })
    
    return {"data_files": files}


@app.get("/api/reports")
async def get_reports(current_user: Dict = Depends(get_current_user)):
    """获取当前用户的评测报告列表"""
    reports = db.get_user_reports(current_user["user_id"])
    return {"reports": reports}


@app.get("/api/reports/detail")
async def get_report_detail(dataset: str, model: str, current_user: Dict = Depends(get_current_user)):
    """获取指定报告的详细信息"""
    try:
        # URL 解码参数
        dataset = unquote(dataset)
        model = unquote(model)
        
        # 从数据库获取报告
        report = db.get_user_report_by_path(current_user["user_id"], dataset, model)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found or access denied")
        
        # 返回报告内容
        # 确保返回的是JSON对象而不是字符串
        if isinstance(report["report_content"], str):
            try:
                return json.loads(report["report_content"])
            except json.JSONDecodeError:
                # 如果解析失败，返回原始字符串
                return report["report_content"]
        else:
            return report["report_content"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: int, current_user: Dict = Depends(get_current_user)):
    """删除报告"""
    success = db.delete_user_report(current_user["user_id"], report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or access denied")
    return {"message": "Report deleted successfully"}


@app.post("/api/evaluate")
async def start_evaluation(config: EvaluationConfig, background_tasks: BackgroundTasks, 
                           current_user: Dict = Depends(get_current_user)):
    """启动评测任务"""
    try:
        task_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 验证数据文件存在
        data_filename = ""
        
        if config.data_file:
            # 用户文件，验证数据存在
            try:
                data_id = int(config.data_file)
                user_data = db.get_user_data_by_id(current_user["user_id"], data_id)
                if not user_data:
                    raise HTTPException(status_code=404, detail="Data file not found")
                data_filename = user_data["filename"]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid data file ID")
        else:
            raise HTTPException(status_code=400, detail="Data file is required")
        
        # 构建命令行参数（不再需要临时文件和临时报告目录）
        # 读取配置文件获取数据库服务URL
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        cmd = [
            sys.executable, str(PROJECT_ROOT / "main.py"),
            "--api_urls", *config.api_urls,
            "--model", config.model,
            "--data_id", str(data_id),
            "--scoring", config.scoring,
            "--scoring_module", config.scoring_module,
            "--max_workers", str(config.max_workers),
            "--badcase_threshold", str(config.badcase_threshold),
            "--report_format", config.report_format,
            "--role", config.role,
            "--timeout", str(config.timeout),
            "--max-tokens", str(config.max_tokens),
            "--api_key", config.api_key,
            "--temperature", str(config.temperature if config.temperature is not None else 0.0),
            "--top-p", str(config.top_p if config.top_p is not None else 1.0),
            "--output_json",
            "--user_id", str(current_user["user_id"]),
            "--task_id", task_id,
            "--database_service_url", database_service_url,
        ]
        
        # is_vllm 只有在为 True 时才添加
        if config.is_vllm:
            cmd.append("--is_vllm")
        
        if config.test_mode:
            cmd.append("--test-mode")
        
        if config.sample_size > 0:
            cmd.extend(["--sample-size", str(config.sample_size)])
        
        if config.checkpoint_path:
            cmd.extend(["--checkpoint_path", config.checkpoint_path])
            cmd.extend(["--checkpoint_interval", str(config.checkpoint_interval)])
        
        if config.resume:
            cmd.append("--resume")
        
        # 创建数据库任务记录
        db.create_user_task(
            user_id=current_user["user_id"],
            task_id=task_id,
            config=config.dict()
        )
        
        # 在后台运行任务
        background_tasks.add_task(
            run_evaluation_task, 
            task_id, 
            cmd, 
            current_user["user_id"],
            data_filename
        )
        
        return {
            "task_id": task_id,
            "status": "pending",
            "message": "Evaluation task created"
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def run_evaluation_task(task_id: str, cmd: List[str], user_id: int, data_filename: str):
    """在后台运行评测任务（同步函数，由 BackgroundTasks 在线程池中执行）"""
    import re
    
    def update_task(updates: dict):
        """更新任务状态（仅SQL数据库）"""
        db.update_user_task(task_id, updates)
    
    try:
        update_task({"status": "running", "message": "Evaluation in progress..."})
        
        # 使用 subprocess 运行任务
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            cwd=str(PROJECT_ROOT),
            text=True,
            bufsize=1,  # 行缓冲，确保实时输出
            universal_newlines=True
        )
        
        # 保存进程对象以便取消
        with processes_lock:
            running_processes[task_id] = process
        
        # 读取输出并实时更新进度
        # 使用 deque 限制大小，自动丢弃旧元素，避免内存无限增长

        process.wait()
        
        # 清理进程对象
        with processes_lock:
            if task_id in running_processes:
                del running_processes[task_id]
        
        if process.returncode == 0:
            # 任务成功，报告已由main.py通过generate_report保存到数据库
            # 不再重复保存，避免生成重复报告

            update_task({
                "status": "completed",
                "progress": 100.0,
                "message": "Evaluation completed successfully",
            })
        else:
            update_task({
                "status": "failed",
                "message": f"Evaluation failed with return code {process.returncode}",
            })
        
    except Exception as e:
        update_task({"status": "failed", "message": str(e)})
        # 清理进程对象
        with processes_lock:
            if task_id in running_processes:
                del running_processes[task_id]


@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str, current_user: Dict = Depends(get_current_user)):
    """获取任务状态"""
    # 直接从数据库查询
    task = db.get_user_task_by_id(current_user["user_id"], task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
    return task


@app.get("/api/tasks")
async def get_all_tasks(current_user: Dict = Depends(get_current_user)):
    """获取当前用户的所有任务列表"""
    # 直接从数据库获取所有任务
    tasks = db.get_user_tasks(current_user["user_id"])
    return {"tasks": tasks}


@app.delete("/api/tasks/{task_id}")
async def delete_or_cancel_task(task_id: str, current_user: Dict = Depends(get_current_user)):
    """删除或取消任务"""
    # 验证任务存在且属于当前用户
    task = db.get_user_task_by_id(current_user["user_id"], task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
    
    # 如果任务正在运行，先终止进程
    with processes_lock:
        if task_id in running_processes:
            process = running_processes[task_id]
            if process.poll() is None:  # 进程还在运行
                process.terminate()
                # 更新状态为取消
                db.update_user_task(task_id, {
                    "status": "cancelled",
                    "message": "Task cancelled by user"
                })
            del running_processes[task_id]
    
    # 删除任务记录
    success = db.delete_user_task(current_user["user_id"], task_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete task")
    
    return {"message": "Task deleted successfully"}


@app.put("/api/tasks/{task_id}")
async def update_task_info(task_id: str, updates: Dict[str, Any], current_user: Dict = Depends(get_current_user)):
    """编辑任务信息（仅允许修改 message 字段）"""
    # 验证任务存在且属于当前用户
    task = db.get_user_task_by_id(current_user["user_id"], task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
    
    # 只允许编辑 message 字段
    allowed_fields = {"message"}
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not filtered_updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # 更新任务
    success = db.update_user_task(task_id, filtered_updates)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update task")
    
    return {"message": "Task updated successfully"}


# ==================== 管理员接口 ====================

@app.get("/api/admin/users")
async def admin_get_users(current_user: Dict = Depends(get_current_admin_user)):
    """管理员获取所有用户"""
    users = db.get_all_users()
    return {"users": users}


@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: int, current_user: Dict = Depends(get_current_admin_user)):
    """管理员删除用户"""
    if user_id == current_user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete self")
    
    success = db.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 清理该用户正在运行的进程
    # 注意：这里可能需要从数据库查询该用户所有正在运行的任务ID
    # 简单起见，后续迭代再优化，目前依赖定期清理或用户任务状态更新
    
    return {"message": "User deleted successfully"}


@app.get("/api/admin/tasks")
async def admin_get_all_tasks(current_user: Dict = Depends(get_current_admin_user)):
    """管理员获取所有任务"""
    tasks = db.get_all_tasks_global()
    return {"tasks": tasks}


@app.post("/api/admin/tasks/{task_id}/terminate")
async def admin_terminate_task(task_id: str, current_user: Dict = Depends(get_current_admin_user)):
    """管理员终止任务"""
    # 尝试终止进程
    with processes_lock:
        if task_id in running_processes:
            process = running_processes[task_id]
            if process.poll() is None:
                process.terminate()
            del running_processes[task_id]
            
            # 更新状态
            db.update_user_task(task_id, {
                "status": "cancelled",
                "message": "Task terminated by admin"
            })
            return {"message": "Task terminated successfully"}
    
    # 如果进程不在内存中（可能重启过），尝试直接从数据库获取任务并标记为取消
    # 但我们不能确定进程是否真的还在跑（如果是多worker部署），这里假设单机
    # 为了安全，只更新数据库状态
    task = db.get_user_task_by_id(current_user["user_id"], task_id) # 这里有个小问题，admin需不需要传user_id查任务？
    # 实际上 database_client GET task 需要 user_id，但 update 不需要
    # 修改：直接 update
    
    db.update_user_task(task_id, {
        "status": "cancelled",
        "message": "Task marked as cancelled by admin"
    })
    
    return {"message": "Task marked as cancelled"}


@app.get("/api/admin/data")
async def admin_get_all_data(current_user: Dict = Depends(get_current_admin_user)):
    """管理员获取所有数据文件"""
    data = db.get_all_data_global()
    return {"data": data}


@app.delete("/api/admin/users/{user_id}/data/{data_id}")
async def admin_delete_user_data(user_id: int, data_id: int, current_user: Dict = Depends(get_current_admin_user)):
    """管理员删除用户数据"""
    success = db.delete_user_data(user_id, data_id)
    if not success:
        raise HTTPException(status_code=404, detail="Data file not found")
    return {"message": "Data file deleted successfully"}


# ==================== 管理员模型配置接口 ====================

@app.get("/api/admin/model-configs")
async def admin_get_model_configs(current_user: Dict = Depends(get_current_admin_user)):
    """管理员获取所有模型配置"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get("/api/model-configs", params={"include_inactive": "true"})
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        print(f"[ERROR] Database service returned {e.response.status_code}: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Database service error: {e.response.text}")
    except Exception as e:
        print(f"[ERROR] Failed to get model configs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get model configs: {str(e)}")


@app.post("/api/admin/model-configs")
async def admin_create_model_config(config: Dict[str, Any], current_user: Dict = Depends(get_current_admin_user)):
    """管理员创建模型配置"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.post("/api/model-configs", json=config)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/admin/model-configs/{config_id}")
async def admin_update_model_config(config_id: int, updates: Dict[str, Any], current_user: Dict = Depends(get_current_admin_user)):
    """管理员更新模型配置"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.put(f"/api/model-configs/{config_id}", json=updates)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/model-configs/{config_id}")
async def admin_delete_model_config(config_id: int, current_user: Dict = Depends(get_current_admin_user)):
    """管理员删除模型配置"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.delete(f"/api/model-configs/{config_id}")
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/model-configs")
async def get_available_model_configs(current_user: Dict = Depends(get_current_user)):
    """获取所有可用的模型配置（普通用户）"""
    try:
        import httpx
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        database_service_url = yaml_config['web_service']['database_service_url']
        
        with httpx.Client(base_url=database_service_url, timeout=30.0) as client:
            response = client.get("/api/model-configs", params={"include_inactive": False})
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Redis 连接和模型调用代理接口 ====================

# 全局 Redis 客户端
_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    """获取 Redis 客户端（懒加载）"""
    global _redis_client
    if _redis_client is None:
        config_path = Path(__file__).parent.parent.parent / "config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            yaml_config = yaml.safe_load(f)
        
        redis_config = yaml_config.get('redis_service', {})
        redis_host = redis_config.get('host', 'localhost')
        redis_port = redis_config.get('port', 6379)
        redis_db = redis_config.get('db', 0)
        
        logger.info(f"[Redis] 初始化Redis客户端: {redis_host}:{redis_port}/{redis_db}")
        
        _redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            decode_responses=True
        )
        
        # 测试连接
        try:
            _redis_client.ping()
            logger.info(f"[Redis] Redis连接成功: {redis_host}:{redis_port}/{redis_db}")
        except redis.ConnectionError as e:
            logger.error(f"[Redis] Redis连接失败: {e}")
            raise
    
    return _redis_client


def get_model_max_concurrency(model_name: str) -> int:
    """获取模型的最大并发数"""
    import httpx
    config_path = Path(__file__).parent.parent.parent / "config.yaml"
    with open(config_path, 'r', encoding='utf-8') as f:
        yaml_config = yaml.safe_load(f)
    database_service_url = yaml_config['web_service']['database_service_url']
    
    try:
        with httpx.Client(base_url=database_service_url, timeout=10.0) as client:
            response = client.get(f"/api/model-configs/by-name/{model_name}")
            if response.status_code == 200:
                config = response.json()
                max_concurrency = config.get('max_concurrency', 10)
                logger.debug(f"[Redis] 模型 {model_name} 最大并发数: {max_concurrency}")
                return max_concurrency
    except Exception as e:
        logger.warning(f"[Redis] 获取模型配置失败 {model_name}: {e}")
    default_concurrency = 10
    logger.info(f"[Redis] 使用默认并发数 {default_concurrency} (模型: {model_name})")
    return default_concurrency


class ModelCallRequest(BaseModel):
    """模型调用请求"""
    api_url: str
    api_key: str
    messages: List[Dict[str, str]]
    model: str
    temperature: float = 0.0
    max_tokens: int = 8192
    timeout: int = 300
    is_vllm: bool = False
    top_p: float = 1.0


class ModelCallResponse(BaseModel):
    """模型调用响应"""
    success: bool
    content: str = ""
    error: str = ""


def _model_call_sync(request: ModelCallRequest) -> ModelCallResponse:
    """
    同步执行模型调用（在线程池中运行）
    """
    # 读取配置
    config_path = Path(__file__).parent.parent.parent / "config.yaml"
    with open(config_path, 'r', encoding='utf-8') as f:
        yaml_config = yaml.safe_load(f)
    
    redis_config = yaml_config.get('redis_service', {})
    max_wait_time = redis_config.get('max_wait_time', 300)  # 最大等待300秒
    
    model_name = request.model
    redis_key = f"model_concurrency:{model_name}"
    
    # 获取模型的最大并发数
    max_concurrency = get_model_max_concurrency(model_name)
    
    # Lua 脚本：原子性地检查并增加计数器
    # 返回值：1 表示成功获取槽位，0 表示并发已满
    acquire_slot_script = """
    local current = tonumber(redis.call('GET', KEYS[1]) or '0')
    local max_concurrency = tonumber(ARGV[1])
    if current < max_concurrency then
        redis.call('INCR', KEYS[1])
        redis.call('EXPIRE', KEYS[1], 3600)
        return 1
    else
        return 0
    end
    """
    
    try:
        redis_client = get_redis_client()
        
        # 注册 Lua 脚本
        try_acquire = redis_client.register_script(acquire_slot_script)
        
        # 尝试获取锁（等待直到获取到或超时）
        start_time = time.time()
        acquired = False
        wait_iterations = 0
        
        while time.time() - start_time < max_wait_time:
            # 使用 Lua 脚本原子性地尝试获取槽位
            result = try_acquire(keys=[redis_key], args=[max_concurrency])
            
            if result == 1:
                acquired = True
                current_count = redis_client.get(redis_key)
                current_count = int(current_count) if current_count else 1
                elapsed_time = time.time() - start_time
                if wait_iterations > 0:
                    logger.info(f"[Redis] 获取并发槽位成功: {model_name} (等待: {elapsed_time:.2f}秒, 当前并发: {current_count}/{max_concurrency})")
                else:
                    logger.info(f"[Redis] 获取并发槽位成功: {model_name} (当前并发: {current_count}/{max_concurrency})")
                break
            
            # 等待一段时间后重试
            wait_iterations += 1
            if wait_iterations % 2 == 0:  # 每5秒记录一次等待状态
                current_count = redis_client.get(redis_key)
                current_count = int(current_count) if current_count else 0
                elapsed_time = time.time() - start_time
                logger.info(f"[Redis] 等待并发槽位: {model_name} (已等待: {elapsed_time:.1f}秒, 当前并发: {current_count}/{max_concurrency})")
            time.sleep(2.5)
        
        if not acquired:
            elapsed_time = time.time() - start_time
            error_msg = f"等待超时（{elapsed_time:.1f}秒），模型 {model_name} 并发数已达上限 {max_concurrency}"
            logger.error(f"[Redis] {error_msg}")
            return ModelCallResponse(
                success=False,
                error=error_msg
            )
        
        # 执行模型调用
        try:
            if request.is_vllm:
                result = call_vllm_api_sync(
                    api_url=request.api_url,
                    messages=request.messages,
                    model=request.model,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    timeout=request.timeout,
                    top_p=request.top_p
                )
            else:
                result = call_openai_api_sync(
                    api_url=request.api_url,
                    api_key=request.api_key,
                    messages=request.messages,
                    model=request.model,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    timeout=request.timeout,
                    top_p=request.top_p
                )
            
            return ModelCallResponse(success=True, content=result)
        
        finally:
            # 释放并发计数
            new_count = redis_client.decr(redis_key)
            # 如果计数变为0或负数，删除key
            if new_count <= 0:
                redis_client.delete(redis_key)
                logger.info(f"[Redis] 释放并发槽位并删除key: {model_name} (剩余并发: 0)")
            else:
                logger.info(f"[Redis] 释放并发槽位: {model_name} (剩余并发: {new_count}/{max_concurrency})")
    
    except redis.ConnectionError as e:
        logger.error(f"[Redis] Redis连接错误: {e}")
        logger.warning(f"[Redis] Redis不可用，回退到直接调用模式 (模型: {model_name})")
        # Redis 不可用时，直接调用（不限流）
        try:
            if request.is_vllm:
                result = call_vllm_api_sync(
                    api_url=request.api_url,
                    messages=request.messages,
                    model=request.model,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    timeout=request.timeout,
                    top_p=request.top_p
                )
            else:
                result = call_openai_api_sync(
                    api_url=request.api_url,
                    api_key=request.api_key,
                    messages=request.messages,
                    model=request.model,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    timeout=request.timeout,
                    top_p=request.top_p
                )
            return ModelCallResponse(success=True, content=result)
        except Exception as call_error:
            logger.error(f"[Redis] 直接调用失败: {call_error}")
            return ModelCallResponse(success=False, error=str(call_error))
    
    except Exception as e:
        logger.error(f"[Redis] 模型调用异常: {model_name}, 错误: {e}")
        return ModelCallResponse(success=False, error=str(e))


@app.post("/api/model-call", response_model=ModelCallResponse)
async def model_call_with_rate_limit(request: ModelCallRequest):
    """
    带流量控制的模型调用代理接口
    使用 Redis 进行并发计数和限流
    当并发超过限制时，最多等待 max_wait_time 秒
    
    注意：使用 asyncio.to_thread 在线程池中执行同步阻塞操作，
    避免阻塞 FastAPI 事件循环，确保多个请求可以真正并发执行
    """
    import asyncio
    # 在线程池中执行同步操作，不阻塞事件循环
    return await asyncio.to_thread(_model_call_sync, request)


def call_vllm_api_sync(
    api_url: str,
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.0,
    max_tokens: int = 8192,
    timeout: int = 600,
    top_p: float = 1.0,
) -> str:
    """同步调用vllm API"""
    import requests
    
    do_sample = temperature > 0.0
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "top_p": top_p,
        "max_tokens": max_tokens,
        "stream": True,
        "do_sample": do_sample,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    
    base_url = api_url.rstrip('/')
    endpoint = "/chat/completions"
    if not base_url.endswith('/v1'):
        base_url += '/v1'
    full_url = f"{base_url}{endpoint}"
    
    full_response = ""
    
    with requests.post(
        full_url,
        json=payload,
        headers={"Content-Type": "application/json"},
        stream=True,
        timeout=timeout
    ) as response:
        response.raise_for_status()
        
        for line in response.iter_lines():
            if not line:
                continue
            line = line.decode('utf-8').strip()
            if line.startswith("data: "):
                data_str = line[6:]
                if data_str == "[DONE]":
                    return full_response.strip()
                try:
                    data = json.loads(data_str)
                    delta = data["choices"][0]["delta"].get("content", "")
                    if delta:
                        full_response += delta
                except (KeyError, json.JSONDecodeError):
                    continue
        
        return full_response.strip()


def call_openai_api_sync(
    api_url: str,
    api_key: str,
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.0,
    max_tokens: int = 16384,
    timeout: int = 300,
    top_p: float = 1.0,
) -> str:
    """同步调用OpenAI兼容API"""
    import openai
    
    client = openai.OpenAI(
        api_key=api_key,
        base_url=api_url,
        timeout=timeout,
        max_retries=0
    )
    
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens
    )
    
    return response.choices[0].message.content.strip()


@app.get("/api/model-call/status/{model_name}")
async def get_model_concurrency_status(model_name: str):
    """获取模型当前并发状态"""
    try:
        redis_client = get_redis_client()
        redis_key = f"model_concurrency:{model_name}"
        current_count = redis_client.get(redis_key)
        current_count = int(current_count) if current_count else 0
        max_concurrency = get_model_max_concurrency(model_name)
        
        return {
            "model": model_name,
            "current_concurrency": current_count,
            "max_concurrency": max_concurrency,
            "available_slots": max(0, max_concurrency - current_count)
        }
    except redis.ConnectionError:
        return {
            "model": model_name,
            "current_concurrency": 0,
            "max_concurrency": 0,
            "error": "Redis connection failed"
        }


if __name__ == "__main__":
    # 读取配置文件
    config_path = Path(__file__).parent.parent.parent / "config.yaml"
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    web_config = config['web_service']
    
    print("="*60)
    print("🌐 Starting Web API Service")
    print("="*60)
    print(f"📊 Service: LLM Judge Web API")
    print(f"🌐 URL: http://{web_config['host']}:{web_config['port']}")
    print(f"📖 Docs: http://{web_config['host']}:{web_config['port']}/docs")
    print(f"💾 Database Service: {web_config['database_service_url']}")
    print("="*60)
    
    uvicorn.run(
        "app:app",
        host=web_config['host'],
        port=web_config['port'],
        reload=True
    )
