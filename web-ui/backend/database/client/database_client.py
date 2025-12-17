#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库API客户端
用于调用独立的数据库服务API
"""

import httpx
from typing import Optional, List, Dict, Any
import yaml
from pathlib import Path

# 读取配置文件
# 动态查找配置文件路径
config_path = Path(__file__).parent / "config.yaml"
if not config_path.exists():
    config_path = Path(__file__).parent.parent / "config.yaml"
if not config_path.exists():
    config_path = Path(__file__).parent.parent.parent / "config.yaml"
if not config_path.exists():
    config_path = Path(__file__).parent.parent.parent.parent / "config.yaml"

if not config_path.exists():
    raise FileNotFoundError(f"Configuration file not found at {config_path}")
    
with open(config_path, 'r', encoding='utf-8') as f:
    config = yaml.safe_load(f)

# 数据库服务地址
DATABASE_SERVICE_URL = config['web_service']['database_service_url']

# 创建全局同步客户端（用于同步调用）
# 注意：这个客户端会维护连接池，但 httpx 的连接池有上限，不会无限增长
sync_client = httpx.Client(base_url=DATABASE_SERVICE_URL, timeout=30.0)

# 注意：删除了未使用的 async_client，避免资源浪费


# ==================== 用户相关API ====================

def create_user(username: str, password: str, email: Optional[str] = None) -> Optional[int]:
    """创建用户"""
    try:
        response = sync_client.post("/api/users", json={
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
        response = sync_client.post("/api/users/verify", json={
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
        response = sync_client.get(f"/api/users/{user_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def get_all_users() -> List[Dict]:
    """获取所有用户列表（管理员）"""
    response = sync_client.get("/api/users")
    response.raise_for_status()
    return response.json()["users"]


def delete_user(user_id: int) -> bool:
    """删除用户（管理员）"""
    try:
        response = sync_client.delete(f"/api/users/{user_id}")
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


# ==================== 用户数据相关API ====================

def create_user_data(user_id: int, filename: str, file_content: str, description: str = "") -> int:
    """创建用户数据"""
    response = sync_client.post("/api/user-data", json={
        "user_id": user_id,
        "filename": filename,
        "file_content": file_content,
        "description": description
    })
    response.raise_for_status()
    return response.json()["data_id"]


def get_user_data_list(user_id: int) -> List[Dict]:
    """获取用户数据列表"""
    try:
        response = sync_client.get(f"/api/user-data/list/{user_id}")
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


def get_all_data_global() -> List[Dict]:
    """获取所有用户数据列表（管理员）"""
    response = sync_client.get("/api/user-data/all")
    response.raise_for_status()
    return response.json()["data"]



def get_user_data_by_id(user_id: int, data_id: int) -> Optional[Dict]:
    """获取用户数据详情"""
    try:
        response = sync_client.get(f"/api/user-data/{user_id}/{data_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def update_user_data(user_id: int, data_id: int, description: str) -> bool:
    """更新用户数据"""
    try:
        response = sync_client.put(f"/api/user-data/{user_id}/{data_id}", json={
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
        response = sync_client.delete(f"/api/user-data/{user_id}/{data_id}")
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


# ==================== 用户任务相关API ====================

def create_user_task(user_id: int, task_id: str, config: Dict) -> int:
    """创建用户任务"""
    response = sync_client.post("/api/user-tasks", json={
        "user_id": user_id,
        "task_id": task_id,
        "config": config
    })
    response.raise_for_status()
    return response.json()["task_row_id"]


def update_user_task(task_id: str, updates: Dict) -> bool:
    """更新用户任务"""
    try:
        response = sync_client.put(f"/api/user-tasks/{task_id}", json={
            "updates": updates
        })
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


def get_user_tasks(user_id: int) -> List[Dict]:
    """获取用户所有任务"""
    response = sync_client.get(f"/api/user-tasks/list/{user_id}")
    response.raise_for_status()
    return response.json()["tasks"]


def get_all_tasks_global() -> List[Dict]:
    """获取所有用户任务（管理员）"""
    response = sync_client.get("/api/user-tasks/all")
    response.raise_for_status()
    return response.json()["tasks"]


def get_user_task_by_id(user_id: int, task_id: str) -> Optional[Dict]:
    """获取用户指定任务"""
    try:
        response = sync_client.get(f"/api/user-tasks/{user_id}/{task_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def delete_user_task(user_id: int, task_id: str) -> bool:
    """删除用户任务"""
    try:
        response = sync_client.delete(f"/api/user-tasks/{user_id}/{task_id}")
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
    response = sync_client.post("/api/user-reports", json={
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


def get_user_reports(user_id: int) -> List[Dict]:
    """获取用户所有报告"""
    response = sync_client.get(f"/api/user-reports/list/{user_id}")
    response.raise_for_status()
    return response.json()["reports"]


def get_user_report_by_id(user_id: int, report_id: int) -> Optional[Dict]:
    """获取用户指定报告"""
    try:
        response = sync_client.get(f"/api/user-reports/{user_id}/{report_id}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise


def get_user_report_by_path(user_id: int, dataset: str, model: str) -> Optional[Dict]:
    """根据dataset和model获取报告"""
    try:
        response = sync_client.get(f"/api/user-reports/by-path/{user_id}", params={
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
        response = sync_client.delete(f"/api/user-reports/{user_id}/{report_id}")
        response.raise_for_status()
        return True
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return False
        raise


# ==================== 健康检查 ====================

def health_check() -> Dict:
    """健康检查"""
    response = sync_client.get("/health")
    response.raise_for_status()
    return response.json()
