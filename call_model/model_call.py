import time
import json
import openai
import requests
from typing import List, Dict
from requests.exceptions import HTTPError, Timeout,ConnectTimeout

def call_model_api(
    api_url: str, # 这个参数在使用 openai 包时，通常通过 openai.base_url 设置
    api_key: str,
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.0,
    max_tokens: int = 8192,
    retry_times: int = 3,
    timeout: int = 300,
    is_vllm: bool = False,
    top_p: float = 1.0,
) -> str:
    if is_vllm:
        result = call_vllm_api(api_url, messages, model, max_tokens=max_tokens, retry_times=retry_times, timeout=timeout, temperature=temperature, top_p=top_p)
        return result
    else:
        result = call_openai_api(api_url, api_key, messages, model, temperature, max_tokens, retry_times, timeout, top_p=top_p)
        return result

def call_vllm_api(
    api_url: str,
    messages: List[Dict[str, str]],
    model: str,
    test_mode: bool = False,
    temperature: float = 0.0,
    max_tokens: int = 8192,
    retry_times: int = 3,
    timeout: int = 600,
    top_p: float = 1.0,
) -> str:
    """
    同步调用vllm API（流式响应），兼容OpenAI格式的chat/completions端点
    
    Args:
        api_url: vllm API基础地址（如 http://localhost:8000/v1）
        prompt: 输入提示文本
        model: 模型名称
        test_mode: 是否为测试模式
        temperature: 生成温度
        max_tokens: 最大生成 tokens
        retry_times: 重试次数
    
    Returns:
        模型生成的完整文本（失败时返回错误信息）
    """
    if test_mode:
        import random
        possible_outputs = [
            "安全内容，没有检测到冒犯语言。\\boxed{0}",
            "检测到针对个体的攻击。\\boxed{1}",
            "检测到针对群体的攻击。\\boxed{2}",
            "这是安全的内容。\\boxed{3}",
            "无法判断，需要更多信息。",
            "\\boxed{0}"
        ]
        return random.choice(possible_outputs)

    do_sample = temperature > 0.0
    
    # 构建请求参数（流式响应）
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
    
    full_response = ""
    for attempt in range(retry_times):
        try:
            # 拼接完整URL（处理基础地址是否包含/v1）
            base_url = api_url.rstrip('/')
            endpoint = "/chat/completions"
            if not base_url.endswith('/v1'):
                base_url += '/v1'
            full_url = f"{base_url}{endpoint}"
            
            # 发送同步流式请求（stream=True 保持连接获取流数据）
            with requests.post(
                full_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                stream=True,  # 关键：启用流式响应
                timeout=300
            ) as response:
                response.raise_for_status()  # 检查HTTP错误
                
                # 逐行处理流式数据
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
                                # print(delta, end="", flush=True)
                        except (KeyError, json.JSONDecodeError) as e:
                            print(f"解析流数据失败: {data_str}，错误: {str(e)}")
                            continue
                # 若未收到[DONE]但流结束，返回已获取内容
                return full_response.strip()
        
        except HTTPError as e:
            status_code = e.response.status_code if e.response else "未知"
            print(f"HTTP错误 (状态码: {status_code}, 尝试 {attempt+1}/{retry_times})")
        except (ConnectTimeout, Timeout):
            print(f"调用超时 (尝试 {attempt+1}/{retry_times})")
        except ConnectionError:
            print(f"连接失败 (尝试 {attempt+1}/{retry_times})")
        except Exception as e:
            print(f"未知错误 {type(e).__name__} (尝试 {attempt+1}/{retry_times})")
        
        # 重试前等待（指数退避）
        if attempt < retry_times - 1:
            time.sleep(2** attempt)
    
    # 所有重试失败
    return f"模型调用失败"


def call_openai_api(
    api_url: str,
    api_key: str,
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.0,
    max_tokens: int = 16384,
    retry_times: int = 3,
    timeout: int = 300,
    top_p: float = 1.0,
) -> str:
    """
    使用 openai Python 包调用兼容 OpenAI 接口的模型 API。
    """
    # 1. 配置 openai 客户端（直接使用timeout参数）
    client = openai.OpenAI(
        api_key=api_key,
        base_url=api_url,
        timeout=timeout,
        max_retries=0
    )

    for attempt in range(retry_times):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens
            )
            # 提取回复内容
            return response.choices[0].message.content.strip()

        except openai.APIConnectionError as e:
            # 网络连接错误
            print(f"API Connection Error on attempt {attempt + 1}/{retry_times}: {e}")
            if attempt == retry_times - 1:
                return f"API Connection Error: {e}"
            time.sleep(2 ** attempt)
            
        except openai.RateLimitError as e:
            # 速率限制错误
            print(f"Rate Limit Error on attempt {attempt + 1}/{retry_times}: {e}")
            if attempt == retry_times - 1:
                return f"Rate Limit Error: {e}"
            time.sleep(2 ** attempt)
            
        except openai.APIStatusError as e:
            # 其他 API 错误 (4xx, 5xx)
            error_details = {
                "status_code": e.status_code,
                "response": str(e.response),
                "model": model,
                "api_url": api_url,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "messages": messages
            }
            
            # 400 错误通常是参数问题，不需要重试
            if e.status_code == 400:
                try:
                    error_body = e.response.json() if hasattr(e.response, 'json') else str(e.response)
                except:
                    error_body = str(e.response)
                
                return f"""Bad Request (400) Error:
Response: {error_body}
Model: {model}
API URL: {api_url}
Temperature: {temperature}
Max Tokens: {max_tokens}
Messages: {json.dumps(messages, ensure_ascii=False)}"""
            
            if attempt == retry_times - 1:
                return f"API Status Error ({e.status_code}): {json.dumps(error_details, ensure_ascii=False, indent=2)}"
            time.sleep(2 ** attempt)
            
        except Exception as e:
            # 其他未预期的错误
            error_msg = f"Unexpected error: {type(e).__name__}: {e}"
            print(f"{error_msg} on attempt {attempt + 1}/{retry_times}")
            print(f"Model: {model}")
            print(f"Messages: {messages}")
            
            if attempt == retry_times - 1:
                return error_msg
            time.sleep(2 ** attempt)

    return f"Failed to get response after {retry_times} retries"
