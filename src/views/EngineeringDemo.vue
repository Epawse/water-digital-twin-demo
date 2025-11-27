<template>
  <GlobalLayout>
    <div class="page">
      <!-- 左侧信息面板 -->
      <div class="panel-left">
        <div class="panel">
          <h2>工程演示 - 乌鲁木齐市</h2>
          <p>模拟建筑群三维可视化，展示城市与水利基础设施。</p>

          <!-- 统计信息 -->
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">建筑总数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.maxHeight }}m</span>
              <span class="stat-label">最高建筑</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.avgHeight }}m</span>
              <span class="stat-label">平均高度</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ stats.infrastructure }}</span>
              <span class="stat-label">水利设施</span>
            </div>
          </div>

          <!-- 图层控制 -->
          <div class="layer-control">
            <div class="control-title">建筑图层</div>
            <div class="layer-list">
              <label class="layer-item" v-for="layer in layerOptions" :key="layer.id">
                <input type="checkbox" v-model="layer.visible" @change="updateLayerVisibility(layer)" />
                <span class="layer-color" :style="{ background: layer.color }"></span>
                <span class="layer-name">{{ layer.name }}</span>
                <span class="layer-count">{{ layer.count }}</span>
              </label>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="actions">
            <button class="btn primary" @click="flyToOverview">
              俯瞰全城
            </button>
            <button class="btn" @click="flyToWaterFacility">
              水利设施
            </button>
            <button class="btn ghost" @click="toggleLabels">
              {{ showLabels ? '隐藏标注' : '显示标注' }}
            </button>
          </div>

          <!-- 选中建筑信息 -->
          <div class="selected-info" v-if="selectedBuilding">
            <div class="info-header">
              <span class="info-icon">🏢</span>
              <span class="info-title">{{ selectedBuilding.name }}</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">类型</span>
                <span class="value">{{ getBuildingTypeName(selectedBuilding.type) }}</span>
              </div>
              <div class="info-item">
                <span class="label">高度</span>
                <span class="value">{{ selectedBuilding.height }}m</span>
              </div>
              <div class="info-item">
                <span class="label">层数</span>
                <span class="value">{{ selectedBuilding.floors }}层</span>
              </div>
              <div class="info-item">
                <span class="label">坐标</span>
                <span class="value">{{ selectedBuilding.lng.toFixed(4) }}, {{ selectedBuilding.lat.toFixed(4) }}</span>
              </div>
            </div>
            <div class="info-desc" v-if="selectedBuilding.description">
              {{ selectedBuilding.description }}
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧工具栏 -->
      <div class="panel-right">
        <div class="toolbar-container">
          <div class="toolbar-btn" @click="isPanelExpanded = !isPanelExpanded" :class="{ 'is-active': isPanelExpanded }" title="底图控制">
            <svg viewBox="0 0 32 32" width="100%" height="100%">
              <path d="M28 20v-6l-12-6-12 6v6l12 6 12-6zm-12-4l8.5-4.25L16 7.5l-8.5 4.25L16 16zm-10 4.6l2 1 8 4 8-4 2-1v4.4l-10 5-10-5v-4.4z" fill="currentColor" />
            </svg>
          </div>
          <div class="toolbar-btn" @click="flyToOverview" title="俯瞰视角">
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
            </svg>
          </div>
          <div class="toolbar-btn" @click="toggle3DMode" :class="{ 'is-active': is3DMode }" title="3D视角">
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
        </div>

        <!-- 底图控制面板 -->
        <transition name="el-zoom-in-right">
          <div class="control-panel-box" v-show="isPanelExpanded">
            <div class="panel-header">
              <h3>底图控制</h3>
              <span class="close-btn" @click="isPanelExpanded = false">×</span>
            </div>
            <div class="panel-body">
              <el-form label-width="80px" size="small">
                <el-form-item label="开启滤镜">
                  <el-switch v-model="filterState.enabled" @change="updateUniforms" />
                </el-form-item>
                <el-form-item label="滤镜颜色">
                  <el-color-picker v-model="filterState.color" show-alpha @change="updateUniforms" />
                </el-form-item>
              </el-form>
              <div class="setting-group">
                <div class="group-label">预设主题</div>
                <div class="preset-colors">
                  <span v-for="color in presetColors" :key="color" class="color-block" :style="{ background: color }" @click="applyPreset(color)"></span>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </GlobalLayout>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref, computed } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import {
  UrumqiBuildings,
  UrumqiCenter,
  getBuildingStats,
  parseColor,
  type Building,
  type BuildingType
} from '@/mock/urumqiBuildings'

declare const Cesium: any

// 状态
const isPanelExpanded = ref(false)
const showLabels = ref(true)
const is3DMode = ref(true)
const selectedBuilding = ref<Building | null>(null)

// 建筑实体集合
const buildingEntities = ref<any[]>([])
const labelEntities = ref<any[]>([])

// 统计数据
const stats = computed(() => getBuildingStats())

// 图层配置
const layerOptions = reactive([
  { id: 'residential', name: '住宅建筑', visible: true, color: 'rgba(100, 149, 237, 0.85)', count: 0 },
  { id: 'commercial', name: '商业建筑', visible: true, color: 'rgba(255, 165, 0, 0.85)', count: 0 },
  { id: 'office', name: '办公建筑', visible: true, color: 'rgba(70, 130, 180, 0.85)', count: 0 },
  { id: 'landmark', name: '地标建筑', visible: true, color: 'rgba(220, 20, 60, 0.85)', count: 0 },
  { id: 'infrastructure', name: '水利设施', visible: true, color: 'rgba(46, 139, 87, 0.85)', count: 0 },
])

// 底图滤镜
const filterState = reactive({
  enabled: true,
  color: '#4E70A6'
})

const presetColors = [
  '#4E70A6', '#409EFF', '#00FFFF', '#001529', '#1A237E', '#26C6DA'
]

const tdtKey = '23cffd438607efdc57c79b679ac2bae9'
let originalLayers: any[] = []
const mapLayers: Record<string, any[]> = { amap: [], tdt_vec: [], tdt_ter: [], tdt_img: [] }

// 获取建筑类型名称
const getBuildingTypeName = (type: BuildingType): string => {
  const names: Record<BuildingType, string> = {
    residential: '住宅',
    commercial: '商业',
    office: '办公',
    industrial: '工业',
    infrastructure: '水利设施',
    landmark: '地标'
  }
  return names[type] || type
}

// 创建建筑实体
const createBuildingEntities = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return

  // 清除旧实体
  clearBuildingEntities()

  // 统计各类型数量
  layerOptions.forEach(layer => {
    layer.count = UrumqiBuildings.filter(b => b.type === layer.id).length
  })

  // 建筑缩放因子（让建筑更明显）
  const scale = 3

  // 创建建筑
  UrumqiBuildings.forEach(building => {
    const color = parseColor(building.color || 'rgba(100, 149, 237, 0.85)')

    // 使用polygon + extrudedHeight来创建贴地建筑
    const halfW = (building.width * scale) / 2 / 111000  // 转换为经度偏移（约111km/度）
    const halfD = (building.depth * scale) / 2 / 111000  // 转换为纬度偏移
    const rotation = Cesium.Math.toRadians(building.rotation || 0)

    // 计算旋转后的四个角点
    const corners = [
      [-halfW, -halfD],
      [halfW, -halfD],
      [halfW, halfD],
      [-halfW, halfD]
    ].map(([dx, dy]) => {
      const rotatedX = dx * Math.cos(rotation) - dy * Math.sin(rotation)
      const rotatedY = dx * Math.sin(rotation) + dy * Math.cos(rotation)
      return [building.lng + rotatedX, building.lat + rotatedY]
    })

    const entity = viewer.entities.add({
      id: building.id,
      name: building.name,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(corners.flat()),
        height: 0,
        extrudedHeight: building.height * scale,
        material: new Cesium.Color(color.r, color.g, color.b, color.a),
        outline: true,
        outlineColor: new Cesium.Color(color.r * 0.6, color.g * 0.6, color.b * 0.6, 1),
        shadows: Cesium.ShadowMode.ENABLED
      },
      properties: {
        buildingData: building
      }
    })

    buildingEntities.value.push(entity)

    // 为地标和水利设施添加标注
    if ((building.type === 'landmark' || building.type === 'infrastructure') && showLabels.value) {
      const labelEntity = viewer.entities.add({
        id: `label_${building.id}`,
        position: Cesium.Cartesian3.fromDegrees(
          building.lng,
          building.lat,
          building.height * scale + 50
        ),
        label: {
          text: building.name,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1.2, 10000, 0.6)
        }
      })
      labelEntities.value.push(labelEntity)
    }
  })

  // 添加点击事件
  setupClickHandler()
}

// 清除建筑实体
const clearBuildingEntities = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return

  buildingEntities.value.forEach(entity => {
    viewer.entities.remove(entity)
  })
  buildingEntities.value = []

  labelEntities.value.forEach(entity => {
    viewer.entities.remove(entity)
  })
  labelEntities.value = []
}

// 设置点击事件
let clickHandler: any = null
const setupClickHandler = () => {
  const viewer = (window as any).Gviewer
  if (!viewer || clickHandler) return

  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((movement: any) => {
    const picked = viewer.scene.pick(movement.position)
    if (Cesium.defined(picked) && picked.id && picked.id.properties) {
      const buildingData = picked.id.properties.buildingData?.getValue()
      if (buildingData) {
        selectedBuilding.value = buildingData
      }
    } else {
      selectedBuilding.value = null
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

// 更新图层可见性
const updateLayerVisibility = (layer: typeof layerOptions[0]) => {
  buildingEntities.value.forEach(entity => {
    const building = entity.properties?.buildingData?.getValue()
    if (building && building.type === layer.id) {
      entity.show = layer.visible
    }
  })
}

// 切换标注显示
const toggleLabels = () => {
  showLabels.value = !showLabels.value
  labelEntities.value.forEach(entity => {
    entity.show = showLabels.value
  })
}

// 飞到俯瞰视角
const flyToOverview = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      UrumqiCenter.lng,
      UrumqiCenter.lat - 0.03,
      4000
    ),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-50),
      roll: 0
    },
    duration: 2
  })
}

// 飞到水利设施
const flyToWaterFacility = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return

  const waterBuilding = UrumqiBuildings.find(b => b.type === 'infrastructure')
  if (waterBuilding) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        waterBuilding.lng,
        waterBuilding.lat - 0.005,
        800
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0
      },
      duration: 2
    })
    selectedBuilding.value = waterBuilding
  }
}

// 切换3D模式
const toggle3DMode = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return

  is3DMode.value = !is3DMode.value

  if (is3DMode.value) {
    viewer.scene.morphTo3D(1)
  } else {
    viewer.scene.morphToColumbusView(1)
  }
}

// 底图滤镜相关
const applyLayerStyle = (layers: any[], style: any) => {
  if (!layers || !layers.length) return
  layers.forEach((layer: any) => {
    layer.saturation = style.saturation
    layer.brightness = style.brightness
    layer.contrast = style.contrast
    layer.gamma = style.gamma
    layer.hue = style.hue
  })
}

const baseInkStyle = { saturation: 0.0, brightness: 0.55, contrast: 1.6, gamma: 0.35, hue: 1.0 }
const baseColorStyle = { saturation: 1.0, brightness: 0.95, contrast: 1.0, gamma: 1.0, hue: 0.0 }

const applyPreset = (color: string) => {
  filterState.color = color
  updateUniforms()
}

const updateUniforms = () => {
  const viewer = (window as any).Gviewer
  if (!viewer || !viewer.scene || !viewer.scene.globe) return

  const globe = viewer.scene.globe
  globe.filterEnabled = filterState.enabled
  const color = Cesium.Color.fromCssColorString(filterState.color)
  globe.filterColor = new Cesium.Cartesian3(color.red, color.green, color.blue)

  const activeLayers = mapLayers.amap || []
  applyLayerStyle(activeLayers, filterState.enabled ? baseInkStyle : baseColorStyle)
  globe.filterExposure = 1.25
  globe.filterContrast = 1.1
}

const initGlobeFilter = () => {
  const viewer = (window as any).Gviewer
  if (!viewer || !viewer.scene || !viewer.scene.globe) return false

  const len = viewer.imageryLayers.length
  for (let i = 0; i < len; i++) {
    originalLayers.push(viewer.imageryLayers.get(i))
  }
  mapLayers.amap = originalLayers
  updateUniforms()
  return true
}

// 隐藏站点标记
const setStationMarkersVisible = (visible: boolean) => {
  const mgr: any = (window as any).__stationMarkerManager
  if (mgr && mgr.entities) {
    mgr.entities.forEach((e: any) => { e.show = visible })
  }
}

onMounted(() => {
  const timer = setInterval(() => {
    const viewer = (window as any).Gviewer
    if (viewer) {
      clearInterval(timer)

      // 初始化底图滤镜
      initGlobeFilter()

      // 隐藏洪水图层
      const floodCache = (window as any).__floodLayerCache
      if (floodCache) {
        Object.values(floodCache).forEach((set: any) => {
          Object.values(set).forEach((layer: any) => layer && (layer.show = false))
        })
      }

      // 隐藏站点标注
      setStationMarkersVisible(false)

      // 创建建筑实体
      createBuildingEntities()

      // 飞到乌鲁木齐
      flyToOverview()
    }
  }, 300)
})

onUnmounted(() => {
  // 清除建筑实体
  clearBuildingEntities()

  // 清除点击处理器
  if (clickHandler) {
    clickHandler.destroy()
    clickHandler = null
  }

  // 恢复站点标注
  setStationMarkersVisible(true)
})
</script>

<style scoped lang="scss">
.page {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.panel-left {
  position: absolute;
  left: 110px;
  top: 120px;
  width: 320px;
  pointer-events: auto;
}

.panel {
  width: 100%;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 246, 255, 0.3);
  border-radius: 6px;
  padding: 16px;
  color: #d7e8ff;
  box-shadow: -4px 6px 20px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);

  h2 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #00f6ff;
  }

  p {
    font-size: 12px;
    color: #8eb9d9;
    margin: 0 0 12px 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 15px;

  .stat-item {
    background: rgba(0, 246, 255, 0.05);
    border: 1px solid rgba(0, 246, 255, 0.15);
    border-radius: 4px;
    padding: 10px;
    text-align: center;

    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: bold;
      color: #00f6ff;
      font-family: 'Courier New', monospace;
    }

    .stat-label {
      font-size: 10px;
      color: #8eb9d9;
    }
  }
}

.layer-control {
  margin-bottom: 15px;

  .control-title {
    font-size: 12px;
    color: #00f6ff;
    margin-bottom: 8px;
    font-weight: bold;
  }

  .layer-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .layer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background: rgba(0, 246, 255, 0.1);
    }

    input[type="checkbox"] {
      accent-color: #00f6ff;
    }

    .layer-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .layer-name {
      flex: 1;
      color: #d7e8ff;
    }

    .layer-count {
      font-size: 10px;
      color: #8eb9d9;
      font-family: 'Courier New', monospace;
    }
  }
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.btn {
  padding: 8px 12px;
  border: 1px solid rgba(0, 246, 255, 0.6);
  background: rgba(0, 246, 255, 0.1);
  color: #00f6ff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 246, 255, 0.2);
    color: #fff;
  }

  &.primary {
    background: rgba(0, 246, 255, 0.25);
    font-weight: bold;
  }

  &.ghost {
    border-color: rgba(255, 255, 255, 0.2);
    color: #d7e8ff;
    background: rgba(255, 255, 255, 0.05);
  }
}

.selected-info {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 4px;
  padding: 12px;

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.15);

    .info-icon {
      font-size: 18px;
    }

    .info-title {
      font-size: 14px;
      font-weight: bold;
      color: #00f6ff;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    .info-item {
      .label {
        font-size: 10px;
        color: #8eb9d9;
        display: block;
      }

      .value {
        font-size: 12px;
        color: #fff;
      }
    }
  }

  .info-desc {
    margin-top: 10px;
    font-size: 11px;
    color: #9fb4cc;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.panel-right {
  position: absolute;
  right: 20px;
  top: 120px;
  pointer-events: auto;
  display: flex;
  flex-direction: row-reverse;
  align-items: flex-start;
  gap: 10px;
}

.toolbar-container {
  display: flex;
  flex-direction: column;
  background: rgba(0, 20, 40, 0.8);
  border: 1px solid rgba(0, 246, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;

  .toolbar-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #00f6ff;
    transition: all 0.2s;
    padding: 6px;

    &:hover {
      background: rgba(0, 246, 255, 0.2);
    }

    &.is-active {
      background: rgba(0, 246, 255, 0.3);
      color: #fff;
    }
  }
}

.control-panel-box {
  width: 280px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 246, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  box-shadow: -5px 5px 15px rgba(0, 0, 0, 0.5);

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.2);
    background: rgba(0, 246, 255, 0.1);

    h3 {
      margin: 0;
      font-size: 14px;
      color: #00f6ff;
    }

    .close-btn {
      cursor: pointer;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.6);

      &:hover {
        color: #fff;
      }
    }
  }

  .panel-body {
    padding: 15px;
  }

  .setting-group {
    margin-top: 15px;

    .group-label {
      font-size: 12px;
      color: #ccc;
      margin-bottom: 10px;
    }
  }

  .preset-colors {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    .color-block {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.1);
        border-color: #fff;
      }
    }
  }
}
</style>
