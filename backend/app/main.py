import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .utils.scanner import scan_data_directory, DATA_ROOT
from .utils.reader import read_excel_data
from .utils.stats import calculate_overview_stats, get_water_level_data, get_rainfall_data, get_warning_data
from .utils.mock_data import get_mock_flood_events, get_mock_rain_grid_frames, get_mock_iot_devices, get_mock_3d_resources

app = FastAPI(title="Water Digital Twin Backend", version="1.0.0")

# ... (existing CORS and root endpoints) ...

@app.get("/api/events")
async def get_events():
    """获取洪水事件列表"""
    return get_mock_flood_events()

@app.get("/api/rain_frames")
async def get_rain_frames():
    """获取降雨格网帧列表"""
    return get_mock_rain_grid_frames()

@app.get("/api/iot_devices")
async def get_iot_devices():
    """获取IoT设备列表"""
    return get_mock_iot_devices()

@app.get("/api/models")
async def get_3d_models():
    """获取三维资源列表"""
    return get_mock_3d_resources()

# 配置 CORS，允许前端访问
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Water Digital Twin API is running", "status": "ok"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "fastapi"}

@app.get("/api/stations")
async def get_stations():
    """获取监测站点目录结构"""
    return scan_data_directory()

@app.get("/api/data")
async def get_station_data(path: str = Query(..., description="文件的绝对路径或相对路径")):
    """读取指定 Excel 文件的数据"""
    # 安全检查：防止路径遍历攻击
    # 如果传的是相对路径，拼接 DATA_ROOT
    target_path = path
    if not os.path.isabs(path):
        target_path = os.path.join(DATA_ROOT, path)
    
    # 规范化路径
    target_path = os.path.abspath(target_path)
    
    # 简单校验：确保目标路径在数据根目录下
    if not target_path.startswith(DATA_ROOT):
        raise HTTPException(status_code=403, detail="Access denied: Invalid file path")
    
    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    result = read_excel_data(target_path)
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
        
    return result

@app.get("/api/stats")
async def get_overview_stats():
    """获取项目总览统计数据"""
    return calculate_overview_stats()

@app.get("/api/water_levels")
async def get_all_water_levels():
    """获取所有水位监测点的最新数据"""
    return get_water_level_data()

@app.get("/api/rainfall_data")
async def get_all_rainfall_data():
    """获取所有雨量监测点的最新数据"""
    return get_rainfall_data()

@app.get("/api/warnings")
async def get_all_warnings():
    """获取所有告警信息"""
    return get_warning_data()
