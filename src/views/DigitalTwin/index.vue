<template>
  <GlobalLayout>
    <!-- Flood Evolution Specific Panels -->
    <div class="flood-panels">
      <div class="panel-left">
        <WaterLevelPanel @locate="handleLocate" />
        <RainMonitorPanel @locate="handleLocate" />
        <WarningPanel @locate="handleLocate" />
      </div>

      <!-- Custom Right Controls for Flood -->
      <div class="panel-right">
        <!-- 垂直工具栏 -->
        <div class="toolbar-container">
          <div class="toolbar-btn" @click="isPanelExpanded = !isPanelExpanded" :class="{ 'is-active': isPanelExpanded }"
            title="底图与风格">
            <svg viewBox="0 0 32 32" width="100%" height="100%">
              <path
                d="M28 20v-6l-12-6-12 6v6l12 6 12-6zm-12-4l8.5-4.25L16 7.5l-8.5 4.25L16 16zm-10 4.6l2 1 8 4 8-4 2-1v4.4l-10 5-10-5v-4.4z"
                fill="currentColor" />
            </svg>
          </div>
          <div class="toolbar-btn" @click="flyToXinjiang" title="定位新疆">
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="currentColor" />
            </svg>
          </div>
        </div>

        <!-- 弹出的控制面板 -->
        <transition name="el-zoom-in-right">
          <div class="control-panel-box" v-show="isPanelExpanded">
            <div class="panel-header">
              <h3>地图风格控制</h3>
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
                  <span v-for="color in presetColors" :key="color" class="color-block" :style="{ background: color }"
                    @click="applyPreset(color)"></span>
                </div>
              </div>

              <div class="setting-group">
                <div class="group-label">洪水事件</div>
                <el-select v-model="eventState.id" placeholder="选择事件" size="small" @change="applyFloodLayerVisibility">
                  <el-option v-for="evt in FloodEvents" :key="evt.id" :label="evt.name" :value="evt.id" />
                </el-select>
              </div>

              <div class="setting-group toggles">
                <div class="group-label">专题图层</div>
                <el-checkbox v-model="eventState.showInundation" @change="applyFloodLayerVisibility">淹没面</el-checkbox>
                <el-checkbox v-model="eventState.showWaterSurface" @change="applyFloodLayerVisibility">水面</el-checkbox>
                <el-checkbox v-model="eventState.showRainGrid" @change="applyFloodLayerVisibility">雨量格网</el-checkbox>
              </div>

              <div class="setting-group">
                <div class="group-label">底图样式</div>
                <div class="basemap-list">
                  <div class="basemap-item" :class="{ active: mapState.type === 'amap' }"
                    @click="mapState.type = 'amap'; toggleBaseMap('amap')">
                    <div class="thumb amap"></div>
                    <span>高德</span>
                  </div>
                  <div class="basemap-item" :class="{ active: mapState.type === 'tdt_vec' }"
                    @click="mapState.type = 'tdt_vec'; toggleBaseMap('tdt_vec')">
                    <div class="thumb vec"></div>
                    <span>矢量</span>
                  </div>
                  <div class="basemap-item" :class="{ active: mapState.type === 'tdt_ter' }"
                    @click="mapState.type = 'tdt_ter'; toggleBaseMap('tdt_ter')">
                    <div class="thumb ter"></div>
                    <span>地形</span>
                  </div>
                  <div class="basemap-item" :class="{ active: mapState.type === 'tdt_img' }"
                    @click="mapState.type = 'tdt_img'; toggleBaseMap('tdt_img')">
                    <div class="thumb img"></div>
                    <span>影像</span>
                  </div>
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
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import WaterLevelPanel from '@/modules/FloodControl/WaterLevelPanel.vue'
import RainMonitorPanel from '@/modules/FloodControl/RainMonitorPanel.vue'
import WarningPanel from '@/modules/FloodControl/WarningPanel.vue'
import { StationMarkerManager } from '@/modules/FloodControl/StationMarker'
import { FloodEvents } from '@/mock/simData'

declare const Cesium: any

// 滤镜状态
const filterState = reactive({
  enabled: true,
  color: '#4E70A6'
})

// 底图状态
const mapState = reactive({
  type: 'amap'
})

const isPanelExpanded = ref(false)

const tdtKey = '23cffd438607efdc57c79b679ac2bae9'
let originalLayers: any[] = []
const mapLayers: Record<string, any[]> = {
  amap: [],
  tdt_vec: [],
  tdt_ter: [],
  tdt_img: []
}

const presetColors = [
  '#4E70A6', // 默认蓝
  '#409EFF', // 亮蓝
  '#00FFFF', // 赛博青
  '#001529', // 深空蓝
  '#1A237E', // 科技深蓝
  '#26C6DA', // 亮青
]

const applyPreset = (color: string) => {
  filterState.color = color
  updateUniforms()
}

// 洪水事件与图层开关
const eventState = reactive({
  id: FloodEvents[0]?.id || '',
  showInundation: true,
  showWaterSurface: true,
  showRainGrid: false
})

type FloodLayerSet = { inundation?: any; waterSurface?: any; rainGrid?: any }
const getFloodLayerCache = (): Record<string, FloodLayerSet> => {
  if (!(window as any).__floodLayerCache) {
    (window as any).__floodLayerCache = {}
  }
  return (window as any).__floodLayerCache
}

const hideAllFloodLayers = () => {
  const cache = getFloodLayerCache()
  Object.values(cache).forEach(set => {
    Object.values(set).forEach(layer => {
      if (layer) layer.show = false
    })
  })
}

const ensureFloodLayers = (eventId: string) => {
  const viewer = (window as any).Gviewer
  if (!viewer) return null
  const cache = getFloodLayerCache()
  if (cache[eventId]) return cache[eventId]

  const evt = FloodEvents.find(e => e.id === eventId)
  if (!evt) return null

  const set: FloodLayerSet = {}
  // 简化：使用矩形区域模拟淹没/雨格/水面，避免实际数据缺失导致报错
  const { lng, lat } = evt.center
  const rect = Cesium.Rectangle.fromDegrees(lng - 0.8, lat - 0.6, lng + 0.8, lat + 0.6)

  // 淹没面（半透明蓝色多边形）
  const inundation = viewer.entities.add({
    name: `${evt.name}-淹没面`,
    rectangle: {
      coordinates: rect,
      material: Cesium.Color.fromBytes(0, 120, 255, 80),
      height: 0
    },
    show: false
  })

  // 水面 tileset 替代：稍高的矩形
  const waterSurface = viewer.entities.add({
    name: `${evt.name}-水面`,
    rectangle: {
      coordinates: rect,
      material: Cesium.Color.fromBytes(0, 200, 255, 60),
      height: 50
    },
    show: false
  })

  // 雨量格网示意：紫色
  const rainGrid = viewer.entities.add({
    name: `${evt.name}-雨量格网`,
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(lng - 1.0, lat - 0.8, lng + 1.0, lat + 0.8),
      material: Cesium.Color.fromBytes(160, 80, 255, 60),
      height: 0
    },
    show: false
  })

  set.inundation = inundation
  set.waterSurface = waterSurface
  set.rainGrid = rainGrid
  cache[eventId] = set
  return set
}

const applyFloodLayerVisibility = () => {
  hideAllFloodLayers()
  const set = ensureFloodLayers(eventState.id)
  if (!set) return
  if (set.inundation) set.inundation.show = eventState.showInundation
  if (set.waterSurface) set.waterSurface.show = eventState.showWaterSurface
  if (set.rainGrid) set.rainGrid.show = eventState.showRainGrid
}

// 清理其他页面残留
const hideCachedBimTileset = () => {
  const tileset = (window as any).__bimTileset
  if (tileset) tileset.show = false
}

// 统一的图层样式设定
const applyLayerStyle = (layers: any[], style: { saturation: number; brightness: number; contrast: number; gamma: number; hue: number }) => {
  if (!layers || !layers.length) return
  layers.forEach((layer: any) => {
    layer.saturation = style.saturation
    layer.brightness = style.brightness
    layer.contrast = style.contrast
    layer.gamma = style.gamma
    layer.hue = style.hue
  })
}

// 样式预设：统一使用高德水墨 / 彩色参数
const baseInkStyle = { saturation: 0.0, brightness: 0.55, contrast: 1.6, gamma: 0.35, hue: 1.0 }
const baseColorStyle = { saturation: 1.0, brightness: 0.95, contrast: 1.0, gamma: 1.0, hue: 0.0 }

// 更新 Globe 滤镜 Uniforms
const updateUniforms = () => {
  const viewer = window.Gviewer
  if (!viewer || !viewer.scene || !viewer.scene.globe) return

  const globe = viewer.scene.globe

  // 设置滤镜开关
  globe.filterEnabled = filterState.enabled

  // 解析 CSS 颜色为 RGB 归一化值
  const color = Cesium.Color.fromCssColorString(filterState.color)
  globe.filterColor = new Cesium.Cartesian3(color.red, color.green, color.blue)

  // 统一使用高德模式：所有底图均使用同一套水墨/彩色参数
  const activeLayers = mapLayers[mapState.type] || []
  applyLayerStyle(activeLayers, filterState.enabled ? baseInkStyle : baseColorStyle)
  globe.filterExposure = 1.25
  globe.filterContrast = 1.1

  // 同步洪水专题层显示
  applyFloodLayerVisibility()
}

// 高德地图 URL
const amapUrl = 'https://webst0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&style=7'

// 创建并缓存天地图图层
const ensureTdtLayers = (val: string) => {
  const viewer = window.Gviewer
  if (!viewer) return []
  if (mapLayers[val] && mapLayers[val].length) return mapLayers[val]

  let layersToAdd: string[] = []
  if (val === 'tdt_vec') layersToAdd = ['vec_w', 'cva_w']
  if (val === 'tdt_ter') layersToAdd = ['ter_w', 'cta_w']
  if (val === 'tdt_img') layersToAdd = ['img_w', 'cia_w']

  layersToAdd.forEach((layerName) => {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/DataServer?T=${layerName}&x={x}&y={y}&l={z}&tk=${tdtKey}`,
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18
    })
    const layer = viewer.imageryLayers.addImageryProvider(provider)
    mapLayers[val].push(layer)
  })
  return mapLayers[val]
}

const hideAllBaseLayers = () => {
  Object.values(mapLayers).forEach((arr) => {
    arr.forEach((layer: any) => {
      layer.show = false
    })
  })
}

// 切换底图
// 水墨模式：使用高德地图 + Globe Filter（模拟原 map.217dan.com 的水墨效果）
// 其他模式：使用天地图对应服务
const toggleBaseMap = (val: string) => {
  const viewer = window.Gviewer
  if (!viewer) return

  hideAllBaseLayers()

  let targetLayers: any[] = []
  if (val === 'amap') {
    targetLayers = mapLayers.amap
  } else {
    targetLayers = ensureTdtLayers(val)
  }
  targetLayers.forEach((layer: any) => {
    layer.show = true
  })

  // 切换底图后更新滤镜参数
  updateUniforms()
}

// 初始化 Globe 滤镜
const initGlobeFilter = () => {
  const viewer = window.Gviewer
  if (!viewer || !viewer.scene || !viewer.scene.globe) return false

  // 保存原始图层引用
  const len = viewer.imageryLayers.length
  for (let i = 0; i < len; i++) {
    originalLayers.push(viewer.imageryLayers.get(i))
  }
  mapLayers.amap = originalLayers

  // 初始化滤镜参数
  updateUniforms()
  return true
}

// 站点标记管理器
let stationMarkerManager: StationMarkerManager | null = null

const handleLocate = (stationId: string) => {
  if (stationMarkerManager) {
    stationMarkerManager.flyToStation(stationId)
  }
}

const flyToXinjiang = () => {
  if (stationMarkerManager) {
    stationMarkerManager.flyToXinjiang()
  }
}

// 初始化站点标记
const initStationMarkers = () => {
  const viewer = window.Gviewer
  if (!viewer) return false

  if ((window as any).__stationMarkerManager) {
    stationMarkerManager = (window as any).__stationMarkerManager
    // 确保显示
    stationMarkerManager.entities?.forEach((e: any) => { e.show = true })
  } else {
    stationMarkerManager = new StationMarkerManager(viewer)
    stationMarkerManager.init()
    ;(window as any).__stationMarkerManager = stationMarkerManager
  }
  return true
}

onMounted(() => {
  hideCachedBimTileset()
  hideAllFloodLayers()
  // 轮询等待 Cesium viewer 初始化完成
  const timer = setInterval(() => {
    if (initGlobeFilter()) {
      clearInterval(timer)
      // 滤镜初始化成功后，初始化站点标记
      setTimeout(() => {
        initStationMarkers()
      }, 1000)
    }
  }, 500)
})

onUnmounted(() => {
  hideAllFloodLayers()
})
</script>

<style lang="scss" scoped>
.flood-panels {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .panel-left {
    position: absolute;
    left: 110px;
    top: 100px;
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    pointer-events: auto;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
    &::-webkit-scrollbar-thumb { 
      background: rgba(0, 246, 255, 0.3); 
      border-radius: 2px;
      &:hover { background: rgba(0, 246, 255, 0.5); }
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
      width: 340px;
      background: rgba(0, 20, 40, 0.9);
      border: 1px solid rgba(0, 246, 255, 0.3);
      padding: 0;
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
          font-size: 14px;
          color: #ccc;
          margin-bottom: 10px;
        }
      }

      .toggles {
        display: flex;
        flex-direction: column;
        gap: 6px;
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

      .basemap-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;

        .basemap-item {
          cursor: pointer;
          text-align: center;
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 8px;
          transition: all 0.3s;

          .thumb {
            height: 60px;
            width: 100%;
            background-color: #333;
            border-radius: 4px;
            margin-bottom: 8px;
            background-size: cover;
            background-position: center;
            position: relative;
            overflow: hidden;
          }

          .thumb.vec {
            background: #e0e0e0;
          }

          .thumb.ter {
            background: #5a6b48;
          }

          .thumb.img {
            background: #0a1a2a;
          }

          .thumb.amap {
            // 高德地图风格：蓝色调道路+白色背景
            background: linear-gradient(135deg, #f9f9f9 0%, #e8e8e8 100%);
            &::before {
              content: '';
              position: absolute;
              top: 50%;
              left: 10%;
              right: 10%;
              height: 3px;
              background: #3385FF;
              border-radius: 2px;
              transform: translateY(-50%);
            }
            &::after {
              content: '';
              position: absolute;
              top: 30%;
              left: 40%;
              width: 3px;
              height: 40%;
              background: #3385FF;
              border-radius: 2px;
            }
          }

          span {
            font-size: 12px;
            color: #ccc;
          }

          &:hover {
            background: rgba(255, 255, 255, 0.05);

            span {
              color: #fff;
            }
          }

          &.active {
            border-color: #00e1ff;
            background: rgba(0, 225, 255, 0.1);

            span {
              color: #00e1ff;
            }
          }
        }
      }
    }
  }
}
</style>
