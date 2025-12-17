#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
插入测试数据脚本
为了测试前端的直方图和雷达图分析功能
"""

import sqlite3
from datetime import datetime
from pathlib import Path
import json

# 数据库文件路径
DB_PATH = Path(__file__).parent / "llm_judge.db"


def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    """密码哈希"""
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()


def insert_test_data():
    """为用户 testuser 插入测试报告数据"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 首先检查 testuser 是否存在
        cursor.execute("SELECT id FROM users WHERE username = ?", ("testuser",))
        user_row = cursor.fetchone()
        
        if not user_row:
            # 创建测试用户
            now = datetime.now().isoformat()
            try:
                cursor.execute(
                    """INSERT INTO users (username, password_hash, email, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?)""",
                    ("testuser", hash_password("testpass123"), "test@example.com", now, now)
                )
                user_id = cursor.lastrowid
                conn.commit()
                print(f"✅ 创建测试用户: testuser (ID: {user_id})")
            except sqlite3.IntegrityError:
                print("⚠️  测试用户已存在")
                cursor.execute("SELECT id FROM users WHERE username = ?", ("testuser",))
                user_id = cursor.fetchone()[0]
        else:
            user_id = user_row[0]
            print(f"✅ 找到用户: testuser (ID: {user_id})")
        
        # 定义测试数据
        test_reports = [
            {
                "dataset": "COCO",
                "model": "GPT-3.5",
                "task_id": "test_task_001",
                "summary": {
                    "accuracy": 0.85,
                    "precision": 0.88,
                    "recall": 0.82,
                    "f1_score": 0.85,
                    "average_score": 8.5,
                }
            },
            {
                "dataset": "COCO",
                "model": "GPT-4",
                "task_id": "test_task_002",
                "summary": {
                    "accuracy": 0.92,
                    "precision": 0.94,
                    "recall": 0.90,
                    "f1_score": 0.92,
                    "average_score": 9.2,
                }
            },
            {
                "dataset": "COCO",
                "model": "Claude",
                "task_id": "test_task_003",
                "summary": {
                    "accuracy": 0.87,
                    "precision": 0.89,
                    "recall": 0.85,
                    "f1_score": 0.87,
                    "average_score": 8.7,
                }
            },
            {
                "dataset": "ImageNet",
                "model": "GPT-3.5",
                "task_id": "test_task_004",
                "summary": {
                    "accuracy": 0.78,
                    "precision": 0.80,
                    "recall": 0.76,
                    "f1_score": 0.78,
                    "average_score": 7.8,
                }
            },
            {
                "dataset": "ImageNet",
                "model": "GPT-4",
                "task_id": "test_task_005",
                "summary": {
                    "accuracy": 0.91,
                    "precision": 0.93,
                    "recall": 0.89,
                    "f1_score": 0.91,
                    "average_score": 9.1,
                }
            },
            {
                "dataset": "ImageNet",
                "model": "Claude",
                "task_id": "test_task_006",
                "summary": {
                    "accuracy": 0.84,
                    "precision": 0.86,
                    "recall": 0.82,
                    "f1_score": 0.84,
                    "average_score": 8.4,
                }
            },
            {
                "dataset": "Flickr30k",
                "model": "GPT-3.5",
                "task_id": "test_task_007",
                "summary": {
                    "accuracy": 0.81,
                    "precision": 0.83,
                    "recall": 0.79,
                    "f1_score": 0.81,
                    "average_score": 8.1,
                }
            },
            {
                "dataset": "Flickr30k",
                "model": "GPT-4",
                "task_id": "test_task_008",
                "summary": {
                    "accuracy": 0.94,
                    "precision": 0.95,
                    "recall": 0.93,
                    "f1_score": 0.94,
                    "average_score": 9.4,
                }
            },
            {
                "dataset": "Flickr30k",
                "model": "Claude",
                "task_id": "test_task_009",
                "summary": {
                    "accuracy": 0.89,
                    "precision": 0.91,
                    "recall": 0.87,
                    "f1_score": 0.89,
                    "average_score": 8.9,
                }
            },
        ]
        
        # 插入测试数据
        inserted_count = 0
        for report in test_reports:
            now = datetime.now().isoformat()
            
            # 检查是否已存在相同的报告（避免重复插入）
            cursor.execute(
                """SELECT id FROM user_reports 
                   WHERE user_id = ? AND dataset = ? AND model = ? AND task_id = ?""",
                (user_id, report["dataset"], report["model"], report["task_id"])
            )
            
            if cursor.fetchone():
                print(f"⚠️  跳过已存在的报告: {report['dataset']} - {report['model']}")
                continue
            
            cursor.execute(
                """INSERT INTO user_reports 
                   (user_id, task_id, dataset, model, report_content, timestamp, summary, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    user_id,
                    report["task_id"],
                    report["dataset"],
                    report["model"],
                    json.dumps({"detailed_results": []}),  # 简单的报告内容
                    now,
                    json.dumps(report["summary"]),
                    now
                )
            )
            inserted_count += 1
            print(f"✅ 插入报告: {report['dataset']} - {report['model']} (accuracy: {report['summary']['accuracy']})")
        
        conn.commit()
        conn.close()
        
        if inserted_count > 0:
            print(f"\n✅ 成功插入 {inserted_count} 个测试报告!")
            print("\n📊 测试数据摘要:")
            print("   - 数据集: COCO, ImageNet, Flickr30k")
            print("   - 模型: GPT-3.5, GPT-4, Claude")
            print("   - 指标: accuracy, precision, recall, f1_score, average_score")
            print("\n💡 你可以现在访问前端测试直方图和雷达图功能")
        else:
            print("\n⚠️  没有新的测试数据被插入（所有数据可能已存在）")
        
        return True
    
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        conn.close()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🔧 LLM Judge 测试数据插入脚本")
    print("=" * 60)
    print("\n此脚本将会:")
    print("  1. 自动创建测试用户 testuser (if not exists)")
    print("  2. 插入 9 个测试报告数据")
    print("  3. 测试数据包含 3 个数据集，3 个模型")
    print("  4. 测试数据浄售包名包、精准率、F1 分数等指标\n")
    
    success = insert_test_data()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ 数据插入完成!")
        print("=" * 60)
        print("\n🔑 登录帐号:")
        print("  用户名: testuser")
        print("  密码: testpass123")
    else:
        print("\n" + "=" * 60)
        print("❌ 数据插入失败")
        print("=" * 60)
