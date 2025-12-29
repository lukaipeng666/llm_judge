import copy
from typing import Dict

def prepare_prompt(item: Dict, role_test: str = "assistant") -> str:
    """
    准备发送给模型的提示
    Args:
        item: 数据条目
    Returns:
        格式化的提示文本
    """
    # 从meta中获取system prompt
    system_prompt = item.get('meta', {}).get('meta_description', '')
    messages_packge = []
    messages = [
        {"role": "system", "content": system_prompt},
    ]
    
    turns = item.get('turns', [])
    for turn in turns:
        role = turn.get('role', '')
        if role.lower() == 'human':
            user_input = turn.get('text', '')
            messages.append({"role": "user", "content": user_input})
        elif role.lower() == role_test:
            assistant_output = turn.get('text', '')
            messages.append({"role": role_test, "content": assistant_output})
            messages_packge.append(copy.deepcopy(messages))
        else:
            other_content = turn.get('text', '')
            messages.append({"role": role, "content": other_content})
    return messages_packge