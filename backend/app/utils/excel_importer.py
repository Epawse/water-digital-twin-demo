"""
Excel 数据导入器：将真实监测 Excel 文件解析入 PostgreSQL。

功能要点：
- 前 6~10 行解析元数据（测点编号、桩号、安装高程等）
- 自动识别表头行（包含“序号”与“观测日期”/“日期”列）
- 按传感器前缀映射 metric_key 与单位，未识别列写入 raw_values
- 幂等：基于 ingest_files 的 (sensor_id, checksum) 跳过重复
"""

from __future__ import annotations

import hashlib
import os
import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.facility import MonitoringFacility, MonitoringSection, ChainageCoordinate, SensorType
from app.models.sensor import Sensor, SensorMetric, IngestFile
from app.models.reading import SensorReading
from sqlalchemy.dialects.postgresql import insert


DATA_ROOT_DEFAULT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../安全监测数据-MMK发电引水洞/4 发电引水洞"))


@dataclass
class ParsedExcel:
    point_code: str
    sensor_type_code: str
    metadata: Dict[str, Any]
    metric_columns: Dict[str, Dict[str, Any]]  # col_name -> {"metric_key":..., "unit":..., "data_type":...}
    readings: List[Dict[str, Any]]  # 每行包含 reading_time、metrics:{metric_key:value}、raw_values


class ExcelImporter:
    SENSOR_TYPE_MAP = {
        "Df-": ("water_level", "电测水位计", "m"),
        "Pcg-": ("pore_pressure", "渗压计", "kPa"),
        "Pf-": ("pore_pressure", "渗压计", "kPa"),
        "GBcg-": ("strain_plate", "钢板计", "10^-6"),
        "GBf-": ("strain_plate", "钢板计", "10^-6"),
        "Rcg-": ("rebar_stress", "钢筋应力计", "MPa"),
        "Rf-": ("rebar_stress", "钢筋应力计", "MPa"),
        "M4f-": ("displacement_4pt", "四点式变位计", "mm"),
        "M2f-": ("displacement_2pt", "二点式变位计", "mm"),
        "Jf-": ("joint_meter", "测缝计", "mm"),
        "Tf-": ("temperature", "温度计", "℃"),
        "Nf-": ("stress_free", "无应力计", "10^-6"),
        "ASf-": ("anchor_stress", "锚杆应力计", "MPa"),
    }

    METADATA_KEYS = {
        "测点编号": "point_code",
        "测点代号": "point_code",
        "出厂编号": "factory_code",
        "埋设桩号": "install_chainage_raw",
        "埋设日期": "install_date",
        "安装高程": "install_elevation",
        "观测仪表": "reading_device",
        "仪器厂家": "instrument_manufacturer",
        "仪器型号": "instrument_model",
    }

    TIME_KEYS = ["观测日期", "观测日期时间", "日期", "时间"]

    PREFIX_METRICS: Dict[str, List[Dict[str, Any]]] = {
        "Df-": [
            {"metric_key": "freq_modulus", "unit": "KHz^2", "keywords": ["频率模数", "kHz"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
            {"metric_key": "water_level", "unit": "m", "keywords": ["水位"]},
        ],
        "Pcg-": [
            {"metric_key": "freq_modulus", "unit": "KHz^2", "keywords": ["频率模数", "kHz"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
            {"metric_key": "pore_pressure", "unit": "kPa", "keywords": ["渗透压力", "压力"]},
        ],
        "Pf-": [
            {"metric_key": "freq_modulus", "unit": "KHz^2", "keywords": ["频率模数", "kHz"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
            {"metric_key": "pore_pressure", "unit": "kPa", "keywords": ["渗透压力", "压力"]},
        ],
        "GBcg-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "resistance_sum", "unit": None, "keywords": ["电阻和"]},
            {"metric_key": "strain", "unit": "10^-6", "keywords": ["应变", "应变量"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
        ],
        "GBf-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "resistance_sum", "unit": None, "keywords": ["电阻和"]},
            {"metric_key": "strain", "unit": "10^-6", "keywords": ["应变", "应变量"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
        ],
        "Rcg-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "resistance_sum", "unit": None, "keywords": ["电阻和"]},
            {"metric_key": "stress", "unit": "MPa", "keywords": ["应力"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
        ],
        "Rf-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "resistance_sum", "unit": None, "keywords": ["电阻和"]},
            {"metric_key": "stress", "unit": "MPa", "keywords": ["应力"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
        ],
        "M4f-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "displacement", "unit": "mm", "keywords": ["位移"]},
            {"metric_key": "displacement_abs", "unit": "mm", "keywords": ["绝对位移"]},
        ],
        "M2f-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "displacement", "unit": "mm", "keywords": ["位移"]},
            {"metric_key": "displacement_abs", "unit": "mm", "keywords": ["绝对位移"]},
        ],
        "Jf-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "displacement", "unit": "mm", "keywords": ["位移", "缝宽"]},
        ],
        "Tf-": [
            {"metric_key": "resistance", "unit": "Ω", "keywords": ["电阻"]},
            {"metric_key": "temperature_measured", "unit": "℃", "keywords": ["实测温度"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["测点温度", "温度"]},
        ],
        "Nf-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "temperature_resistance", "unit": None, "keywords": ["温度电阻"]},
            {"metric_key": "strain", "unit": "10^-6", "keywords": ["应变", "应变量"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
        ],
        "ASf-": [
            {"metric_key": "resistance_ratio", "unit": None, "keywords": ["电阻比"]},
            {"metric_key": "temperature_resistance", "unit": None, "keywords": ["温度电阻"]},
            {"metric_key": "stress", "unit": "MPa", "keywords": ["应力"]},
            {"metric_key": "temperature", "unit": "℃", "keywords": ["温度"]},
        ],
    }

    def __init__(self, session: AsyncSession, data_root: str | None = None):
        self.session = session
        self.data_root = data_root or DATA_ROOT_DEFAULT
        # 默认告警阈值，可按需调整/接入配置
        self.default_warn = {
            "pore_pressure": {"warn_high": 80},
            "stress": {"warn_low": -10, "warn_high": 200},
            "water_level": {"warn_high": 70},
            "rainfall": {"warn_high": 50},
        }

    async def import_file(self, file_path: str) -> Dict[str, Any]:
        abs_path = file_path
        if not os.path.isabs(file_path):
            abs_path = os.path.abspath(os.path.join(self.data_root, file_path))
        if not os.path.exists(abs_path):
            return {"status": "skipped", "reason": "file_not_found", "path": abs_path}

        parsed = self._parse_excel(abs_path)
        sensor_type = await self._get_or_create_sensor_type(parsed.sensor_type_code)
        facility = await self._get_or_create_facility()
        section = await self._get_or_create_section(facility.id)
        chainage_id = await self._get_or_create_chainage(facility.id, parsed.metadata)
        sensor = await self._get_or_create_sensor(section.id, sensor_type.id, chainage_id, parsed)

        checksum = self._checksum(abs_path)
        mtime = str(os.path.getmtime(abs_path))
        ingest = await self._get_or_create_ingest(sensor.id, abs_path, checksum, mtime)
        if ingest is None:
            return {"status": "skipped", "reason": "duplicate_checksum", "path": abs_path, "sensor": sensor.point_code}

        metric_map = await self._ensure_metrics(sensor.id, parsed.metric_columns)
        rows_inserted = await self._insert_readings(sensor.id, metric_map, parsed.readings, ingest.id)

        ingest.rows_imported = rows_inserted
        await self.session.commit()
        return {"status": "success", "path": abs_path, "sensor": sensor.point_code, "rows": rows_inserted}

    # --- DB helpers ---

    async def _get_or_create_sensor_type(self, code: str) -> SensorType:
        st = await self.session.scalar(select(SensorType).where(SensorType.code == code))
        if st:
            return st
        # fallback: create with minimal info
        st = SensorType(code=code, name=code, unit=None, is_simulated=False)
        self.session.add(st)
        await self.session.flush()
        return st

    async def _get_or_create_facility(self) -> MonitoringFacility:
        code = "MMK-FDYSD"
        facility = await self.session.scalar(select(MonitoringFacility).where(MonitoringFacility.code == code))
        if facility:
            return facility
        facility = MonitoringFacility(code=code, name="MMK 发电引水洞", facility_type="tunnel", is_simulated=False)
        self.session.add(facility)
        await self.session.flush()
        return facility

    async def _get_or_create_section(self, facility_id: int) -> MonitoringSection:
        section = await self.session.scalar(
            select(MonitoringSection).where(MonitoringSection.facility_id == facility_id, MonitoringSection.code == "SEC-1")
        )
        if section:
            return section
        section = MonitoringSection(
            facility_id=facility_id,
            code="SEC-1",
            name="发电引水洞",
            section_type="tunnel",
            is_simulated=False,
        )
        self.session.add(section)
        await self.session.flush()
        return section

    async def _get_or_create_chainage(self, facility_id: int, metadata: Dict[str, Any]) -> Optional[int]:
        raw = metadata.get("install_chainage_raw")
        if not raw:
            return None
        chainage_normalized, chainage_value, direction = self._normalize_chainage(raw)
        existing = await self.session.scalar(
            select(ChainageCoordinate).where(
                ChainageCoordinate.facility_id == facility_id,
                ChainageCoordinate.chainage_normalized == chainage_normalized,
            )
        )
        if existing:
            return existing.id
        cc = ChainageCoordinate(
            facility_id=facility_id,
            chainage_raw=raw,
            chainage_normalized=chainage_normalized,
            chainage_value=chainage_value,
            chainage_direction=direction,
            elevation=self._to_float(metadata.get("install_elevation")),
            is_simulated=False,
        )
        self.session.add(cc)
        await self.session.flush()
        return cc.id

    async def _get_or_create_sensor(
        self, section_id: int, sensor_type_id: int, chainage_id: Optional[int], parsed: ParsedExcel
    ) -> Sensor:
        sensor = await self.session.scalar(select(Sensor).where(Sensor.point_code == parsed.point_code))
        if sensor:
            return sensor
        sensor = Sensor(
            section_id=section_id,
            sensor_type_id=sensor_type_id,
            chainage_id=chainage_id,
            point_code=parsed.point_code,
            factory_code=parsed.metadata.get("factory_code"),
            install_chainage_raw=parsed.metadata.get("install_chainage_raw"),
            install_elevation=self._to_float(parsed.metadata.get("install_elevation")),
            install_date=self._parse_date(parsed.metadata.get("install_date")),
            install_location_desc=parsed.metadata.get("install_location_desc"),
            instrument_model=parsed.metadata.get("instrument_model"),
            instrument_manufacturer=parsed.metadata.get("instrument_manufacturer"),
            reading_device=parsed.metadata.get("reading_device"),
            parameters=parsed.metadata.get("parameters"),
            status="active",
            source_file=parsed.metadata.get("source_file"),
            is_simulated=False,
        )
        self.session.add(sensor)
        await self.session.flush()
        return sensor

    async def _get_or_create_ingest(self, sensor_id: int, path: str, checksum: str, mtime: str) -> Optional[IngestFile]:
        exists = await self.session.scalar(
            select(IngestFile).where(IngestFile.sensor_id == sensor_id, IngestFile.checksum == checksum)
        )
        if exists:
            # 允许重导 rows_imported=0 的记录
            if exists.rows_imported and exists.rows_imported > 0:
                return None
            exists.file_mtime = mtime
            exists.status = "success"
            return exists
        ingest = IngestFile(
            sensor_id=sensor_id,
            path=os.path.relpath(path, self.data_root),
            checksum=checksum,
            file_mtime=mtime,
            status="success",
            is_simulated=False,
        )
        self.session.add(ingest)
        await self.session.flush()
        return ingest

    async def _ensure_metrics(self, sensor_id: int, metric_columns: Dict[str, Dict[str, Any]]) -> Dict[str, int]:
        metric_ids: Dict[str, int] = {}
        for m in metric_columns.values():
            metric_key = m["metric_key"]
            unit = m.get("unit")
            metric = await self.session.scalar(
                select(SensorMetric).where(SensorMetric.sensor_id == sensor_id, SensorMetric.metric_key == metric_key)
            )
            if not metric:
                warn_cfg = self.default_warn.get(metric_key, {})
                metric = SensorMetric(
                    sensor_id=sensor_id,
                    metric_key=metric_key,
                    name_cn=m.get("name") or metric_key,
                    unit=unit,
                    data_type=m.get("data_type") or "number",
                    warn_low=warn_cfg.get("warn_low"),
                    warn_high=warn_cfg.get("warn_high"),
                    is_simulated=False,
                )
                self.session.add(metric)
                await self.session.flush()
            metric_ids[metric_key] = metric.id
        return metric_ids

    async def _insert_readings(
        self,
        sensor_id: int,
        metric_ids: Dict[str, int],
        rows: List[Dict[str, Any]],
        ingest_id: int,
    ) -> int:
        objs: List[Dict[str, Any]] = []
        for row in rows:
            reading_time: datetime = row["reading_time"]
            raw_values = row.get("raw_values")
            for metric_key, value in row.get("metrics", {}).items():
                metric_id = metric_ids.get(metric_key)
                if not metric_id:
                    continue
                val_num, val_text = self._split_value(value)
                objs.append(
                    dict(
                        sensor_id=sensor_id,
                        metric_id=metric_id,
                        reading_time=reading_time,
                        value_num=val_num,
                        value_text=val_text,
                        unit=row.get("units", {}).get(metric_key),
                        raw_values=raw_values,
                        source_file_id=ingest_id,
                        is_simulated=False,
                        quality_flag="normal",
                        remark=None,
                    )
                )
        if not objs:
            return 0
        total = 0
        chunk_size = 500
        for i in range(0, len(objs), chunk_size):
            chunk = objs[i : i + chunk_size]
            stmt = (
                insert(SensorReading)
                .values(chunk)
                .on_conflict_do_nothing(index_elements=["metric_id", "reading_time", "source_file_id"])
            )
            result = await self.session.execute(stmt)
            # rowcount may be -1 depending on driver; fallback to len(chunk)
            total += result.rowcount if result.rowcount and result.rowcount > 0 else len(chunk)
        return total

    # --- parsing helpers ---

    def _parse_excel(self, path: str) -> ParsedExcel:
        df = pd.read_excel(path, header=None)
        metadata_rows = df.iloc[:10]
        metadata = self._parse_metadata(metadata_rows)
        metadata["source_file"] = os.path.basename(path)

        header_row = self._find_header_row(df)
        # 部分表格使用两行表头（第一行写传感器编号，第二行写指标名）；这里尝试合并
        header_base = df.iloc[header_row].fillna("").astype(str).tolist()
        header_next = df.iloc[header_row + 1].fillna("").astype(str).tolist() if header_row + 1 < len(df) else []
        use_two_rows = any(x and str(x).strip().lower() != "nan" for x in header_next)
        headers: List[str] = []
        for i, h in enumerate(header_base):
            sub = header_next[i] if use_two_rows and i < len(header_next) else ""
            sub = "" if str(sub).strip().lower() == "nan" else str(sub).strip()
            h_clean = "" if str(h).strip().lower() == "nan" else str(h).strip()
            if sub:
                headers.append(f"{h_clean} {sub}".strip())
            else:
                headers.append(h_clean)

        data_start = header_row + 2 if use_two_rows else header_row + 1
        data_df = df.iloc[data_start:].reset_index(drop=True)
        data_df.columns = headers

        point_code = metadata.get("point_code") or self._guess_point_code_from_filename(path)
        sensor_prefix = self._detect_prefix(point_code, os.path.basename(path))
        sensor_type_code = self.SENSOR_TYPE_MAP.get(sensor_prefix, (sensor_prefix, sensor_prefix, None))[0]

        metric_columns = self._map_metric_columns(sensor_prefix, headers)
        time_col = self._find_time_column(headers)
        readings: List[Dict[str, Any]] = []

        for _, row in data_df.iterrows():
            raw_dict = {col: self._clean_value(row[col]) for col in headers}
            ts_val = raw_dict.get(time_col) if time_col else None
            reading_time = self._parse_datetime(ts_val)
            if not reading_time:
                continue
            metrics: Dict[str, Any] = {}
            units: Dict[str, Any] = {}
            for col, meta in metric_columns.items():
                val = self._clean_value(row.get(col))
                if val is None:
                    continue
                metrics[meta["metric_key"]] = val
                units[meta["metric_key"]] = meta.get("unit")
            readings.append({"reading_time": reading_time, "metrics": metrics, "units": units, "raw_values": raw_dict})

        return ParsedExcel(
            point_code=point_code,
            sensor_type_code=sensor_type_code,
            metadata=metadata,
            metric_columns=metric_columns,
            readings=readings,
        )

    def _parse_metadata(self, df: pd.DataFrame) -> Dict[str, Any]:
        meta: Dict[str, Any] = {}
        for _, row in df.iterrows():
            parts = [str(x).strip() for x in row.tolist() if pd.notna(x)]
            if not parts:
                continue
            row_text = "".join(parts)
            for key, field in self.METADATA_KEYS.items():
                if key in row_text and field not in meta:
                    value = row_text.split(key, 1)[1]
                    value = value.lstrip("：: ").strip()
                    meta[field] = value
        # 其他参数放入 parameters
        parameters = {}
        for label in ["灵敏度", "灵敏度系数", "温度修正", "温度系数", "初始频率", "初始温度"]:
            for _, row in df.iterrows():
                parts = [str(x).strip() for x in row.tolist() if pd.notna(x)]
                row_text = "".join(parts)
                if label in row_text:
                    parameters[label] = row_text
        if parameters:
            meta["parameters"] = parameters
        return meta

    def _find_header_row(self, df: pd.DataFrame) -> int:
        search_rows = min(len(df), 12)
        for i in range(search_rows):
            row = [str(x) for x in df.iloc[i].tolist()]
            row_join = "".join(row)
            if "序号" in row_join and any(key in row_join for key in self.TIME_KEYS):
                return i
        return 6

    def _find_time_column(self, headers: List[str]) -> Optional[str]:
        norm_headers = {h: self._normalize_col(h) for h in headers}
        for col, norm in norm_headers.items():
            if any(k in norm for k in ["观测日期", "观测时间", "日期", "时间"]):
                return col
        return headers[0] if headers else None

    def _map_metric_columns(self, prefix: str, headers: List[str]) -> Dict[str, Dict[str, Any]]:
        mapping: Dict[str, Dict[str, Any]] = {}
        defs = self.PREFIX_METRICS.get(prefix, [])
        for col in headers:
            norm = self._normalize_col(col)
            for d in defs:
                if any(k.lower() in norm for k in d["keywords"]):
                    mapping[col] = {
                        "metric_key": d["metric_key"],
                        "unit": d.get("unit"),
                        "data_type": d.get("data_type") or "number",
                        "name": d.get("name"),
                    }
                    break
        return mapping

    def _detect_prefix(self, point_code: str, filename: str) -> str:
        candidates = list(self.SENSOR_TYPE_MAP.keys())
        for prefix in sorted(candidates, key=len, reverse=True):
            if point_code.startswith(prefix) or filename.startswith(prefix):
                return prefix
        return point_code[: point_code.find("-") + 1] if "-" in point_code else point_code

    def _guess_point_code_from_filename(self, path: str) -> str:
        base = os.path.basename(path)
        name = os.path.splitext(base)[0]
        return name

    def _normalize_col(self, name: str) -> str:
        text = str(name)
        text = re.sub(r"[\s·]", "", text)
        text = text.replace("（", "(").replace("）", ")")
        return text.lower()

    def _checksum(self, path: str) -> str:
        md5 = hashlib.md5()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                md5.update(chunk)
        return md5.hexdigest()

    def _parse_datetime(self, value: Any) -> Optional[datetime]:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return None
        if isinstance(value, datetime):
            return value
        # Excel 序列
        if isinstance(value, (int, float)):
            try:
                return pd.to_datetime(value, unit="d", origin="1899-12-30").to_pydatetime()
            except Exception:
                return None
        try:
            return pd.to_datetime(str(value)).to_pydatetime()
        except Exception:
            return None

    def _parse_date(self, value: Any) -> Optional[datetime.date]:
        if not value:
            return None
        dt = self._parse_datetime(value)
        return dt.date() if dt else None

    def _split_value(self, value: Any) -> Tuple[Optional[float], Optional[str]]:
        if value is None:
            return None, None
        if isinstance(value, (int, float)) and not pd.isna(value):
            return float(value), None
        text = str(value).strip()
        if text == "":
            return None, None
        try:
            num = float(text)
            return num, None
        except Exception:
            return None, text

    def _clean_value(self, value: Any) -> Any:
        # Normalize to JSON-serializable
        if isinstance(value, pd.Series):
            # Duplicate column names lead to a Series here; pick the first non-null
            value = next((v for v in value if not pd.isna(v)), None)
        if pd.isna(value):
            return None
        if isinstance(value, pd.Timestamp):
            return value.isoformat()
        if isinstance(value, datetime):
            return value.isoformat()
        return value

    def _normalize_chainage(self, raw: str) -> Tuple[str, Optional[float], Optional[str]]:
        text = raw.replace(" ", "")
        m = re.search(r"([+-]?\d+(?:\.\d+)?)", text)
        val = float(m.group(1)) if m else None
        direction = None
        if text:
            if text[0] in {"发", "进", "出"}:
                direction = text[0]
        return text, val, direction

    def _to_float(self, val: Any) -> Optional[float]:
        if val is None or val == "":
            return None
        try:
            return float(val)
        except Exception:
            return None
