#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import csv
import json
import os
import sys
from typing import Any, Dict, List, Tuple


class CSVValidationError(Exception):
    """CSV验证错误"""
    pass


def validate_csv_headers(headers: List[str]) -> Tuple[List[int], List[int]]:
    """验证CSV头部，返回Human和Assistant列的索引"""
    errors = []
    
    # 验证第一列是否为 meta
    if not headers:
        raise CSVValidationError("CSV文件为空")
    
    # 移除BOM字符（如果存在）
    first_header = headers[0].lstrip('\ufeff')
    
    if first_header != "meta":
        errors.append(f"CSV第一列必须命名为'meta'，第一列为{headers[0]}")
        raise CSVValidationError("，".join(errors))
    
    # 提取所有 Human 和 Assistant 列的索引（从第2列开始，跳过meta列）
    human_indices = [i for i, col in enumerate(headers) if col == "Human"]
    assistant_indices = [i for i, col in enumerate(headers) if col == "Assistant"]
    
    # 检查Human和Assistant列是否存在
    if not human_indices:
        errors.append("CSV中不存在'Human'列")
    if not assistant_indices:
        errors.append("CSV中不存在'Assistant'列")
    
    # 检查列数量匹配
    if len(human_indices) != len(assistant_indices):
        errors.append(
            f"Human和Assistant列数量不匹配: {len(human_indices)}个Human列 vs {len(assistant_indices)}个Assistant列"
        )
    
    # 检查Human和Assistant列的排列顺序
    conversation_indices = sorted(human_indices + assistant_indices)
    if conversation_indices != list(range(1, len(conversation_indices) + 1)):
        errors.append("Human和Assistant列必须连续排列在meta列之后")
    
    if errors:
        raise CSVValidationError("，".join(errors))
    
    return human_indices, assistant_indices


def validate_csv_content(csv_content: str) -> Tuple[List[str], List[List[str]]]:
    """验证CSV内容，返回headers和rows"""
    # 移除BOM字符（如果存在）
    csv_content = csv_content.lstrip('\ufeff')
    
    lines = csv_content.strip().split('\n')
    if not lines:
        raise CSVValidationError("CSV文件为空")
    
    try:
        reader = csv.reader(lines)
        headers = next(reader)
        rows = list(reader)
    except Exception as e:
        raise CSVValidationError(f"CSV解析失败: {str(e)}")
    
    return headers, rows


def convert_csv_to_jsonl_in_memory(csv_content: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """在内存中将CSV转换为JSONL格式的数据，不保存文件
    
    Args:
        csv_content: CSV文件内容（字符串）
    
    Returns:
        (jsonl_data, validation_info)
        jsonl_data: JSONL格式的数据列表
        validation_info: 验证详情字典，包含:
            - total_rows: 总行数
            - valid_rows: 有效行数
            - empty_rows: 空行数
            - invalid_rows: 无效行列表
            - warnings: 警告列表
            - errors: 错误列表
    """
    validation_info = {
        "total_rows": 0,
        "valid_rows": 0,
        "empty_rows": 0,
        "invalid_rows": [],
        "warnings": [],
        "errors": [],
        "headers_info": {}
    }
    
    try:
        # 解析CSV
        headers, rows = validate_csv_content(csv_content)
        
        # 验证headers
        try:
            human_indices, assistant_indices = validate_csv_headers(headers)
        except CSVValidationError as e:
            validation_info["errors"].append(str(e))
            raise
        
        # 记录headers信息
        validation_info["headers_info"] = {
            "total_columns": len(headers),
            "columns": headers,
            "human_columns": len(human_indices),
            "assistant_columns": len(assistant_indices)
        }
        
        # 处理数据行
        jsonl_data = []
        current_active_meta = ""
        validation_info["total_rows"] = len(rows)
        
        for row_idx, row in enumerate(rows, start=1):
            # 跳过完全空行
            if not row or all(not cell.strip() for cell in row):
                validation_info["empty_rows"] += 1
                continue
            
            # 检查列数
            if len(row) < len(headers):
                validation_info["invalid_rows"].append({
                    "line": row_idx + 1,  # +1是因为有header行
                    "reason": f"列数不足: 期望{len(headers)}列，实际{len(row)}列",
                    "row_content": row
                })
                continue
            
            # 处理meta
            row_meta = row[0].strip() if len(row) > 0 else ""
            if row_meta:
                current_active_meta = row_meta
            elif not current_active_meta:
                validation_info["warnings"].append({
                    "line": row_idx + 1,
                    "message": "行的meta为空且之前没有设置meta值"
                })
            
            # 提取对话内容
            turns = []
            has_content = False
            
            for h_idx, a_idx in zip(human_indices, assistant_indices):
                human_text = row[h_idx].strip() if h_idx < len(row) else ""
                assistant_text = row[a_idx].strip() if a_idx < len(row) else ""
                
                # 检查Human和Assistant是否配对
                if bool(human_text) != bool(assistant_text):
                    validation_info["warnings"].append({
                        "line": row_idx + 1,
                        "message": f"Human和Assistant配对不完整: Human={bool(human_text)}, Assistant={bool(assistant_text)}"
                    })
                
                if human_text:
                    turns.append({"role": "Human", "text": human_text})
                    has_content = True
                if assistant_text:
                    turns.append({"role": "Assistant", "text": assistant_text})
                    has_content = True
            
            # 检查是否有实际内容
            if not has_content:
                validation_info["warnings"].append({
                    "line": row_idx + 1,
                    "message": "行没有任何对话内容"
                })
                continue
            
            # 构造输出对象
            output_obj = {
                "meta": {"meta_description": current_active_meta},
                "turns": turns
            }
            jsonl_data.append(output_obj)
            validation_info["valid_rows"] += 1
        
        return jsonl_data, validation_info
    
    except CSVValidationError as e:
        validation_info["errors"].append(str(e))
        return [], validation_info
    except Exception as e:
        validation_info["errors"].append(f"未知错误: {str(e)}")
        return [], validation_info