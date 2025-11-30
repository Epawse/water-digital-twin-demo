# PostgreSQL + PostGIS 数据库迁移计划

## 一、现有数据分析

### 1.1 数据源概况
- **位置**: `安全监测数据-MMK发电引水洞/4 发电引水洞/`
- **文件数量**: 77 个 Excel 文件
- **传感器类型**: 13 种
- **数据量**: 约 52 万条观测记录 (77 文件 × ~6800 行)

### 1.2 传感器类型分布

| 类别 | 传感器类型 | 文件前缀 | 数量 | 主要测量值 |
|------|-----------|---------|------|-----------|
| 水位 | 电测水位计 | Df- | 1 | 水位高程(m) |
| 渗压 | 渗压计 | Pcg-, Pf- | 11 | 渗透压力(kPa) |
| 应变 | 钢板计 | GBcg-, GBf- | 32 | 应变量(10⁻⁶) |
| 应力 | 钢筋应力计 | Rcg-, Rf- | 11 | 应力(MPa) |
| 位移 | 四点式变位计 | M4f- | 8 | 位移量(mm) |
| 位移 | 二点式变位计 | M2f- | 2 | 位移量(mm) |
| 变形 | 测缝计 | Jf- | 6 | 缝宽(mm) |
| 温度 | 温度计 | Tf- | 2 | 温度(℃) |
| 应变 | 无应力计 | Nf- | 2 | 应变量 |
| 应力 | 锚杆应力计 | ASf- | 2 | 应力(MPa) |

### 1.3 Excel 文件结构

```
行 0:    标题行（如"振弦式电测水位计观测记录、计算表"）
行 1-5:  元数据区
         - 测点编号、出厂编号
         - 埋设桩号、埋设日期
         - 安装高程、观测仪表
         - 传感器参数（灵敏度系数、温度系数等）
行 6:    数据列标题（序号、观测日期、测量值列...）
行 7+:   观测数据（时序数据，小时级采集）
```

---

## 二、数据库设计方案

### 2.1 技术选型

| 组件 | 选择 | 说明 |
|------|------|------|
| 数据库 | PostgreSQL 15+ | 成熟稳定，支持 JSON、时序扩展 |
| 空间扩展 | PostGIS 3.x（可选） | 仅当补充经纬度后启用；无坐标时可不安装 |
| 时序优化 | TimescaleDB（可选） | 规模增加或需压缩时启用，当前 52 万行用原生索引即可 |
| Python ORM | SQLAlchemy 2.x | 类型安全，异步支持 |
| 迁移工具 | Alembic | 数据库版本管理 |

### 2.2 数据库表结构设计

#### 2.2.1 监测设施表 (monitoring_facilities)

```sql
CREATE TABLE monitoring_facilities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,        -- 设施编号，如 "MMK-发电引水洞"
    name VARCHAR(200) NOT NULL,               -- 设施名称
    facility_type VARCHAR(50),                -- 类型: dam, tunnel, slope, etc.
    location GEOMETRY(Point, 4326),           -- PostGIS 点位置
    location_desc TEXT,                       -- 位置描述
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.2.2 监测断面/区域表 (monitoring_sections)

```sql
CREATE TABLE monitoring_sections (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES monitoring_facilities(id),
    code VARCHAR(50) NOT NULL,                -- 断面编号，如 "1 钢岔管段"
    name VARCHAR(200) NOT NULL,               -- 断面名称
    section_type VARCHAR(50),                 -- 类型: 钢岔管段、边坡、引水洞等
    chainage VARCHAR(100),                    -- 桩号，如 "发0+367.494"
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(facility_id, code)
);
```

#### 2.2.3 传感器类型表 (sensor_types)

```sql
CREATE TABLE sensor_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,         -- 类型代码: water_level, pressure, strain...
    name VARCHAR(100) NOT NULL,               -- 中文名称
    unit VARCHAR(50),                         -- 单位: m, kPa, MPa, ℃, mm, 10⁻⁶
    prefix_pattern VARCHAR(20),               -- 文件前缀模式: Df-, Pcg-, GBf-
    description TEXT
);

-- 预置数据
INSERT INTO sensor_types (code, name, unit, prefix_pattern) VALUES
    ('water_level', '电测水位计', 'm', 'Df-'),
    ('pore_pressure', '渗压计', 'kPa', 'Pcg-,Pf-'),
    ('strain_plate', '钢板计', '10⁻⁶', 'GBcg-,GBf-'),
    ('rebar_stress', '钢筋应力计', 'MPa', 'Rcg-,Rf-'),
    ('displacement_4pt', '四点式变位计', 'mm', 'M4f-'),
    ('displacement_2pt', '二点式变位计', 'mm', 'M2f-'),
    ('joint_meter', '测缝计', 'mm', 'Jf-'),
    ('temperature', '温度计', '℃', 'Tf-'),
    ('stress_free', '无应力计', '10⁻⁶', 'Nf-'),
    ('anchor_stress', '锚杆应力计', 'MPa', 'ASf-');
```

#### 2.2.4 桩号坐标映射表 (chainage_coordinates) - PostGIS 核心表

> **设计说明**: 由于真实数据中只有桩号描述（如 `发0+367.494`），没有经纬度坐标。
> 此表用于存储桩号与地理坐标的映射关系，支持后期补充坐标数据。

```sql
CREATE TABLE chainage_coordinates (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER REFERENCES monitoring_facilities(id),

    -- 桩号信息
    chainage_raw VARCHAR(200) NOT NULL,       -- 原始桩号: "发0+367.494钢筋混凝土衬砌底部"
    chainage_normalized VARCHAR(100),          -- 标准化桩号: "发0+367.494"
    chainage_value DECIMAL(10,3),             -- 桩号数值: 367.494 (用于排序和计算)
    chainage_direction VARCHAR(20),           -- 方向标识: "发" (发电引水洞)
    lateral_offset_dir VARCHAR(10),           -- 横向方向: 左/右/中
    lateral_offset_m DECIMAL(10,3),           -- 横向偏移: 20.8

    -- 位置描述
    location_desc TEXT,                       -- 详细位置描述
    elevation DECIMAL(10,3),                  -- 高程 (m)

    -- PostGIS 坐标 (WGS84)
    location GEOMETRY(Point, 4326),           -- 经纬度坐标 (待补充)
    location_source VARCHAR(50),              -- 坐标来源: manual, gis_import, survey

    -- 元数据
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(facility_id, chainage_normalized, lateral_offset_dir, lateral_offset_m, elevation)
);

-- 空间索引
CREATE INDEX idx_chainage_location ON chainage_coordinates USING GIST(location);
CREATE INDEX idx_chainage_normalized ON chainage_coordinates(chainage_normalized);
CREATE INDEX idx_chainage_value ON chainage_coordinates(chainage_value);

-- 示例数据 (从Excel解析)
-- INSERT INTO chainage_coordinates (facility_id, chainage_raw, chainage_normalized, chainage_value, chainage_direction, elevation) VALUES
--     (1, '发0-019.00闸井边墩', '发0-019.00', -19.00, '发', 1863.7),
--     (1, '发0+367.494钢筋混凝土衬砌底部', '发0+367.494', 367.494, '发', 1837),
--     (1, '发电洞闸井段中墩右侧1893.0m高程', '发0+000', 0, '发', 1893.0);
```

**桩号解析规则**:
```
原始桩号格式示例:
- "发0-019.00闸井边墩"      → 方向=发, 桩号=-19.00m, 描述=闸井边墩
- "发0+367.494钢筋混凝土衬砌底部" → 方向=发, 桩号=+367.494m
- "发0-040.899 右0+020.8"   → 主桩号=-40.899m, 横向偏移=右20.8m

桩号规则:
- "+" 表示顺水流方向
- "-" 表示逆水流方向
- 数值单位为米 (m)
- 横向偏移（如 "右0+020.8"）解析到 `lateral_offset_dir` 与 `lateral_offset_m`
```

#### 2.2.5 传感器/测点表 (sensors)

```sql
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES monitoring_sections(id),
    sensor_type_id INTEGER REFERENCES sensor_types(id),
    chainage_id INTEGER REFERENCES chainage_coordinates(id),  -- 关联桩号坐标

    -- 基本信息
    point_code VARCHAR(50) NOT NULL,          -- 测点编号: Df-1, Pcg-1
    factory_code VARCHAR(100),                -- 出厂编号: ULYD9535

    -- 安装信息 (原始数据保留)
    install_chainage_raw VARCHAR(200),        -- 原始埋设桩号: 发0-019.00闸井边墩
    install_elevation DECIMAL(10,3),          -- 安装高程: 1863.7
    install_date DATE,                        -- 埋设日期
    install_location_desc TEXT,               -- 安装位置描述

    -- 仪器信息
    instrument_model VARCHAR(100),            -- 仪器型号
    instrument_manufacturer VARCHAR(100),     -- 仪器厂家
    reading_device VARCHAR(100),              -- 观测仪表: NDA1411

    -- 传感器参数 (JSON 存储不同类型的参数)
    parameters JSONB,
    /*
    示例:
    水位计: {"sensitivity_k": -0.1394, "temp_coef_m": -0.0829, "initial_freq": 5905.8, "initial_temp": 14.2}
    渗压计: {"sensitivity_k": ..., "initial_freq": 3861.4}
    钢筋计: {"sensitivity_f": 1.033, "temp_coef_k2": 5.31, "initial_temp": 19.67}
    */

    -- 状态
    status VARCHAR(20) DEFAULT 'active',      -- active, inactive, faulty
    source_file VARCHAR(500),                 -- 原始Excel文件路径

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(section_id, point_code)
);

CREATE INDEX idx_sensors_type ON sensors(sensor_type_id);
CREATE INDEX idx_sensors_section ON sensors(section_id);
CREATE INDEX idx_sensors_chainage ON sensors(chainage_id);
```

#### 2.2.6 传感器指标表 (sensor_metrics)

```sql
CREATE TABLE sensor_metrics (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id),
    metric_key VARCHAR(50) NOT NULL,          -- water_level, freq_modulus, temperature, stress 等
    name_cn VARCHAR(100),
    unit VARCHAR(50),
    data_type VARCHAR(20) DEFAULT 'number',   -- number / text
    warn_low DECIMAL(15,6),
    warn_high DECIMAL(15,6),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(sensor_id, metric_key)
);
```

#### 2.2.6.1 真实文件列到 metric 的映射（基于样例）

| 前缀 | 典型列 | metric_key | 单位 | 备注 |
|------|--------|------------|------|------|
| Df-（水位计） | 频率模数（KHz^2） | freq_modulus | KHz^2 | 行头“频率模数（KHz^2）” |
|              | 温度T（℃） | temperature | ℃ |      |
|              | 水位高程（m） | water_level | m | 主值 |
| Pf-/Pcg-（渗压计） | 频率模数（KHz^2） | freq_modulus | KHz^2 | 行头“频率模数（KHz^2）”；Pcg- 与 Pf- 同结构 |
|                 | 温度T（℃） | temperature | ℃ |      |
|                 | 渗透压力P（kPa） | pore_pressure | kPa | 主值 |
| GBf-/GBcg-（钢板计，差阻式应变） | 电阻比Z | resistance_ratio | - | GBcg- 与 GBf- 同结构 |
|                 | 电阻和R | resistance_sum | - | |
|                 | 应变量ε（10^-6） | strain | 10^-6 | 主值 |
|                 | 温度T（℃） | temperature | ℃ | |
| Rf-/Rcg-（钢筋应力计） | 电阻比 | resistance_ratio | - | |
|                 | 电阻和 | resistance_sum | - | |
|                 | 应力（MPa） | stress | MPa | 主值 |
|                 | 温度（℃） | temperature | ℃ | |
| M4f-（四点式变位计） | 电阻比 | resistance_ratio | - | |
|                  | 位移（mm） | displacement | mm | 主值 |
|                  | 绝对位移（mm） | displacement_abs | mm | 可选/有些文件为空 |
|                  | 温度（如存在） | temperature | ℃ | 部分文件未含 |
| M2f-（二点式变位计） | 电阻比 | resistance_ratio | - | |
|                    | 位移（mm） | displacement | mm | 主值 |
|                    | 绝对位移（mm） | displacement_abs | mm | 部分文件为空 |
| Jf-（测缝计） | 电阻比 | resistance_ratio | - | |
|                  | 位移（mm） | displacement | mm | 主值 |
| Tf-（温度计） | 电阻值（Ω） | resistance | Ω | |
|                 | 实测温度（℃） | temperature_measured | ℃ | |
|                 | 测点温度（℃） | temperature | ℃ | 主值 |
| Nf-（无应力计，应变） | 电阻比 | resistance_ratio | - | |
|                 | 温度电阻 | temperature_resistance | - | |
|                 | 应变（μζ/10^-6） | strain | 10^-6 | 主值 |
|                 | 温度（℃） | temperature | ℃ | |
| ASf-（锚杆应力计） | 电阻比 | resistance_ratio | - | |
|                  | 温度电阻 | temperature_resistance | - | |
|                  | 应力（MPa） | stress | MPa | 主值 |
|                  | 温度（℃） | temperature | ℃ | |
| 其他（待抽样） | 观测日期、序号 | - | - | 不建 metric；仅用于时间或忽略 |

#### 2.2.7 入库文件表 (ingest_files) - 幂等与溯源

```sql
CREATE TABLE ingest_files (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id),
    path TEXT NOT NULL,                       -- 相对 DATA_ROOT 的路径
    sheet TEXT,
    checksum TEXT,                            -- 文件 MD5
    file_mtime TIMESTAMPTZ,                   -- 文件修改时间
    rows_imported INTEGER,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'success',     -- success / skipped / failed
    message TEXT,
    UNIQUE(sensor_id, checksum)
);
```

#### 2.2.8 观测数据表 (sensor_readings) - 核心时序表

```sql
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id),
    metric_id INTEGER NOT NULL REFERENCES sensor_metrics(id),
    reading_time TIMESTAMP NOT NULL,          -- 观测时间

    -- 窄表存储
    value_num DECIMAL(15,6),
    value_text TEXT,
    unit VARCHAR(50),

    -- 原始数据
    raw_values JSONB,                         -- 同一行的其他字段，保留完整性
    /*
    示例:
    水位计: {"序号":1,"观测日期":"2024-12-01 00:00:00","freq_modulus":4172.05,"temperature":2.29,"water_level":1887.97}
    钢筋计: {"序号":1,"观测日期":"2024-12-01 00:00:00","resistance_ratio":10042,"resistance_sum":76.58,"stress":-13.36,"temperature":3.56}
    */

    -- 数据质量
    quality_flag VARCHAR(20) DEFAULT 'normal', -- normal, warning, error, manual
    remark TEXT,                               -- 备注
    source_file_id INTEGER REFERENCES ingest_files(id),

    created_at TIMESTAMP DEFAULT NOW()
);

-- 复合索引优化查询
CREATE UNIQUE INDEX idx_readings_dedup ON sensor_readings(metric_id, reading_time, source_file_id);
CREATE INDEX idx_readings_sensor_time ON sensor_readings(sensor_id, reading_time DESC);
CREATE INDEX idx_readings_time ON sensor_readings(reading_time);

-- 可选: TimescaleDB 超表转换 (大幅提升时序查询性能)
-- SELECT create_hypertable('sensor_readings', 'reading_time');
```

#### 2.2.9 告警规则表 (alert_rules)

```sql
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    sensor_type_id INTEGER REFERENCES sensor_types(id),
    sensor_id INTEGER REFERENCES sensors(id),  -- NULL 表示适用于该类型所有传感器

    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50),                     -- threshold, rate_of_change, missing_data

    -- 阈值设置
    warning_threshold DECIMAL(15,6),           -- 黄色预警阈值
    alert_threshold DECIMAL(15,6),             -- 橙色预警阈值
    critical_threshold DECIMAL(15,6),          -- 红色预警阈值

    -- 变化率设置 (可选)
    rate_threshold DECIMAL(15,6),              -- 变化率阈值
    rate_period_hours INTEGER,                 -- 计算变化率的时间窗口

    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2.2.10 告警记录表 (alerts)

```sql
CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INTEGER REFERENCES sensors(id),
    reading_id BIGINT REFERENCES sensor_readings(id),
    rule_id INTEGER REFERENCES alert_rules(id),

    alert_level VARCHAR(20) NOT NULL,          -- blue, yellow, orange, red
    alert_type VARCHAR(50),                    -- threshold, rate_of_change, missing_data
    message TEXT,

    value DECIMAL(15,6),                       -- 触发告警的值
    threshold DECIMAL(15,6),                   -- 触发的阈值

    status VARCHAR(20) DEFAULT 'active',       -- active, acknowledged, resolved
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_sensor ON alerts(sensor_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_time ON alerts(created_at DESC);
```

### 2.3 数据库视图

```sql
-- 最新读数视图
CREATE VIEW v_latest_readings AS
SELECT DISTINCT ON (sr.metric_id)
    s.id as sensor_id,
    s.point_code,
    st.name as sensor_type,
    sm.metric_key,
    sm.name_cn as metric_name,
    COALESCE(sr.unit, sm.unit, st.unit) as unit,
    sr.reading_time,
    sr.value_num,
    sr.value_text,
    sr.quality_flag,
    ms.name as section_name,
    mf.name as facility_name
FROM sensor_readings sr
JOIN sensor_metrics sm ON sr.metric_id = sm.id
JOIN sensors s ON sr.sensor_id = s.id
JOIN sensor_types st ON s.sensor_type_id = st.id
JOIN monitoring_sections ms ON s.section_id = ms.id
JOIN monitoring_facilities mf ON ms.facility_id = mf.id
ORDER BY sr.metric_id, sr.reading_time DESC;

-- 传感器统计视图
CREATE VIEW v_sensor_stats AS
SELECT
    s.id as sensor_id,
    s.point_code,
    st.name as sensor_type,
    sm.metric_key,
    sm.name_cn as metric_name,
    COUNT(sr.id) as reading_count,
    MIN(sr.reading_time) as first_reading,
    MAX(sr.reading_time) as last_reading,
    AVG(sr.value_num) as avg_value,
    MIN(sr.value_num) as min_value,
    MAX(sr.value_num) as max_value
FROM sensors s
JOIN sensor_types st ON s.sensor_type_id = st.id
JOIN sensor_metrics sm ON sm.sensor_id = s.id
LEFT JOIN sensor_readings sr ON sr.metric_id = sm.id
GROUP BY s.id, s.point_code, st.name, sm.metric_key, sm.name_cn;
```

---

## 三、后端代码结构

### 3.1 新增目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI 入口 (更新)
│   ├── config.py                  # 配置管理 (新增)
│   ├── database.py                # 数据库连接 (新增)
│   ├── models/                    # SQLAlchemy 模型 (新增)
│   │   ├── __init__.py
│   │   ├── facility.py
│   │   ├── sensor.py
│   │   ├── reading.py
│   │   └── alert.py
│   ├── schemas/                   # Pydantic 模式 (新增)
│   │   ├── __init__.py
│   │   ├── sensor.py
│   │   ├── reading.py
│   │   └── alert.py
│   ├── crud/                      # 数据库操作 (新增)
│   │   ├── __init__.py
│   │   ├── sensor.py
│   │   ├── reading.py
│   │   └── alert.py
│   ├── api/                       # API 路由 (新增)
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── sensors.py
│   │   │   ├── readings.py
│   │   │   ├── alerts.py
│   │   │   └── stats.py
│   │   └── router.py
│   ├── services/                  # 业务逻辑 (新增)
│   │   ├── __init__.py
│   │   ├── alert_service.py
│   │   └── stats_service.py
│   ├── migrations/                # Alembic 迁移 (新增)
│   │   ├── versions/
│   │   └── env.py
│   └── utils/
│       ├── __init__.py
│       ├── excel_importer.py      # Excel 导入工具 (新增)
│       ├── mock_data.py           # 保留兼容
│       ├── reader.py              # 保留兼容
│       ├── scanner.py             # 保留兼容
│       └── stats.py               # 更新使用数据库
├── scripts/                       # 脚本 (新增)
│   ├── init_db.py                 # 初始化数据库
│   ├── import_excel.py            # 导入 Excel 数据
│   └── seed_data.py               # 初始化种子数据
├── alembic.ini                    # Alembic 配置 (新增)
├── requirements.txt               # 更新依赖
└── .env.example                   # 环境变量模板 (新增)
```

### 3.2 新增依赖 (requirements.txt)

```txt
# 现有依赖
fastapi
uvicorn
pandas
openpyxl
numpy
python-multipart

# 新增依赖
sqlalchemy[asyncio]>=2.0
asyncpg                    # PostgreSQL 异步驱动
psycopg2-binary           # PostgreSQL 同步驱动 (用于迁移)
alembic                   # 数据库迁移
geoalchemy2               # PostGIS 支持
shapely                   # 几何对象
pydantic-settings         # 配置管理
python-dotenv             # 环境变量
```

### 3.3 环境变量 (.env.example)

```env
# 数据库配置
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/water_twin
DATABASE_URL_SYNC=postgresql+psycopg2://user:password@localhost:5432/water_twin

# 数据目录
DATA_ROOT=../安全监测数据-MMK发电引水洞

# 应用配置
DEBUG=true
API_PREFIX=/api
```

---

## 四、数据迁移流程

### 4.1 迁移步骤概览

```
步骤 1: 环境准备
    ├── 安装 PostgreSQL + PostGIS
    ├── 创建数据库
    └── 安装 Python 依赖

步骤 2: 数据库初始化
    ├── 创建表结构 (Alembic)
    └── 插入种子数据 (sensor_types)

步骤 3: Excel 数据解析
    ├── 扫描所有 Excel 文件，计算 checksum + mtime，写 ingest_files（已有 checksum 即跳过）
    ├── 解析元数据区 → sensors / sensor_metrics 表
    └── 解析数据区 → sensor_readings 表（幂等插入）

步骤 4: 数据验证
    ├── 检查记录数量（按文件行数对账）与重复（UNIQUE 索引命中数）
    ├── 验证时间列解析成功率（缺时间行跳过计数）
    ├── 按传感器/metric 生成 min/max/空值比例报告
    └── 生成迁移报告（包含跳过原因、失败文件清单）

步骤 5: API 更新
    ├── 更新现有端点使用数据库
    └── 添加新的 CRUD 端点
```

### 4.2 Excel 解析策略

结合真实文件结构（以 `Df-1.xlsx`、`Rf-5.xlsx`、`Pf-1.xlsx`、`GBf-1.xlsx`、`M4f-1-1.xlsx` 为例）：
- 行 1-6 为元数据：测点编号/设计编号、埋设桩号、安装高程、埋设日期、出厂编号、观测仪表/厂家、灵敏度系数、温度修正、初始频率模数/电阻比/温度等。
- 数据表头位于第 7 行（索引从 1 开始），常见列：
  - 水位计 `Df-`：`序号`、`观测日期`（Excel 序列值）、`频率模数（KHz^2）`、`温度T（℃）`、`水位高程（m）`、`备注`
  - 渗压计 `Pf-/Pcg-`：`序号`、`观测日期`、`频率模数（KHz^2）`、`温度T（℃）`、`渗透压力P（kPa）`、`备注`
  - 钢筋应力计 `Rf-`：`序号`、`观测日期`、`电阻比`、`电阻和`、`应力（MPa）`、`温度（℃）`、`备注`
  - 钢板计 `GBf-`：`序号`、`观测日期`、`电阻比Z`、`电阻和R`、`应变量ε（10^-6）`、`温度T（℃）`、`备注`
  - 四点式变位计 `M4f-`：`序号`、`观测日期`、`电阻比`、`位移（mm）`、`绝对位移（mm，部分文件为空）`、`备注`
  - 二点式变位计 `M2f-`：`序号`、`观测日期时间`、`电阻比`、`位移（mm）`、`绝对位移（mm）`、`备注`
  - 测缝计 `Jf-`：`序号`、`观测日期时间`、`电阻比`、`位移（mm）`、`备注`
  - 温度计 `Tf-`：`序号`、`观测日期`、`电阻值（Ω）`、`实测温度（℃）`、`测点温度（℃）`、`备注`
  - 无应力计 `Nf-`：`序号`、`观测日期`、`电阻比`、`温度电阻`、`应变（μζ）`、`温度（℃）`、`备注`
  - 锚杆应力计 `ASf-`：`序号`、`观测日期`、`电阻比`、`温度电阻`、`应力（MPa）`、`温度（℃）`、`备注`
- `观测日期` 为 Excel 序列（如 45658.0417），需按 1899-12-30 为原点转换并统一为 `Asia/Shanghai` 时区。
- 备注列大量为空，可写入 `raw_values` 但不必生成 metric。
- 列匹配与单位标准化：
  - 时间列兼容 `观测日期`、`观测日期时间`，都解析为 `reading_time`。
  - 带上标/下标的列名（如 “KHz^2”“μ”“μζ”）用包含关键词匹配，不依赖精确字符串。
  - 应变单位统一保存为 10^-6（microstrain），应力为 MPa，位移为 mm，温度为 ℃，水位/高程为 m。
  - 未识别列写入 `raw_values`，不生成 metric。
- 列名规范化建议：去除全角括号、空格和上/下标格式，统一大小写；例如 `频率模数（KHz²）`、`频率模数（KHz^2）`、`频率模数` 归一到 `频率模数` 关键词；`应变（μζ）`/`应变量ε（10^-6）` 归一到 `应变`。
- Sheet 选择：若存在多 sheet，默认取第一个；可配置 sheet 名列表。找不到表头时报错并跳过该文件。
- 配置化：建议将“前缀 → 列关键词 → metric_key/unit/type”抽成配置（YAML/JSON 或数据库表），导入器启动时加载，新类型仅需追加配置，无需改代码。
- 未知类型处理：无法识别前缀时，`ingest_files.status` 记为 `unknown` 并跳过；表头匹配不到任何 metric 时记录 warning，并将整行写入 `raw_values` 以便后续补映射。

```python
# excel_importer.py 核心逻辑

class ExcelImporter:
    """Excel 数据导入器"""

    # 传感器类型映射
    SENSOR_TYPE_MAP = {
        'Df-': 'water_level',
        'Pcg-': 'pore_pressure',
        'Pf-': 'pore_pressure',
        'GBcg-': 'strain_plate',
        'GBf-': 'strain_plate',
        'Rcg-': 'rebar_stress',
        'Rf-': 'rebar_stress',
        'M4f-': 'displacement_4pt',
        'M2f-': 'displacement_2pt',
        'Jf-': 'joint_meter',
        'Tf-': 'temperature',
        'Nf-': 'stress_free',
        'ASf-': 'anchor_stress',
    }

    # 元数据行解析规则
    METADATA_RULES = {
        '测点编号': 'point_code',
        '出厂编号': 'factory_code',
        '埋设桩号': 'install_chainage',
        '安装高程': 'install_elevation',
        '埋设日期': 'install_date',
        '观测仪表': 'reading_device',
        '仪器厂家': 'instrument_manufacturer',
        '灵敏度系数': 'sensitivity',
        '温度修正': 'temp_coefficient',
    }

    def parse_excel(self, file_path: str) -> dict:
        """解析单个 Excel 文件"""
        df = pd.read_excel(file_path, header=None)

        # 1. 解析元数据 (前7行)
        metadata = self._parse_metadata(df.iloc[:7])

        # 2. 确定数据起始行 (查找"序号"列)
        data_start_row = self._find_data_start(df)

        # 3. 解析观测数据（列名映射到 metric_key，观测日期从 Excel 序列转 ISO8601）
        readings = self._parse_readings(df.iloc[data_start_row:])

        return {
            'metadata': metadata,
            'readings': readings,
            'source_file': file_path
        }
```

解析规则补充：
- `SENSOR_TYPE_MAP` 决定 metric 列表，例如 `Df-` → freq_modulus / temperature / water_level；`Rf-` → resistance_ratio / resistance_sum / stress / temperature。
- `_build_metric_map(prefix)` 根据 2.2.6.1 的映射表返回列标题到 metric_key 的字典，未知列写入 raw_values 不入库。
- `_find_data_start` 在前 10 行寻找包含 “序号” 且同列含 “观测日期/观测日期时间” 的行号；找不到则默认第 6 行作为表头。
- `_build_metric_map(prefix)` 根据 2.2.6.1 的映射表返回列标题到 metric_key 的字典，未知列写入 raw_values 不入库。
- 前缀识别：基于文件名开头（Df-/Pf-/Pcg-/GBf-/GBcg-/Rf-/Rcg-/M4f-/M2f-/Jf-/Tf-/Nf-/ASf-），若无法匹配则标记为 unknown 并跳过入库。
- 列关键词匹配示例：`patterns = {'freq_modulus': ['频率模数', 'kHz'], 'water_level': ['水位高程', '水位'], 'pore_pressure': ['渗透压力', '压力P'], 'strain': ['应变量', '应变'], 'stress': ['应力'], 'temperature': ['温度'], 'displacement': ['位移']}`，对规范化后的列名做 contains 匹配。
- `_parse_metadata` 将 “埋设桩号”“安装高程”“灵敏度系数”“温度修正”“初始频率模数”“初始温度”等写入 `sensors.parameters`，并生成 `chainage_coordinates` 记录。
- `_parse_readings` 遇到空行或缺少时间的行跳过；对每一行生成多条 `sensor_readings`（每个 metric 一条），保留整行 JSON 进 `raw_values`。
- 幂等：先计算文件 MD5/mtime，存在于 `ingest_files` 且行数一致则跳过；否则标记旧批次为 skipped 再写入。

### 4.3 数据量估算

| 表 | 预计记录数 | 存储估算 |
|---|----------|---------|
| monitoring_facilities | 1 | < 1 KB |
| monitoring_sections | 11 | < 10 KB |
| sensor_types | 10 | < 5 KB |
| chainage_coordinates | ~50-100 | < 50 KB |
| sensors | 77 | < 100 KB |
| sensor_readings | ~520,000 | ~100-200 MB |
| alerts | 动态增长 | - |

---

## 五、API 端点更新

### 5.1 保持兼容的端点

| 端点 | 变更 | 说明 |
|------|------|------|
| `GET /api/stations` | 无变更 | 继续从文件系统读取目录树 |
| `GET /api/data?path=` | 无变更 | 继续从 Excel 读取原始数据 |

### 5.2 更新使用数据库的端点

| 端点 | 变更 | 说明 |
|------|------|------|
| `GET /api/stats` | 改用数据库 | 统计数据从 DB 查询 |
| `GET /api/water_levels` | 改用数据库 | 水位数据从 DB 查询 |
| `GET /api/rainfall_data` | 保持模拟 | 无真实雨量数据 |
| `GET /api/warnings` | 改用数据库 | 告警从 DB 查询 |

### 5.3 新增 API 端点

```
# 传感器管理
GET    /api/v1/sensors                 # 列表 (支持过滤、分页)
GET    /api/v1/sensors/{id}            # 详情
GET    /api/v1/sensors/{id}/readings   # 传感器读数历史

# 观测数据
GET    /api/v1/readings                # 按时间范围查询
GET    /api/v1/readings/latest         # 所有传感器最新读数
POST   /api/v1/readings/batch          # 批量导入 (预留)

# 告警管理
GET    /api/v1/alerts                  # 告警列表
GET    /api/v1/alerts/active           # 活跃告警
POST   /api/v1/alerts/{id}/acknowledge # 确认告警
POST   /api/v1/alerts/{id}/resolve     # 解决告警

# 统计分析
GET    /api/v1/stats/overview          # 总览统计
GET    /api/v1/stats/sensor/{id}       # 单传感器统计
GET    /api/v1/stats/trend/{id}        # 趋势数据
```

---

## 六、实施计划

### 阶段 1: 基础设施 (1-2天)
- [ ] 安装配置 PostgreSQL + PostGIS
- [ ] 创建数据库和用户
- [ ] 更新 requirements.txt
- [ ] 创建 config.py 和 database.py

### 阶段 2: 数据模型 (1天)
- [ ] 创建 SQLAlchemy 模型
- [ ] 创建 Pydantic schemas
- [ ] 配置 Alembic
- [ ] 生成初始迁移脚本
- [ ] 执行数据库迁移

### 阶段 3: 数据导入 (1-2天)
- [ ] 开发 ExcelImporter 类
- [ ] 解析元数据逻辑
- [ ] 解析观测数据逻辑
- [ ] 创建导入脚本
- [ ] 执行数据导入
- [ ] 验证数据完整性

### 阶段 4: API 开发 (2天)
- [ ] 创建 CRUD 模块
- [ ] 实现新 API 端点
- [ ] 更新现有端点使用数据库
- [ ] 添加分页和过滤支持

### 阶段 5: 集成测试 (1天)
- [ ] 测试所有 API 端点
- [ ] 验证前端兼容性
- [ ] 性能测试
- [ ] 文档更新
- [ ] 导入器测试：针对各前缀样例（Df/Pf/Pcg/GBf/GBcg/Rf/Rcg/M4f/M2f/Jf/Tf/Nf/ASf）做单测，覆盖表头偏差、空时间行跳过、重复文件幂等、未知列落入 raw_values

---

## 七、注意事项

### 7.1 数据质量处理
- Excel 中的 NaN 值转为 NULL
- 日期格式统一为 ISO 8601
- 数值精度保留 6 位小数
- 记录原始文件路径便于溯源
- Excel 序列时间统一转换（origin=1899-12-30，tz=Asia/Shanghai），无时间的行跳过
- `ingest_files` + `idx_readings_dedup` 保证幂等，重复文件/行不产生重复记录

### 7.2 向后兼容
- 保留原有 `/api/stations` 和 `/api/data` 端点
- 新端点使用 `/api/v1/` 前缀
- 模拟数据端点保持不变

### 7.3 性能优化
- 使用异步数据库连接 (asyncpg)
- 批量插入观测数据 (每次 1000 条)
- 为时序查询创建合适的索引
- 考虑使用 TimescaleDB 压缩历史数据
- 对模拟数据可先补充经纬度：
  - mock 站点如已有坐标，写入 `sensors.location`（Point, 4326）
  - 仅有桩号的测点，可生成临时坐标写入 `chainage_coordinates.location`（标记 source=simulated），后续用真实坐标替换，保证前端点位可用
- 模拟数据标记：
  - 所有表增加 `is_simulated BOOLEAN DEFAULT false`（或 `source ENUM(real, simulated)`），用于区分真实/模拟；seed 数据设为 true，真实导入设为 false
  - 坐标类字段（`sensors.location`, `chainage_coordinates.location`）同样写入 PostGIS Point，模拟坐标填 `source=simulated` 便于后续替换

### 7.4 PostGIS 使用场景（通过桩号坐标映射表）

**当前状态**: 真实数据只有桩号描述，没有经纬度坐标

**解决方案**: 创建 `chainage_coordinates` 桩号坐标映射表

**坐标补充方式**:
1. **手动录入**: 通过管理界面逐个添加坐标
2. **GIS 导入**: 从 CAD/GIS 系统批量导入桩号-坐标对照表
3. **测量数据**: 从现场测量数据导入

**PostGIS 功能应用**:
- 空间索引: 快速查询指定范围内的传感器
- 距离计算: 计算传感器之间的距离
- 区域查询: 按多边形区域筛选传感器
- 可视化支持: 为 Cesium 3D 地图提供坐标数据

**查询示例**:
```sql
-- 获取传感器及其坐标 (如已补充)
SELECT s.point_code, s.install_chainage_raw,
       ST_X(cc.location) as lng, ST_Y(cc.location) as lat,
       cc.elevation
FROM sensors s
LEFT JOIN chainage_coordinates cc ON s.chainage_id = cc.id
WHERE cc.location IS NOT NULL;

-- 查询某坐标附近500米内的传感器
SELECT s.point_code, ST_Distance(cc.location::geography,
       ST_MakePoint(79.5, 37.2)::geography) as distance_m
FROM sensors s
JOIN chainage_coordinates cc ON s.chainage_id = cc.id
WHERE ST_DWithin(cc.location::geography,
      ST_MakePoint(79.5, 37.2)::geography, 500);
```

---

## 八、非传感器数据扩展方案（参考“水利数字孪生基础框架技术方案0911.pdf”）

目标：在现有“配置化映射 + 窄表存储 + raw_values 兜底 + ingest_files 幂等”的框架上，接入气象/水文格点、模型产品、资源目录等其他真实数据类型。

- 数据域抽象：新增 `data_domain` 概念（如 hydrology_monitor、meteorology_grid、flood_forecast、resource_catalog），按域划分模型和 API。
- 元数据与溯源：保留 `ingest_files`/`ingest_jobs`（source_type=file/api/db/stream, checksum/etag, time_window, feature_count），所有新域复用。
- 栅格/格点产品表（示例）：
  ```sql
  CREATE TABLE raster_products (
      id SERIAL PRIMARY KEY,
      domain VARCHAR(50),              -- meteorology_grid, flood_forecast 等
      name TEXT,
      product_type VARCHAR(50),        -- rain_grid, inundation_depth, water_surface
      path TEXT,                       -- 文件/对象存储路径或 URL
      time_start TIMESTAMPTZ,
      time_end TIMESTAMPTZ,
      bbox GEOMETRY(Polygon, 4326),    -- 空间范围
      crs TEXT,
      resolution TEXT,                 -- 0.1deg / 1km 等
      meta JSONB,
      ingest_file_id INT REFERENCES ingest_files(id)
  );
  CREATE INDEX idx_raster_time ON raster_products(time_start, time_end);
  CREATE INDEX idx_raster_bbox ON raster_products USING GIST(bbox);
  ```
- 矢量/要素产品表（示例）：
  ```sql
  CREATE TABLE vector_products (
      id SERIAL PRIMARY KEY,
      domain VARCHAR(50),              -- river_network, inundation_polygon, admin_boundary
      name TEXT,
      product_type VARCHAR(50),
      path TEXT,                       -- GeoJSON/Shape/FGDB/tiles 等路径
      time_start TIMESTAMPTZ,
      time_end TIMESTAMPTZ,
      srid INT,
      bbox GEOMETRY(Polygon, 4326),
      meta JSONB,
      ingest_file_id INT REFERENCES ingest_files(id)
  );
  CREATE INDEX idx_vector_time ON vector_products(time_start, time_end);
  CREATE INDEX idx_vector_bbox ON vector_products USING GIST(bbox);
  ```
- 模型/方案产品表（示例，用于洪水预报、调度方案等）：
  ```sql
  CREATE TABLE model_products (
      id SERIAL PRIMARY KEY,
      domain VARCHAR(50),              -- flood_forecast, operation_plan
      name TEXT,
      version TEXT,
      valid_from TIMESTAMPTZ,
      valid_to TIMESTAMPTZ,
      product_type VARCHAR(50),        -- stage_curve, discharge_ts, inundation_ts
      path TEXT,                       -- 文件/接口地址
      meta JSONB,
      ingest_file_id INT REFERENCES ingest_files(id)
  );
  CREATE INDEX idx_model_valid ON model_products(valid_from, valid_to);
  ```
- 配置驱动解析：在配置中声明 source_type、路径/接口、字段映射/单位、目标表，未知字段落入 `meta/raw_values`，失败/跳过写入 ingest 报告。
- API 设计：按域暴露读取接口（如 `/api/v1/grid/rain`, `/api/v1/vector/inundation`, `/api/v1/model/forecast`），统一返回时间/空间范围、单位、版本、资源路径，支持分页/时间窗/范围过滤。
- 验证与测试：为各新域准备样例数据，覆盖表头/字段偏差、时间/空间范围解析、幂等导入、权限与错误处理。

---

## 九、模拟到真实的统一落地计划
- 监测数据：用 Excel 导入器生成 `sensors/sensor_metrics/sensor_readings`，缺坐标的桩号生成模拟坐标（`is_simulated=true`），真实坐标到位后更新并清除标记。
- 移除 mock 站点：清理 `mock_stations` 及依赖接口，前端仅从数据库读取；保留 `ENABLE_SEED_DATA` 开关以便演示模式种入模拟记录。
- 非监测类模拟：洪水演练/降雨格网/3D 资源等按 `model_products/raster_products/vector_products` 入库并标 `is_simulated=true`，后续逐项替换为真实源。
- API 改造：水位/雨量/告警等接口改为查库，并支持 `is_simulated` 过滤；新增产品类接口供前端统一取数。
- 前端切换：移除内置 mock，全部走后端 API，根据 `is_simulated` 控制显示或提示。
