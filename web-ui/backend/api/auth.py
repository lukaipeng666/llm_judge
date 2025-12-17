#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JWT 认证模块
处理用户登录、注册、token生成和验证
"""

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, Depends, Header
from pydantic import BaseModel

# JWT 配置
SECRET_KEY = "llm-judge-secret-key-change-in-production"  # 生产环境需要使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时


class UserRegister(BaseModel):
    """用户注册模型"""
    username: str
    password: str
    email: Optional[str] = None


class UserLogin(BaseModel):
    """用户登录模型"""
    username: str
    password: str


class Token(BaseModel):
    """Token响应模型"""
    access_token: str
    token_type: str = "bearer"
    user: Dict


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[Dict]:
    """验证JWT token并返回payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(authorization: Optional[str] = Header(None)) -> Dict:
    """从请求头获取当前用户（依赖注入）"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # 解析 "Bearer <token>" 格式
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    token = parts[1]
    payload = verify_token(token)
    
    if "user_id" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return {
        "user_id": payload["user_id"],
        "username": payload.get("username", "")
    }
