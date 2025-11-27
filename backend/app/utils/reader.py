import pandas as pd
import os
from typing import Dict, List, Any

def read_excel_data(file_path: str) -> Dict[str, Any]:
    """
    读取 Excel 文件内容，返回标准化数据格式
    {
        "columns": ["时间", "测值1", ...],
        "data": [
            {"时间": "2023-01-01", "测值1": 100, ...},
            ...
        ],
        "meta": { "filename": "Df-1.xlsx" }
    }
    """
    if not os.path.exists(file_path):
        return {"error": "File not found"}

    try:
        # 读取 Excel，默认读取第一个 sheet
        # header=0 假设第一行为表头。如果实际数据表头复杂，需要根据实际情况调整
        df = pd.read_excel(file_path, header=0)
        
        # 处理日期列：尝试转换第一列或名为 '日期'/'Date'/'Time' 的列
        # 这里做一个简单的启发式处理：如果第一列看起来像日期，就格式化它
        if not df.empty:
            first_col = df.columns[0]
            # 尝试转换为 datetime 格式，无效的转为 NaT
            try:
                df[first_col] = pd.to_datetime(df[first_col])
                # 格式化为字符串，避免 JSON 序列化问题
                df[first_col] = df[first_col].dt.strftime('%Y-%m-%d %H:%M:%S')
            except:
                pass # 如果转换失败，保留原样

        # 处理 NaN 值，替换为 None (JSON null)
        df = df.where(pd.notnull(df), None)

        # 转换为记录列表
        data = df.to_dict(orient='records')
        columns = df.columns.tolist()

        return {
            "columns": columns,
            "data": data,
            "meta": {
                "filename": os.path.basename(file_path),
                "row_count": len(df)
            }
        }

    except Exception as e:
        return {"error": str(e)}
