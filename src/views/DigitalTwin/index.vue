<template>
  <GlobalLayout>
    <!-- Flood Evolution Specific Panels -->
    <div class="flood-panels">
      <div class="panel-left">
        <WaterLevelPanel @locate="handleLocate" />
        <RainMonitorPanel @locate="handleLocate" />
        <WarningPanel @locate="handleLocate" />
      </div>

      <!-- 降雨热力图控制面板 -->
      <RainfallHeatmapLayer
        :viewer="cesiumViewer"
        :showControls="true"
        initialRegion="yili"
        @frameChange="handleRainfallFrameChange"
      />

      <!-- 底部时间轴控制 -->
      <div class="timeline-panel">
        <div class="timeline-header">
          <span class="timeline-title">洪水演进时间轴</span>
          <span class="current-time tech-font">{{ currentTimeDisplay }}</span>
        </div>
        <div class="timeline-body">
          <div class="timeline-controls">
            <button class="control-btn" @click="skipToStart" title="跳到开始">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="currentColor"/></svg>
            </button>
            <button class="control-btn" @click="skipBackward" title="后退">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" fill="currentColor"/></svg>
            </button>
            <button class="control-btn play" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
              <svg v-if="!isPlaying" viewBox="0 0 24 24" width="20" height="20"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>
            </button>
            <button class="control-btn" @click="skipForward" title="前进">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="currentColor"/></svg>
            </button>
            <button class="control-btn" @click="skipToEnd" title="跳到结束">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor"/></svg>
            </button>
            <select v-model.number="playSpeed" class="speed-select">
              <option :value="500">2x</option>
              <option :value="1000">1x</option>
              <option :value="2000">0.5x</option>
            </select>
          </div>
          <div class="timeline-slider">
            <div class="slider-track">
              <div class="slider-progress" :style="{ width: progressPercent + '%' }"></div>
              <input
                type="range"
                v-model.number="currentHour"
                :min="0"
                :max="totalHours"
                class="slider-input"
              />
            </div>
            <div class="time-marks">
              <span v-for="mark in timeMarks" :key="mark.hour" class="time-mark" :style="{ left: mark.percent + '%' }">
                {{ mark.label }}
              </span>
            </div>
          </div>
          <div class="timeline-info">
            <div class="info-item">
              <span class="info-label">当前事件</span>
              <span class="info-value">{{ currentEventName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">淹没面积</span>
              <span class="info-value warning">{{ currentFloodArea }} km²</span>
            </div>
            <div class="info-item">
              <span class="info-label">最大水深</span>
              <span class="info-value">{{ currentMaxDepth }} m</span>
            </div>
          </div>
        </div>
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
import { onMounted, onUnmounted, reactive, ref, watch, computed } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import WaterLevelPanel from '@/modules/FloodControl/WaterLevelPanel.vue'
import RainMonitorPanel from '@/modules/FloodControl/RainMonitorPanel.vue'
import WarningPanel from '@/modules/FloodControl/WarningPanel.vue'
import RainfallHeatmapLayer from '@/components/RainfallHeatmapLayer.vue'
import { StationMarkerManager } from '@/modules/FloodControl/StationMarker'
import { FloodEvents } from '@/mock/simData'
import type { RainfallFrame } from '@/mock/rainfallGrid'

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

// Cesium viewer 引用（用于降雨热力图）
const cesiumViewer = computed(() => (window as any).Gviewer)

// 降雨帧变化处理
const handleRainfallFrameChange = (frame: RainfallFrame | null) => {
  if (frame) {
    console.log(`降雨帧更新: ${frame.timestamp}, 最大雨强: ${frame.stats.maxRainfall}mm/h`)
  }
}

// ========== 时间轴动画控制 ==========
const isPlaying = ref(false)
const playSpeed = ref(1000)
const currentHour = ref(0)
const totalHours = 72 // 模拟72小时洪水演进
let playInterval: ReturnType<typeof setInterval> | null = null

// 模拟起始时间
const startTime = new Date('2025-09-01T00:00:00')

// 当前时间显示
const currentTimeDisplay = computed(() => {
  const current = new Date(startTime.getTime() + currentHour.value * 3600000)
  return current.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 进度百分比
const progressPercent = computed(() => (currentHour.value / totalHours) * 100)

// 时间刻度
const timeMarks = computed(() => {
  const marks = []
  for (let h = 0; h <= totalHours; h += 12) {
    const time = new Date(startTime.getTime() + h * 3600000)
    marks.push({
      hour: h,
      percent: (h / totalHours) * 100,
      label: `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:00`
    })
  }
  return marks
})

// 当前事件信息（模拟数据）
const currentEvent = computed(() => FloodEvents.find(e => e.id === eventState.id))
const currentEventName = computed(() => currentEvent.value?.name || '无')
const currentFloodArea = computed(() => {
  if (!currentEvent.value) return 0
  // 模拟淹没面积随时间变化
  const base = currentEvent.value.affectedArea
  const progress = currentHour.value / totalHours
  const peakAt = 0.4 // 峰值在40%时间点
  const factor = progress < peakAt
    ? progress / peakAt
    : 1 - (progress - peakAt) / (1 - peakAt) * 0.3
  return Math.round(base * factor)
})
const currentMaxDepth = computed(() => {
  const base = 3.5
  const progress = currentHour.value / totalHours
  const peakAt = 0.4
  const factor = progress < peakAt
    ? progress / peakAt
    : 1 - (progress - peakAt) / (1 - peakAt) * 0.5
  return (base * factor).toFixed(1)
})

// 播放控制
const togglePlay = () => {
  if (isPlaying.value) {
    stopPlay()
  } else {
    startPlay()
  }
}

const startPlay = () => {
  if (playInterval) clearInterval(playInterval)
  isPlaying.value = true
  playInterval = setInterval(() => {
    if (currentHour.value >= totalHours) {
      currentHour.value = 0
    } else {
      currentHour.value++
    }
  }, playSpeed.value)
}

const stopPlay = () => {
  isPlaying.value = false
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

const skipToStart = () => {
  currentHour.value = 0
}

const skipToEnd = () => {
  currentHour.value = totalHours
}

const skipBackward = () => {
  currentHour.value = Math.max(0, currentHour.value - 1)
}

const skipForward = () => {
  currentHour.value = Math.min(totalHours, currentHour.value + 1)
}

// 监听播放速度变化
watch(playSpeed, () => {
  if (isPlaying.value) {
    stopPlay()
    startPlay()
  }
})

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
  stopPlay() // 停止时间轴播放
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
    top: 120px;
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    pointer-events: auto;
    max-height: calc(100vh - 140px);
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

// 时间轴面板样式
.timeline-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 246, 255, 0.3);
  border-radius: 8px;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.2);
    background: rgba(0, 246, 255, 0.05);

    .timeline-title {
      font-size: 13px;
      color: #00f6ff;
      font-weight: 500;
    }

    .current-time {
      font-size: 14px;
      color: #fff;
    }
  }

  .timeline-body {
    padding: 12px 16px;
  }

  .timeline-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;

    .control-btn {
      width: 32px;
      height: 32px;
      background: transparent;
      border: 1px solid rgba(0, 246, 255, 0.3);
      border-radius: 4px;
      color: #00f6ff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 246, 255, 0.2);
        border-color: #00f6ff;
      }

      &.play {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(0, 246, 255, 0.1);
        border-color: #00f6ff;
      }
    }

    .speed-select {
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(0, 246, 255, 0.3);
      border-radius: 4px;
      color: #8eb9d9;
      font-size: 11px;
      cursor: pointer;
      outline: none;

      option {
        background: #0a0d1a;
      }
    }
  }

  .timeline-slider {
    margin-bottom: 12px;
    position: relative;

    .slider-track {
      position: relative;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: visible;

      .slider-progress {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, #00f6ff, #00c8ff);
        border-radius: 3px;
        transition: width 0.1s linear;
      }

      .slider-input {
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        height: 20px;
        transform: translateY(-50%);
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: #00f6ff;
          border-radius: 50%;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0, 246, 255, 0.6);
        }
      }
    }

    .time-marks {
      position: relative;
      height: 20px;
      margin-top: 8px;

      .time-mark {
        position: absolute;
        transform: translateX(-50%);
        font-size: 9px;
        color: #8eb9d9;
        white-space: nowrap;
      }
    }
  }

  .timeline-info {
    display: flex;
    justify-content: space-around;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 246, 255, 0.1);

    .info-item {
      text-align: center;

      .info-label {
        display: block;
        font-size: 10px;
        color: #8eb9d9;
        margin-bottom: 4px;
      }

      .info-value {
        font-size: 14px;
        color: #fff;
        font-weight: 500;

        &.warning {
          color: #ffbd2e;
        }
      }
    }
  }
}
</style>
