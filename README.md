# 水利数字孪生系统

基于 Vue 3 + TypeScript + Cesium 的可视化前端，依赖本仓库内的 FastAPI + PostgreSQL/PostGIS 后端提供数据。

## 预览

![系统截图](./screenshot.png)

## 技术栈

- **前端框架**：Vue 3 + TypeScript + Vite
- **3D 引擎**：Cesium 1.82
- **UI 组件**：Element Plus
- **样式**：SCSS + 科幻风格 UI

## 功能模块

- 首页（Dashboard）：总览统计、地图标注（从后端传感器坐标绘制）、告警计数、在线设备统计。
- 数据管理：传感器列表（真实/模拟区分）、指标最新值与历史读数、告警列表、IoT 设备、三维资源。
- 数字孪生/工程演示：Cesium 场景与 BIM/模型加载（仍需后端提供资源/接口）。

## 快速开始（前后端联动）

1. 后端启动（需 Postgres+PostGIS）：见 `backend/README.md`，`alembic upgrade head` 后运行 `uvicorn app.main:app --reload --port 8000`。
2. 前端开发：
   ```bash
   npm install
   npm run dev
   ```
   代理已配置 `/api/backend -> http://127.0.0.1:8000/api`，生产环境请在 `.env` 中设置 `VITE_API_URL` 指向可访问的后端地址。
3. 前端构建（需解决本地 vue-tsc 环境问题）：
   ```bash
   npm run build
   ```

## 底图配置

项目使用天地图作为底图服务，需要在 `.env` 中配置：

```env
VITE_APP_NAME = '水利数字孪生系统'
VITE_API_URL = '/api'
VITE_API_ASSETS = '/'
```

## 项目结构

- `backend/`：FastAPI + SQLAlchemy + Alembic，提供监测数据、告警、产品等接口。
- `src/`：前端 Vue3 + Cesium，已改为通过后端 API 取数；`src/mock` 仅保留备用示例，不再直接使用。

## 许可证

MIT License
