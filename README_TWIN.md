# 水利数字孪生项目基础框架说明

本项目基于 `vue3-vite-cesium-new` 构建，旨在实现《水利数字孪生基础框架技术方案》中的核心可视化与业务功能。

## 1. 项目架构设计

我们将项目划分为四层架构，以满足数字孪生系统的复杂需求：

### L1: 基础设施层 (Infrastructure Layer)
- **核心引擎**: `src/core/cesium/` (计划中)
  - 负责 Cesium Viewer 的初始化、销毁。
  - 负责底图加载、地形加载 (Terrain)。
  - 负责相机控制、事件分发。
- **当前实现**: `src/utils/ctrlCesium/Controller.ts` (目前作为核心控制器)

### L2: 数据层 (Data Layer)
- **API 接口**: `src/api/`
  - 对接后台 FastAdmin 接口。
  - 获取水利站点数据、雨情数据、工情数据。
- **状态管理**: `src/store/` (Pinia)
  - 管理全局应用状态（如当前选中的流域、当前时间轴）。

### L3: 业务服务层 (Service/Simulation Layer)
- **业务模块**: `src/modules/`
  - **FloodControl (防洪调度)**: 洪水演进模拟、淹没分析。
  - **WaterResource (水资源管理)**: 水库调度、取用水监控。
  - **ProjectSafety (工程安全)**: 大坝安全监测、BIM 模型展示。
- **示例**: `src/modules/FloodControl/WaterLevelPanel.vue` (水位监测面板)

### L4: 应用层 (Application Layer)
- **驾驶舱 (Cockpit)**: `src/views/DigitalTwin/index.vue`
  - 系统的主入口，集成地图底座和所有业务面板。
  - 采用 "一张图" (One Map) 模式。

## 2. 目录结构说明

```
src/
├── api/                # 后端接口定义
├── assets/             # 静态资源
├── components/         # 通用 UI 组件 (如 PannelBox)
├── core/               # [新增] 核心引擎代码
│   └── cesium/         # Cesium 封装类
├── modules/            # [新增] 业务模块 (按领域划分)
│   └── FloodControl/   # 防洪模块
│       └── WaterLevelPanel.vue
├── router/             # 路由配置
├── store/              # 状态管理
├── utils/              # 工具库 (含原 ctrlCesium)
└── views/              # 页面视图
    ├── DigitalTwin/    # [新增] 数字孪生主视图
    │   └── index.vue
    └── Cesium3DIndex.vue # 原地图组件 (作为底座被引入)
```

## 3. 开发指南

### 如何添加一个新的业务功能？
1. 在 `src/modules/` 下创建一个新的文件夹，例如 `DroughtAnalysis` (干旱分析)。
2. 开发 Vue 组件（面板、图表）。
3. 如果需要在地图上绘制内容（如热力图），请在 `src/utils/ctrlCesium/` 下扩展相应的可视化类，或者在组件内调用 Cesium API。
4. 在 `src/views/DigitalTwin/index.vue` 中引入并布局该组件。

### 如何对接真实数据？
1. 在 `src/api/` 中定义新的 API 方法。
2. 在组件的 `setup()` 中调用 API 获取数据。
3. 使用 `watch` 监听数据变化，并更新地图上的 Entity 或 Primitive。

## 4. 下一步建议
- **地形接入**: 数字孪生通常需要高精度地形，建议在 `Controller.ts` 中配置 `Cesium.CesiumTerrainProvider`。
- **BIM 集成**: 将大坝、水闸的 BIM 模型转换为 3D Tiles 格式，通过 `Titleset.ts` 加载。
- **动态水面**: 利用 Shader 实现动态水面效果，模拟洪水演进。
