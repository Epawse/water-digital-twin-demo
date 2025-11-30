"""
导入真实监测 Excel 数据到 PostgreSQL。

用法：
    python3 -m scripts.import_excel --root "../安全监测数据-MMK发电引水洞/4 发电引水洞"
"""

from __future__ import annotations

import argparse
import asyncio
import os
from typing import List

from app.database import AsyncSessionLocal
from app.utils.excel_importer import ExcelImporter, DATA_ROOT_DEFAULT


def collect_files(root: str) -> List[str]:
    excel_files: List[str] = []
    for dirpath, _, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith((".xlsx", ".xls")):
                excel_files.append(os.path.join(dirpath, fn))
    return sorted(excel_files)


async def main():
    parser = argparse.ArgumentParser(description="Import monitoring Excel files into PostgreSQL")
    parser.add_argument("--root", type=str, default=DATA_ROOT_DEFAULT, help="数据根目录")
    args = parser.parse_args()

    files = collect_files(args.root)
    if not files:
        print(f"No Excel files found under {args.root}")
        return

    async with AsyncSessionLocal() as session:
        importer = ExcelImporter(session=session, data_root=args.root)
        for path in files:
            result = await importer.import_file(path)
            print(result)


if __name__ == "__main__":
    asyncio.run(main())
