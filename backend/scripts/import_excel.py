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

from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.utils.excel_importer import ExcelImporter, DATA_ROOT_DEFAULT


def collect_files(root: str) -> List[str]:
    root_abs = os.path.abspath(root)
    excel_files: List[str] = []
    for dirpath, _, filenames in os.walk(root_abs):
        for fn in filenames:
            if fn.lower().endswith((".xlsx", ".xls")):
                excel_files.append(os.path.join(dirpath, fn))
    return sorted(excel_files)


async def main():
    parser = argparse.ArgumentParser(description="Import monitoring Excel files into PostgreSQL")
    parser.add_argument("--root", type=str, default=DATA_ROOT_DEFAULT, help="数据根目录")
    parser.add_argument("--retry-zero", action="store_true", help="仅重导 rows_imported=0 的 ingest_files 记录")
    args = parser.parse_args()

    root_abs = os.path.abspath(args.root)
    if args.retry_zero:
        async with AsyncSessionLocal() as session:
            importer = ExcelImporter(session=session, data_root=root_abs)
            rows = (await session.execute(text("select path from ingest_files where rows_imported = 0"))).all()
            files = [r[0] for r in rows]
            if not files:
                print("No zero-row ingest_files records to retry.")
                return
            for rel in files:
                target = rel if os.path.isabs(rel) else os.path.join(root_abs, rel)
                result = await importer.import_file(target)
                print(result)
        return

    files = collect_files(root_abs)
    if not files:
        print(f"No Excel files found under {root_abs}")
        return

    async with AsyncSessionLocal() as session:
        importer = ExcelImporter(session=session, data_root=root_abs)
        for path in files:
            result = await importer.import_file(path)
            print(result)


if __name__ == "__main__":
    asyncio.run(main())
