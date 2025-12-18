#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
独立的数据库服务
提供RESTful API接口，供其他服务调用
端口：8081(默认)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import yaml
from pathlib import Path
import sys

# 添加当前模块目录到sys.path以便导入database模块
sys.path.insert(0, str(Path(__file__).parent))
# 直接从 database.py 模块导入（同一目录下）
try:
    # 先尝试相对导入
    from . import database as db_module
except ImportError:
    # 如果相对导入失败，使用绝对导入
    import importlib.util
    db_module_path = str(Path(__file__).parent / "database.py")
    spec = importlib.util.spec_from_file_location("database", db_module_path)
    db_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(db_module)

# 为了兼容性，创建db戲名
db = type('db', (), {})()
db.create_user = db_module.create_user
db.verify_user = db_module.verify_user
db.get_user_by_id = db_module.get_user_by_id
db.create_user_data = db_module.create_user_data
db.get_user_data_list = db_module.get_user_data_list
db.get_user_data_by_id = db_module.get_user_data_by_id
db.update_user_data = db_module.update_user_data
db.delete_user_data = db_module.delete_user_data
db.create_user_task = db_module.create_user_task
db.update_user_task = db_module.update_user_task
db.get_user_tasks = db_module.get_user_tasks
db.get_user_task_by_id = db_module.get_user_task_by_id
db.delete_user_task = db_module.delete_user_task
db.create_user_report = db_module.create_user_report
db.get_user_reports = db_module.get_user_reports
db.get_user_report_by_path = db_module.get_user_report_by_path
db.get_user_report_by_id = db_module.get_user_report_by_id
db.get_user_report_by_id = db_module.get_user_report_by_id
db.delete_user_report = db_module.delete_user_report

# 管理员功能
db.get_all_users = db_module.get_all_users
db.delete_user = db_module.delete_user
db.get_all_data_global = db_module.get_all_data_global
db.get_all_tasks_global = db_module.get_all_tasks_global

app = FastAPI(title="LLM Judge Database Service", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 数据模型 ====================

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserVerify(BaseModel):
    username: str
    password: str

class UserDataCreate(BaseModel):
    user_id: int
    filename: str
    file_content: str
    description: str = ""

class UserDataUpdate(BaseModel):
    description: str

class UserTaskCreate(BaseModel):
    user_id: int
    task_id: str
    config: Dict[str, Any]

class UserTaskUpdate(BaseModel):
    updates: Dict[str, Any]

class UserReportCreate(BaseModel):
    user_id: int
    task_id: str
    dataset: str
    model: str
    report_content: str
    timestamp: str
    summary: Dict[str, Any]


# ==================== 用户相关API ====================

@app.post("/api/users")
def create_user(user: UserCreate):
    """创建用户"""
    user_id = db.create_user(user.username, user.password, user.email)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Username already exists")
    return {"user_id": user_id, "message": "User created successfully"}


@app.post("/api/users/verify")
def verify_user(user: UserVerify):
    """验证用户登录"""
    user_info = db.verify_user(user.username, user.password)
    if user_info is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return user_info


    return user


@app.get("/api/users")
def get_all_users():
    """获取所有用户列表（管理员）"""
    return {"users": db.get_all_users()}


@app.delete("/api/users/{user_id}")
def delete_user(user_id: int):
    """删除用户（管理员）"""
    success = db.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found or delete failed")
    return {"message": "User deleted successfully"}


# ==================== 用户数据相关API ====================

@app.post("/api/user-data")
def create_user_data(data: UserDataCreate):
    """创建用户数据"""
    data_id = db.create_user_data(
        user_id=data.user_id,
        filename=data.filename,
        file_content=data.file_content,
        description=data.description
    )
    return {"data_id": data_id, "message": "Data created successfully"}


@app.get("/api/user-data/all")
def get_all_data_global():
    """获取所有用户数据列表（管理员）"""
    data = db.get_all_data_global()
    return {"data": data}


@app.get("/api/user-data/list/{user_id}")
def get_user_data_list(user_id: int):
    """获取用户数据列表"""
    data_list = db.get_user_data_list(user_id)
    return {"data": data_list}


@app.get("/api/user-data/{user_id}/{data_id}")
def get_user_data(user_id: int, data_id: int):
    """获取用户数据详情"""
    data = db.get_user_data_by_id(user_id, data_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return data


@app.put("/api/user-data/{user_id}/{data_id}")
def update_user_data(user_id: int, data_id: int, updates: UserDataUpdate):
    """更新用户数据"""
    success = db.update_user_data(user_id, data_id, updates.description)
    if not success:
        raise HTTPException(status_code=404, detail="Data not found or update failed")
    return {"message": "Data updated successfully"}


@app.delete("/api/user-data/{user_id}/{data_id}")
def delete_user_data(user_id: int, data_id: int):
    """删除用户数据"""
    success = db.delete_user_data(user_id, data_id)
    if not success:
        raise HTTPException(status_code=404, detail="Data not found or delete failed")
    return {"message": "Data deleted successfully"}


# ==================== 用户任务相关API ====================

@app.post("/api/user-tasks")
def create_user_task(task: UserTaskCreate):
    """创建用户任务"""
    task_row_id = db.create_user_task(
        user_id=task.user_id,
        task_id=task.task_id,
        config=task.config
    )
    return {"task_row_id": task_row_id, "message": "Task created successfully"}


@app.put("/api/user-tasks/{task_id}")
def update_user_task(task_id: str, update: UserTaskUpdate):
    """更新用户任务"""
    success = db.update_user_task(task_id, update.updates)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or update failed")
    return {"message": "Task updated successfully"}


@app.get("/api/user-tasks/list/{user_id}")
def get_user_tasks(user_id: int):
    """获取用户所有任务"""
    tasks = db.get_user_tasks(user_id)
    return {"tasks": tasks}


@app.get("/api/user-tasks/all")
def get_all_tasks_global():
    """获取所有用户任务（管理员）"""
    tasks = db.get_all_tasks_global()
    return {"tasks": tasks}


@app.get("/api/user-tasks/{user_id}/{task_id}")
def get_user_task(user_id: int, task_id: str):
    """获取用户指定任务"""
    task = db.get_user_task_by_id(user_id, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.delete("/api/user-tasks/{user_id}/{task_id}")
def delete_user_task(user_id: int, task_id: str):
    """删除用户任务"""
    success = db.delete_user_task(user_id, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or delete failed")
    return {"message": "Task deleted successfully"}


# ==================== 用户报告相关API ====================

@app.post("/api/user-reports")
def create_user_report(report: UserReportCreate):
    """创建用户报告"""
    report_id = db.create_user_report(
        user_id=report.user_id,
        task_id=report.task_id,
        dataset=report.dataset,
        model=report.model,
        report_content=report.report_content,
        timestamp=report.timestamp,
        summary=report.summary
    )
    return {"report_id": report_id, "message": "Report created successfully"}


@app.get("/api/user-reports/list/{user_id}")
def get_user_reports(user_id: int):
    """获取用户所有报告"""
    reports = db.get_user_reports(user_id)
    return {"reports": reports}


@app.get("/api/user-reports/by-path/{user_id}")
def get_user_report_by_path(user_id: int, dataset: str, model: str):
    """根据dataset和model获取报告"""
    report = db.get_user_report_by_path(user_id, dataset, model)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@app.get("/api/user-reports/{user_id}/{report_id}")
def get_user_report(user_id: int, report_id: int):
    """获取用户指定报告"""
    report = db.get_user_report_by_id(user_id, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@app.delete("/api/user-reports/{user_id}/{report_id}")
def delete_user_report(user_id: int, report_id: int):
    """删除用户报告"""
    success = db.delete_user_report(user_id, report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or delete failed")
    return {"message": "Report deleted successfully"}


# ==================== 健康检查 ====================

@app.get("/health")
def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "database"}


if __name__ == "__main__":
    # 读取配置文件
    config_path = Path(__file__).parent.parent.parent / "config.yaml"
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    db_config = config['database_service']
    
    print("="*60)
    print("🚀 Starting Database Service")
    print("="*60)
    print(f"📊 Service: LLM Judge Database API")
    print(f"🌐 URL: http://{db_config['host']}:{db_config['port']}")
    print(f"📖 Docs: http://{db_config['host']}:{db_config['port']}/docs")
    print(f"💾 Database: {db_config['database_url']}")
    print("="*60)
    
    uvicorn.run(
        "database_service:app",
        host=db_config['host'],
        port=db_config['port'],
        reload=False  # 禁用reload模式，避免端口冲突
    )
