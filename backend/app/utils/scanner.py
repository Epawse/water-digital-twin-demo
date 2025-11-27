import os
from typing import List, Dict, Any

# 数据根目录路径 (相对于 backend 运行时的路径，或者使用绝对路径)
# 假设我们在 backend 目录下运行 uvicorn，且项目根目录在上一级
DATA_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../安全监测数据-MMK发电引水洞"))

def scan_data_directory(base_path: str = DATA_ROOT, max_depth: int = 10) -> List[Dict[str, Any]]:
    """
    递归扫描数据目录，返回树形结构
    """
    if max_depth < 0:
        return []

    tree = []
    
    if not os.path.exists(base_path):
        # Only print warning if it's the root call, otherwise it's just a missing subdir which is fine
        if base_path == DATA_ROOT:
            print(f"Warning: Data path does not exist: {base_path}")
        return []

    # 获取目录下的所有项并排序
    try:
        items = sorted(os.listdir(base_path))
    except (OSError, PermissionError) as e:
        print(f"Error accessing directory {base_path}: {e}")
        return []

    for item in items:
        # 忽略隐藏文件和非相关文件
        if item.startswith('.') or item == "System Volume Information":
            continue
            
        full_path = os.path.join(base_path, item)
        
        # Ignore symlinks to prevent infinite loops
        if os.path.islink(full_path):
            continue
        
        if os.path.isdir(full_path):
            # 递归处理子目录
            children = scan_data_directory(full_path, max_depth - 1)
            # Only include directory if it's not empty (optional, but good for cleanliness)
            # For now, we include all directories to show structure
            node = {
                "label": item,
                "type": "directory",
                "path": get_relative_path(full_path), 
                "children": children
            }
            tree.append(node)
        
        elif item.endswith('.xlsx') or item.endswith('.xls'):
            # 处理 Excel 文件
            node = {
                "label": item,
                "type": "file",
                "path": get_relative_path(full_path),
                "extension": item.split('.')[-1]
            }
            tree.append(node)
            
    return tree

def get_relative_path(absolute_path: str) -> str:
    """
    将绝对路径转换为相对于数据根目录的路径，作为 ID 使用
    """
    return os.path.relpath(absolute_path, DATA_ROOT)
