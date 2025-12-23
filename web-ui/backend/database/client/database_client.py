#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库API客户端
用于调用独立的数据库服务API
"""

import httpx
import time
import logging
from typing import Optional, List, Dict, Any, Callable, TypeVar
from functools import wraps
import yaml
from pathlib import Path

logger = logging.getLogger(__name__)

# 读取配置文件
# 使用更可靠的路径查找方式
# 从当前文件位置向上查找配置文件
current_path = Path(__file__).resolve()
config_path = current_path.parent / "config.yaml"
if not config_path.exists():
    config_path = current_path.parent.parent / "config.yaml"
if not config_path.exists():
    config_path = current_path.parent.parent.parent / "config.yaml"
if not config_path.exists():
    config_path = current_path.parent.parent.parent.parent / "config.yaml"

if not config_path.exists():
    # 如果以上方式都找不到，尝试从项目根目录查找
    project_root = current_path.parent.parent.parent.parent
    config_path = project_root / "web-ui" / "config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found at {config_path}")
    
with open(config_path, 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

# 数据库服务地址
DATABASE_SERVICE_URL = config['web_service']['database_service_url']

# 创建全局同步客户端（用于同步调用）
# 配置连接池参数，使其更快地检测和关闭失效连接
_sync_client: Optional[httpx.Client] = None

def get_sync_client() -> httpx.Client:
    """获取或创建同步客户端（懒加载，带连接失效时自动重建）"""
    global _sync_client
    if _sync_client is None:
        _sync_client = httpx.Client(
            base_url=DATABASE_SERVICE_URL, 
            timeout=30.0,
            # 配置连接池参数
            limits=httpx.Limits(
                max_keepalive_connections=5,
                max_connections=10,
                keepalive_expiry=30.0  # 连接保活时间（秒），超时后关闭
            )
        )
    return _sync_client

def reset_sync_client():
    """重置同步客户端（当连接出错时调用）"""
    global _sync_client
    if _sync_client is not None:
        try:
            _get_sync_client().close()
        except Exception:
            pass
        _sync_client = None
    logger.debug("[DB Client] 已重置 HTTP 客户端连接池")


T = TypeVar('T')

def with_retry(max_retries: int = 2, retry_delay: float = 0.5):
    """
    装饰器：为 HTTP 请求添加连接错误重试机制
    当发生 ConnectionError 或 ReadError 时，会重置连接池并重试
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_error = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (httpx.ConnectError, httpx.ReadError, httpx.RemoteProtocolError) as e:
                    last_error = e
                    if attempt < max_retries:
                        logger.warning(f"[DB Client] 连接错误 (尝试 {attempt + 1}/{max_retries + 1}): {e}, 正在重试...")
                        reset_sync_client()  # 重置连接池
                        time.sleep(retry_delay)
                    else:
                        logger.error(f"[DB Client] 连接失败，已重试 {max_retries} 次: {e}")
                        raise
            raise last_error  # 不应该到这里
        return wrapper
    return decorator

# 注意：删除了未使用的 async_client，避免资源浪费


# ==================== 用户相关API ====================

def create_user(username: str, password: str, email: Optional[str] = None) -> Optional[int]:
    """创建用户"""
    try:
        response = get_sync_client().post("/api/users", json={
            "username": username,
            "password": password,
            "email": email
        })
        response.raise_for_status()
        return response.json()["user_id"]
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            return None
        raise


def verify_user(username: str, password: str) -> Optional[Dict]:
    """验证用户登录"""
    try:
        response = get_sync_client().post("/api/users/verify", json={
            "username": username,
            "password": password
        })
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            return None
        raise


def get_user_by_id(user_id: int) -> Optional[Dict]:
    """获取用户信息"""
    try:
        response = get_sync_client().get(f"/api/users/{user_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def get_all_users() -> List[Dict]:
    """获取所有用户列表（管理员）"""
    response = get_sync_client().get("/api/users")
    response.raise_for_status()
    return response.json()["users"]


def delete_user(user_id: int) -> bool:
    """删除用户（管理员）"""
    try:
        response = get_sync_client().delete(f"/api/users/{user_id}")
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


# ==================== 用户数据相关API ====================

def create_user_data(user_id: int, filename: str, file_content: str, description: str = "") -> int:
    """创建用户数据"""
    response = get_sync_client().post("/api/user-data", json={
        "user_id": user_id,
        "filename": filename,
        "file_content": file_content,
        "description": description
    })
    response.raise_for_status()
    return response.json()["data_id"]


@with_retry()
def get_user_data_list(user_id: int) -> List[Dict]:
    """获取用户数据列表"""
    try:
        response = get_sync_client().get(f"/api/user-data/list/{user_id}")
        response.raise_for_status()
        data = response.json()["data"]
        print(f"[DEBUG] Database: User {user_id} has {len(data)} data files")
        return data
    except httpx.HTTPStatusError as e:
        print(f"[ERROR] Database API error for user {user_id}: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 404:
            # 如果是404，返回空列表（表示没有数据）
            return []
        raise
    except Exception as e:
        print(f"[ERROR] Failed to get user data list: {str(e)}")
        raise


@with_retry()
def get_all_data_global() -> List[Dict]:
    """获取所有用户数据列表（管理员）"""
    response = get_sync_client().get("/api/user-data/all")
    response.raise_for_status()
    return response.json()["data"]



def get_user_data_by_id(user_id: int, data_id: int) -> Optional[Dict]:
    """获取用户数据详情"""
    try:
        response = get_sync_client().get(f"/api/user-data/{user_id}/{data_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def update_user_data(user_id: int, data_id: int, description: str) -> bool:
    """更新用户数据"""
    try:
        response = get_sync_client().put(f"/api/user-data/{user_id}/{data_id}", json={
            "description": description
        })
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


def delete_user_data(user_id: int, data_id: int) -> bool:
    """删除用户数据"""
    try:
        response = get_sync_client().delete(f"/api/user-data/{user_id}/{data_id}")
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


# ==================== 用户任务相关API ====================

def create_user_task(user_id: int, task_id: str, config: Dict) -> int:
    """创建用户任务"""
    response = get_sync_client().post("/api/user-tasks", json={
        "user_id": user_id,
        "task_id": task_id,
        "config": config
    })
    response.raise_for_status()
    return response.json()["task_row_id"]


def update_user_task(task_id: str, updates: Dict) -> bool:
    """更新用户任务"""
    try:
        response = get_sync_client().put(f"/api/user-tasks/{task_id}", json={
            "updates": updates
        })
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


@with_retry()
def get_user_tasks(user_id: int) -> List[Dict]:
    """获取用户所有任务"""
    response = get_sync_client().get(f"/api/user-tasks/list/{user_id}")
    response.raise_for_status()
    return response.json()["tasks"]


@with_retry()
def get_all_tasks_global() -> List[Dict]:
    """获取所有用户任务（管理员）"""
    response = get_sync_client().get("/api/user-tasks/all")
    response.raise_for_status()
    return response.json()["tasks"]


def get_user_task_by_id(user_id: int, task_id: str) -> Optional[Dict]:
    """获取用户指定任务"""
    try:
        response = get_sync_client().get(f"/api/user-tasks/{user_id}/{task_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def delete_user_task(user_id: int, task_id: str) -> bool:
    """删除用户任务"""
    try:
        response = get_sync_client().delete(f"/api/user-tasks/{user_id}/{task_id}")
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


# ==================== 用户报告相关API ====================

def create_user_report(user_id: int, task_id: str, dataset: str, model: str, 
                       report_content: str, timestamp: str, summary: Dict) -> int:
    """创建用户报告"""
    response = get_sync_client().post("/api/user-reports", json={
        "user_id": user_id,
        "task_id": task_id,
        "dataset": dataset,
        "model": model,
        "report_content": report_content,
        "timestamp": timestamp,
        "summary": summary
    })
    response.raise_for_status()
    return response.json()["report_id"]


@with_retry()
def get_user_reports(user_id: int) -> List[Dict]:
    """获取用户所有报告"""
    response = get_sync_client().get(f"/api/user-reports/list/{user_id}")
    response.raise_for_status()
    return response.json()["reports"]


def get_user_report_by_id(user_id: int, report_id: int) -> Optional[Dict]:
    """获取用户指定报告"""
    try:
        response = get_sync_client().get(f"/api/user-reports/{user_id}/{report_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def get_user_report_by_path(user_id: int, dataset: str, model: str) -> Optional[Dict]:
    """根据dataset和model获取报告"""
    try:
        response = get_sync_client().get(f"/api/user-reports/by-path/{user_id}", params={
            "dataset": dataset,
            "model": model
        })
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def delete_user_report(user_id: int, report_id: int) -> bool:
    """删除用户报告"""
    try:
        response = get_sync_client().delete(f"/api/user-reports/{user_id}/{report_id}")
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


# ==================== 健康检查 ====================

@with_retry()
def health_check() -> Dict:
    """健康检查"""
    response = get_sync_client().get("/health")
    response.raise_for_status()
    return response.json()
