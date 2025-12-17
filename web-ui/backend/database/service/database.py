#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库模型和操作
使用 SQLite 存储用户、数据和任务信息
"""

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import json
import hashlib

# 数据库文件路径
DB_PATH = Path(__file__).parent / "llm_judge.db"


def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row  # 使查询结果可以通过列名访问
    return conn


def init_database():
    """初始化数据库表结构"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # 用户数据文件表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            description TEXT,
            file_content TEXT NOT NULL,
            file_size INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # 用户任务表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            task_id TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL,
            progress REAL DEFAULT 0.0,
            message TEXT,
            config TEXT,
            result TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # 用户报告表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            task_id TEXT NOT NULL,
            dataset TEXT NOT NULL,
            model TEXT NOT NULL,
            report_content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            summary TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (task_id) REFERENCES user_tasks(task_id) ON DELETE CASCADE
        )
    ''')
    
    # 创建索引
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_reports_task_id ON user_reports(task_id)')
    
    conn.commit()
    conn.close()

    # 初始化管理员账户
    create_user("admin", "suanfazu2025", "admin@example.com")


def hash_password(password: str) -> str:
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()


# ==================== 用户操作 ====================

def create_user(username: str, password: str, email: Optional[str] = None) -> Optional[int]:
    """创建用户"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO users (username, password_hash, email, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, hash_password(password), email, now, now))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        return None  # 用户名已存在


def verify_user(username: str, password: str) -> Optional[Dict]:
    """验证用户登录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, email, created_at
        FROM users
        WHERE username = ? AND password_hash = ?
    ''', (username, hash_password(password)))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "created_at": row["created_at"]
        }
    return None


def get_user_by_id(user_id: int) -> Optional[Dict]:
    """根据ID获取用户信息"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, email, created_at
        FROM users
        WHERE id = ?
    ''', (user_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "username": row["username"],
            "email": row["email"],
            "created_at": row["created_at"]
        }
    return None


def get_all_users() -> List[Dict]:
    """获取所有用户列表"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, email, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def delete_user(user_id: int) -> bool:
    """删除用户及其关联数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 由于设置了 ON DELETE CASCADE，删除用户会自动删除关联数据
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


# ==================== 用户数据操作 ====================

def create_user_data(user_id: int, filename: str, file_content: str, description: str = "") -> int:
    """创建用户数据记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    file_size = len(file_content.encode('utf-8'))
    
    cursor.execute('''
        INSERT INTO user_data (user_id, filename, file_content, file_size, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, filename, file_content, file_size, description, now, now))
    
    data_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return data_id


def get_user_data_list(user_id: int) -> List[Dict]:
    """获取用户的数据文件列表（不包含文件内容）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, filename, file_size, description, created_at, updated_at
        FROM user_data
        WHERE user_id = ?
        ORDER BY created_at DESC
    ''', (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_all_data_global() -> List[Dict]:
    """获取所有用户的数据文件列表（管理员用）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT d.id, d.user_id, u.username, d.filename, d.file_size, d.description, d.created_at
        FROM user_data d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_user_data_by_id(user_id: int, data_id: int) -> Optional[Dict]:
    """获取用户的指定数据文件（包含内容）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, filename, file_content, file_size, description, created_at, updated_at
        FROM user_data
        WHERE id = ? AND user_id = ?
    ''', (data_id, user_id))
    
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None


def update_user_data(user_id: int, data_id: int, description: str) -> bool:
    """更新用户数据文件描述"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE user_data
        SET description = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
    ''', (description, datetime.now().isoformat(), data_id, user_id))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def delete_user_data(user_id: int, data_id: int) -> bool:
    """删除用户数据文件记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        DELETE FROM user_data
        WHERE id = ? AND user_id = ?
    ''', (data_id, user_id))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


# ==================== 用户任务操作 ====================

def create_user_task(user_id: int, task_id: str, config: Dict) -> int:
    """创建用户任务记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO user_tasks (user_id, task_id, status, progress, message, config, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, task_id, "pending", 0.0, "Task created", json.dumps(config), now, now))
    
    task_row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_row_id


def update_user_task(task_id: str, updates: Dict) -> bool:
    """更新用户任务状态"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 构建动态更新语句
    fields = []
    values = []
    for key, value in updates.items():
        if key in ["status", "progress", "message"]:
            fields.append(f"{key} = ?")
            values.append(value)
        elif key == "result":
            fields.append("result = ?")
            values.append(json.dumps(value))
    
    if not fields:
        return False
    
    fields.append("updated_at = ?")
    values.append(datetime.now().isoformat())
    values.append(task_id)
    
    cursor.execute(f'''
        UPDATE user_tasks
        SET {", ".join(fields)}
        WHERE task_id = ?
    ''', values)
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


def get_user_tasks(user_id: int) -> List[Dict]:
    """获取用户的所有任务"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT task_id, status, progress, message, config, result, created_at, updated_at
        FROM user_tasks
        WHERE user_id = ?
        ORDER BY created_at DESC
    ''', (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    tasks = []
    for row in rows:
        task = dict(row)
        if task["config"]:
            task["config"] = json.loads(task["config"])
        if task["result"]:
            task["result"] = json.loads(task["result"])
        tasks.append(task)
    
    return tasks


def get_all_tasks_global() -> List[Dict]:
    """获取所有用户的任务（管理员用）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT t.task_id, t.user_id, u.username, t.status, t.progress, t.message, t.created_at, t.updated_at
        FROM user_tasks t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_user_task_by_id(user_id: int, task_id: str) -> Optional[Dict]:
    """获取用户的指定任务"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT task_id, status, progress, message, config, result, created_at, updated_at
        FROM user_tasks
        WHERE task_id = ? AND user_id = ?
    ''', (task_id, user_id))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        task = dict(row)
        if task["config"]:
            task["config"] = json.loads(task["config"])
        if task["result"]:
            task["result"] = json.loads(task["result"])
        return task
    return None


def delete_user_task(user_id: int, task_id: str) -> bool:
    """删除用户任务"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        DELETE FROM user_tasks
        WHERE task_id = ? AND user_id = ?
    ''', (task_id, user_id))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


# ==================== 用户报告操作 ====================

def create_user_report(user_id: int, task_id: str, dataset: str, model: str, 
                       report_content: str, timestamp: str, summary: Dict) -> int:
    """创建用户报告记录"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO user_reports (user_id, task_id, dataset, model, report_content, timestamp, summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, task_id, dataset, model, report_content, timestamp, json.dumps(summary), datetime.now().isoformat()))
    
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return report_id


def get_user_reports(user_id: int) -> List[Dict]:
    """获取用户的所有报告（不包含报告内容）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, task_id, dataset, model, timestamp, summary, created_at
        FROM user_reports
        WHERE user_id = ?
        ORDER BY timestamp DESC
    ''', (user_id,))
    
    rows = cursor.fetchall()
    conn.close()
    
    reports = []
    for row in rows:
        report = dict(row)
        if report["summary"]:
            report["summary"] = json.loads(report["summary"])
        reports.append(report)
    
    return reports


def get_user_report_by_path(user_id: int, dataset: str, model: str) -> Optional[Dict]:
    """根据dataset和model获取用户报告（包含内容）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, task_id, dataset, model, report_content, timestamp, summary, created_at
        FROM user_reports
        WHERE user_id = ? AND dataset = ? AND model = ?
        ORDER BY timestamp DESC
        LIMIT 1
    ''', (user_id, dataset, model))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        report = dict(row)
        if report["summary"]:
            report["summary"] = json.loads(report["summary"])
        if report["report_content"]:
            report["report_content"] = json.loads(report["report_content"])
        return report
    return None


def get_user_report_by_id(user_id: int, report_id: int) -> Optional[Dict]:
    """根据ID获取用户报告（包含内容）"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, task_id, dataset, model, report_content, timestamp, summary, created_at
        FROM user_reports
        WHERE id = ? AND user_id = ?
    ''', (report_id, user_id))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        report = dict(row)
        if report["summary"]:
            report["summary"] = json.loads(report["summary"])
        if report["report_content"]:
            report["report_content"] = json.loads(report["report_content"])
        return report
    return None


def delete_user_report(user_id: int, report_id: int) -> bool:
    """删除用户报告"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        DELETE FROM user_reports
        WHERE id = ? AND user_id = ?
    ''', (report_id, user_id))
    
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success


# 初始化数据库
init_database()
