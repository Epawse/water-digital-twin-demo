<template>
  <GlobalLayout>
    <div class="data-management-page">
      <!-- 左侧主面板 -->
      <div class="panel-main" :class="{ collapsed: isPanelCollapsed }">
        <div class="panel-header" @click="isPanelCollapsed = !isPanelCollapsed">
          <div class="header-content">
            <h2>数据与模型管理</h2>
            <p v-if="!isPanelCollapsed">集中管理模拟数据源与配置，供各页面调度使用</p>
          </div>
          <span class="collapse-btn" :class="{ collapsed: isPanelCollapsed }">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
            </svg>
          </span>
        </div>

        <template v-if="!isPanelCollapsed">
          <!-- 标签页切换 -->
          <div class="tab-bar">
            <div class="tab-item" :class="{ active: activeTab === 'stations' }" @click="activeTab = 'stations'">
              <span class="tab-icon">📍</span>监测站点
              <span class="tab-count">{{ stations.length }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab === 'floods' }" @click="activeTab = 'floods'">
              <span class="tab-icon">🌊</span>洪水事件
              <span class="tab-count">{{ events.length }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab === 'iot' }" @click="activeTab = 'iot'">
              <span class="tab-icon">📡</span>IoT设备
              <span class="tab-count">{{ iotDevices.length }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab === 'models' }" @click="activeTab = 'models'">
              <span class="tab-icon">🏗️</span>三维资源
              <span class="tab-count">{{ models.length }}</span>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="panel-content">
            <!-- 监测站点 -->
            <div v-show="activeTab === 'stations'" class="content-section">
              <div class="section-header">
                <span>二维模拟数据 · 站点</span>
                <div class="filter-group">
                  <span class="filter-btn" :class="{ active: stationFilter === 'all' }" @click="stationFilter = 'all'">全部</span>
                  <span class="filter-btn" :class="{ active: stationFilter === 'reservoir' }" @click="stationFilter = 'reservoir'">水库</span>
                  <span class="filter-btn" :class="{ active: stationFilter === 'hydrological' }" @click="stationFilter = 'hydrological'">水文</span>
                  <span class="filter-btn" :class="{ active: stationFilter === 'rain' }" @click="stationFilter = 'rain'">雨量</span>
                </div>
              </div>
              <div class="data-list">
                <div class="list-header">
                  <span class="col-name">名称</span>
                  <span class="col-type">类型</span>
                  <span class="col-coord">坐标</span>
                  <span class="col-status">状态</span>
                  <span class="col-data">数据</span>
                </div>
                <div class="list-body">
                  <div class="list-row" v-for="s in filteredStations" :key="s.id" @click="locateStation(s)">
                    <span class="col-name">{{ s.name }}</span>
                    <span class="col-type">
                      <span class="type-tag" :class="s.type">{{ typeLabel(s.type) }}</span>
                    </span>
                    <span class="col-coord">{{ s.lng.toFixed(2) }}°E, {{ s.lat.toFixed(2) }}°N</span>
                    <span class="col-status">
                      <span class="status-dot" :class="s.status"></span>
                      {{ statusLabel(s.status) }}
                    </span>
                    <span class="col-data">
                      <template v-if="s.type === 'reservoir'">
                        水位 <b>{{ s.waterLevel }}</b>m / 警戒 {{ s.warningLevel }}m
                      </template>
                      <template v-else-if="s.type === 'hydrological'">
                        水位 <b>{{ s.waterLevel }}</b>m / 警戒 {{ s.warningLevel }}m
                      </template>
                      <template v-else>
                        降雨 <b>{{ s.rainfall }}</b>mm / 累计 {{ s.rainfallTotal }}mm
                      </template>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 洪水事件 -->
            <div v-show="activeTab === 'floods'" class="content-section">
              <div class="section-header">
                <span>洪水事件配置</span>
              </div>
              <div class="data-list">
                <div class="list-header floods">
                  <span class="col-name">事件名称</span>
                  <span class="col-level">等级</span>
                  <span class="col-time">时间窗</span>
                  <span class="col-region">区域</span>
                </div>
                <div class="list-body">
                  <div class="list-row flood-row" v-for="e in events" :key="e.id" @click="locateFlood(e)">
                    <span class="col-name">{{ e.name }}</span>
                    <span class="col-level">
                      <span class="level-tag" :class="e.severity">{{ severityLabel(e.severity) }}</span>
                    </span>
                    <span class="col-time">{{ fmtTime(e.start) }} ~ {{ fmtTime(e.end) }}</span>
                    <span class="col-region">{{ e.region }}</span>
                  </div>
                </div>
              </div>

              <!-- 降雨格网 -->
              <div class="section-header" style="margin-top: 20px;">
                <span>降雨格网 / 雷达帧</span>
              </div>
              <div class="data-list compact">
                <div class="list-body">
                  <div class="list-row compact-row" v-for="r in rainFrames" :key="r.id">
                    <span class="col-id">{{ r.id }}</span>
                    <span class="col-time">{{ fmtTime(r.time) }}</span>
                    <span class="col-coverage">{{ r.coverage }}</span>
                    <span class="col-file">{{ r.grid }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- IoT设备 -->
            <div v-show="activeTab === 'iot'" class="content-section">
              <div class="section-header">
                <span>IoT 设备 / 协议</span>
                <div class="filter-group">
                  <span class="filter-btn" :class="{ active: iotFilter === 'all' }" @click="iotFilter = 'all'">全部</span>
                  <span class="filter-btn" :class="{ active: iotFilter === 'online' }" @click="iotFilter = 'online'">在线</span>
                  <span class="filter-btn" :class="{ active: iotFilter === 'offline' }" @click="iotFilter = 'offline'">离线</span>
                </div>
              </div>
              <div class="data-list">
                <div class="list-header iot">
                  <span class="col-device">设备</span>
                  <span class="col-protocol">协议</span>
                  <span class="col-station">站点</span>
                  <span class="col-metrics">指标</span>
                  <span class="col-freq">频率</span>
                  <span class="col-status">状态</span>
                </div>
                <div class="list-body">
                  <div class="list-row" v-for="d in filteredIoT" :key="d.id">
                    <span class="col-device">{{ d.name }}</span>
                    <span class="col-protocol">
                      <span class="protocol-tag">{{ d.protocol }}</span>
                    </span>
                    <span class="col-station">{{ d.stationId }}</span>
                    <span class="col-metrics">{{ d.metrics.join(', ') }}</span>
                    <span class="col-freq">{{ d.freqSec }}s</span>
                    <span class="col-status">
                      <span class="status-dot" :class="d.status"></span>
                      {{ d.status === 'online' ? '在线' : '离线' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 三维资源 -->
            <div v-show="activeTab === 'models'" class="content-section">
              <div class="section-header">
                <span>三维资源清单</span>
              </div>
              <div class="model-cards">
                <div class="model-card" v-for="m in models" :key="m.id" @click="locateModel(m)">
                  <div class="model-icon">🏢</div>
                  <div class="model-info">
                    <div class="model-name">{{ m.name }}</div>
                    <div class="model-source">来源: {{ m.source }}</div>
                    <div class="model-location">
                      位置: {{ m.target.lng.toFixed(2) }}°E, {{ m.target.lat.toFixed(2) }}°N, {{ m.target.height }}m
                    </div>
                    <div class="model-url">{{ m.tilesetUrl }}</div>
                    <div class="model-note" v-if="m.note">{{ m.note }}</div>
                  </div>
                  <div class="model-action">
                    <span class="action-btn">定位</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 右侧工具栏与底图控制面板 -->
      <div class="panel-right">
        <div class="toolbar-container">
          <div class="toolbar-btn" @click="isMapPanelExpanded = !isMapPanelExpanded" :class="{ 'is-active': isMapPanelExpanded }" title="底图与风格">
            <svg viewBox="0 0 32 32" width="100%" height="100%">
              <path d="M28 20v-6l-12-6-12 6v6l12 6 12-6zm-12-4l8.5-4.25L16 7.5l-8.5 4.25L16 16zm-10 4.6l2 1 8 4 8-4 2-1v4.4l-10 5-10-5v-4.4z" fill="currentColor" />
            </svg>
          </div>
          <div class="toolbar-btn" @click="flyToXinjiang" title="定位新疆">
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
            </svg>
          </div>
        </div>

        <transition name="el-zoom-in-right">
          <div class="control-panel-box" v-show="isMapPanelExpanded">
            <div class="panel-header">
              <h3>底图控制</h3>
              <span class="close-btn" @click="isMapPanelExpanded = false">×</span>
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
                <div class="group-label">底图样式</div>
                <div class="basemap-list">
                  <div class="basemap-item" :class="{ active: mapState.type === 'amap' }" @click="mapState.type = 'amap'; toggleBaseMap('amap')">
                    <div class="thumb amap"></div>
                    <span>高德</span>
                  </div>
                  <div class="basemap-item" :class="{ active: mapState.type === 'tdt_vec' }" @click="mapState.type = 'tdt_vec'; toggleBaseMap('tdt_vec')">
                    <div class="thumb vec"></div>
                    <span>矢量</span>
                  </div>
                  <div class="basemap-item" :class="{ active: mapState.type === 'tdt_ter' }" @click="mapState.type = 'tdt_ter'; toggleBaseMap('tdt_ter')">
                    <div class="thumb ter"></div>
                    <span>地形</span>
                  </div>
                  <div class="basemap-item" :class="{ active: mapState.type === 'tdt_img' }" @click="mapState.type = 'tdt_img'; toggleBaseMap('tdt_img')">
                    <div class="thumb img"></div>
                    <span>影像</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 右下角统计面板 -->
      <div class="panel-stats">
        <div class="stat-card">
          <div class="stat-icon reservoir">💧</div>
          <div class="stat-info">
            <div class="stat-value">{{ reservoirCount }}</div>
            <div class="stat-label">水库站</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon hydro">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ hydroCount }}</div>
            <div class="stat-label">水文站</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon rain">🌧️</div>
          <div class="stat-info">
            <div class="stat-value">{{ rainCount }}</div>
            <div class="stat-label">雨量站</div>
          </div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon warn">⚠️</div>
          <div class="stat-info">
            <div class="stat-value">{{ warningCount }}</div>
            <div class="stat-label">预警站点</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon iot">📡</div>
          <div class="stat-info">
            <div class="stat-value">{{ onlineIoTCount }}/{{ iotDevices.length }}</div>
            <div class="stat-label">IoT在线</div>
          </div>
        </div>
      </div>
    </div>
  </GlobalLayout>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import { SimStations, FloodEvents, RainGridFrames, ThreeDResources, IoTDevices } from '@/mock/simData'
import type { Station, FloodEvent, RainGridFrame, ThreeDResource, IoTDevice } from '@/mock/simData'

declare const Cesium: any

const stations: Station[] = SimStations
const events: FloodEvent[] = FloodEvents
const rainFrames: RainGridFrame[] = RainGridFrames
const models: ThreeDResource[] = ThreeDResources
const iotDevices: IoTDevice[] = IoTDevices

// 面板状态
const isPanelCollapsed = ref(false)
const isMapPanelExpanded = ref(false)
const activeTab = ref<'stations' | 'floods' | 'iot' | 'models'>('stations')
const stationFilter = ref<'all' | 'reservoir' | 'hydrological' | 'rain'>('all')
const iotFilter = ref<'all' | 'online' | 'offline'>('all')

// ========== 底图处理逻辑（与首页保持一致）==========
const filterState = reactive({
  enabled: true,
  color: '#4E70A6'
})

const mapState = reactive({
  type: 'amap'
})

const presetColors = [
  '#4E70A6', // 默认蓝
  '#409EFF', // 亮蓝
  '#00FFFF', // 赛博青
  '#001529', // 深空蓝
  '#1A237E', // 科技深蓝
  '#26C6DA', // 亮青
]

const tdtKey = '23cffd438607efdc57c79b679ac2bae9'
let originalLayers: any[] = []
const mapLayers: Record<string, any[]> = {
  amap: [],
  tdt_vec: [],
  tdt_ter: [],
  tdt_img: []
}

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
  const activeLayers = mapLayers[mapState.type] || []
  applyLayerStyle(activeLayers, filterState.enabled ? baseInkStyle : baseColorStyle)
  globe.filterExposure = 1.25
  globe.filterContrast = 1.1
}

const ensureTdtLayers = (val: string) => {
  const viewer = (window as any).Gviewer
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

const toggleBaseMap = (val: string) => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  hideAllBaseLayers()
  const targetLayers = val === 'amap' ? mapLayers.amap : ensureTdtLayers(val)
  targetLayers.forEach((layer: any) => {
    layer.show = true
  })
  updateUniforms()
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
// ========== 底图处理逻辑结束 ==========

const filteredStations = computed(() => {
  if (stationFilter.value === 'all') return stations
  return stations.filter(s => s.type === stationFilter.value)
})

const filteredIoT = computed(() => {
  if (iotFilter.value === 'all') return iotDevices
  return iotDevices.filter(d => d.status === iotFilter.value)
})

const reservoirCount = computed(() => stations.filter(s => s.type === 'reservoir').length)
const hydroCount = computed(() => stations.filter(s => s.type === 'hydrological').length)
const rainCount = computed(() => stations.filter(s => s.type === 'rain').length)
const warningCount = computed(() => stations.filter(s => s.status === 'warning' || s.status === 'danger').length)
const onlineIoTCount = computed(() => iotDevices.filter(d => d.status === 'online').length)

const typeLabel = (t: Station['type']) => {
  if (t === 'reservoir') return '水库'
  if (t === 'hydrological') return '水文'
  return '雨量'
}

const statusLabel = (s: Station['status']) => {
  if (s === 'normal') return '正常'
  if (s === 'warning') return '预警'
  return '危险'
}

const severityLabel = (s: FloodEvent['severity']) => {
  if (s === 'mild') return '轻度'
  if (s === 'medium') return '中度'
  return '严重'
}

const fmtTime = (iso: string) => {
  return iso.replace('T', ' ').replace(':00Z', '').substring(5)
}

const flyToXinjiang = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(85, 41.5, 3000000),
    duration: 1.5
  })
}

const locateStation = (s: Station) => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(s.lng, s.lat, 50000),
    duration: 1.5
  })
}

const locateFlood = (e: FloodEvent) => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(e.center.lng, e.center.lat, 200000),
    duration: 1.5
  })
}

const locateModel = (m: ThreeDResource) => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(m.target.lng, m.target.lat, m.target.height + 2000),
    duration: 1.5
  })
}

// 隐藏其他页面残留
const hideCachedFloodLayers = () => {
  const cache = (window as any).__floodLayerCache
  if (cache) {
    Object.values(cache).forEach((set: any) => {
      Object.values(set).forEach((layer: any) => {
        if (layer) layer.show = false
      })
    })
  }
}

const hideCachedBimTileset = () => {
  const tileset = (window as any).__bimTileset
  if (tileset) tileset.show = false
}

const showStationMarkers = () => {
  const mgr: any = (window as any).__stationMarkerManager
  if (mgr && mgr.entities) {
    mgr.entities.forEach((e: any) => { e.show = true })
  }
}

onMounted(() => {
  const timer = setInterval(() => {
    if (initGlobeFilter()) {
      clearInterval(timer)
      hideCachedFloodLayers()
      hideCachedBimTileset()
      showStationMarkers()
    }
  }, 300)
})
</script>

<style scoped lang="scss">
.data-management-page {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.panel-main {
  position: absolute;
  left: 110px;
  top: 100px;
  width: 850px;
  max-height: calc(100vh - 120px);
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  transition: width 0.3s ease;

  &.collapsed {
    width: 280px;

    .panel-header {
      cursor: pointer;

      h2 {
        font-size: 14px;
      }
    }
  }

  .panel-header {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.15);
    background: rgba(0, 246, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;

    &:hover {
      background: rgba(0, 246, 255, 0.08);
    }

    .header-content {
      flex: 1;

      h2 {
        margin: 0;
        font-size: 16px;
        color: #00f6ff;
        font-weight: 500;
      }

      p {
        margin: 4px 0 0;
        font-size: 12px;
        color: #8eb9d9;
      }
    }

    .collapse-btn {
      color: #00f6ff;
      transition: transform 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;

      &.collapsed {
        transform: rotate(180deg);
      }
    }
  }
}

.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(0, 246, 255, 0.15);
  background: rgba(0, 20, 40, 0.5);
}

.tab-item {
  flex: 1;
  padding: 10px 12px;
  text-align: center;
  color: #8eb9d9;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  .tab-icon {
    font-size: 12px;
  }

  .tab-count {
    background: rgba(0, 246, 255, 0.15);
    padding: 1px 6px;
    border-radius: 8px;
    font-size: 10px;
  }

  &:hover {
    background: rgba(0, 246, 255, 0.08);
    color: #d7e8ff;
  }

  &.active {
    color: #00f6ff;
    border-bottom-color: #00f6ff;
    background: rgba(0, 246, 255, 0.1);

    .tab-count {
      background: rgba(0, 246, 255, 0.3);
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 246, 255, 0.3);
    border-radius: 3px;
    &:hover {
      background: rgba(0, 246, 255, 0.5);
    }
  }
}

.content-section {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  span {
    font-size: 13px;
    color: #00f6ff;
    font-weight: 500;
  }
}

.filter-group {
  display: flex;
  gap: 4px;
}

.filter-btn {
  padding: 3px 10px;
  font-size: 11px;
  color: #8eb9d9;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 246, 255, 0.1);
    border-color: rgba(0, 246, 255, 0.3);
  }

  &.active {
    background: rgba(0, 246, 255, 0.2);
    border-color: #00f6ff;
    color: #00f6ff;
  }
}

.data-list {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 246, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.list-header {
  display: grid;
  grid-template-columns: 1.5fr 0.7fr 1.2fr 0.7fr 2fr;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(0, 246, 255, 0.08);
  font-size: 11px;
  color: #8eb9d9;
  font-weight: 500;

  &.floods {
    grid-template-columns: 1.5fr 0.8fr 1.5fr 1fr;
  }

  &.iot {
    grid-template-columns: 1.5fr 1fr 1fr 1.2fr 0.6fr 0.8fr;
  }
}

.list-body {
  max-height: 320px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 246, 255, 0.2);
    border-radius: 2px;
  }
}

.list-row {
  display: grid;
  grid-template-columns: 1.5fr 0.7fr 1.2fr 0.7fr 2fr;
  gap: 6px;
  padding: 8px 10px;
  font-size: 11px;
  color: #d7e8ff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 246, 255, 0.08);
  }

  &:last-child {
    border-bottom: none;
  }

  &.flood-row {
    grid-template-columns: 1.5fr 0.8fr 1.5fr 1fr;
  }

  &.compact-row {
    grid-template-columns: 1fr 1fr 0.8fr 2fr;
    padding: 6px 10px;
  }

  b {
    color: #00f6ff;
  }
}

.list-row:nth-child(2n) {
  background: rgba(255, 255, 255, 0.02);
}

.type-tag {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;

  &.reservoir {
    background: rgba(0, 200, 255, 0.15);
    color: #00c8ff;
  }
  &.hydrological {
    background: rgba(0, 255, 150, 0.15);
    color: #00ff96;
  }
  &.rain {
    background: rgba(150, 100, 255, 0.15);
    color: #9664ff;
  }
}

.level-tag {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;

  &.mild {
    background: rgba(0, 200, 255, 0.15);
    color: #00c8ff;
  }
  &.medium {
    background: rgba(255, 180, 0, 0.15);
    color: #ffb400;
  }
  &.severe {
    background: rgba(255, 80, 80, 0.15);
    color: #ff5050;
  }
}

.protocol-tag {
  padding: 2px 6px;
  background: rgba(0, 246, 255, 0.1);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 3px;
  font-size: 9px;
  color: #00f6ff;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;

  &.normal, &.online {
    background: #00ff96;
    box-shadow: 0 0 4px rgba(0, 255, 150, 0.5);
  }
  &.warning {
    background: #ffb400;
    box-shadow: 0 0 4px rgba(255, 180, 0, 0.5);
  }
  &.danger, &.offline {
    background: #ff5050;
    box-shadow: 0 0 4px rgba(255, 80, 80, 0.5);
  }
}

.data-list.compact {
  margin-top: 8px;

  .list-body {
    max-height: 120px;
  }
}

.model-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.model-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 246, 255, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 246, 255, 0.08);
    border-color: rgba(0, 246, 255, 0.3);
  }

  .model-icon {
    font-size: 28px;
    line-height: 1;
  }

  .model-info {
    flex: 1;

    .model-name {
      font-size: 13px;
      color: #fff;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .model-source, .model-location {
      font-size: 11px;
      color: #8eb9d9;
      margin-bottom: 2px;
    }

    .model-url {
      font-size: 10px;
      color: #5a8ab5;
      word-break: break-all;
    }

    .model-note {
      font-size: 10px;
      color: #00f6ff;
      margin-top: 4px;
      padding: 3px 6px;
      background: rgba(0, 246, 255, 0.1);
      border-radius: 3px;
      display: inline-block;
    }
  }

  .model-action {
    display: flex;
    align-items: center;

    .action-btn {
      padding: 5px 12px;
      background: rgba(0, 246, 255, 0.15);
      border: 1px solid rgba(0, 246, 255, 0.3);
      border-radius: 4px;
      color: #00f6ff;
      font-size: 11px;
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 246, 255, 0.25);
      }
    }
  }
}

// 右侧工具栏与底图控制面板
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
  width: 300px;
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
      font-size: 13px;
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

  .basemap-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .basemap-item {
      cursor: pointer;
      text-align: center;
      border: 1px solid transparent;
      border-radius: 4px;
      padding: 6px;
      transition: all 0.3s;

      .thumb {
        height: 50px;
        width: 100%;
        background-color: #333;
        border-radius: 4px;
        margin-bottom: 6px;
        background-size: cover;
        background-position: center;
        position: relative;
        overflow: hidden;
      }

      .thumb.vec { background: #e0e0e0; }
      .thumb.ter { background: #5a6b48; }
      .thumb.img { background: #0a1a2a; }
      .thumb.amap {
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
        font-size: 11px;
        color: #ccc;
      }

      &.active {
        border-color: #00f6ff;
        box-shadow: 0 0 10px rgba(0, 246, 255, 0.2);
      }

      &:hover {
        transform: translateY(-2px);
        border-color: rgba(0, 246, 255, 0.4);
      }
    }
  }
}

// 右下角统计面板
.panel-stats {
  position: absolute;
  right: 20px;
  bottom: 30px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  pointer-events: auto;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 6px;
  backdrop-filter: blur(8px);

  &.warning {
    border-color: rgba(255, 180, 0, 0.3);
    background: rgba(40, 30, 0, 0.9);
  }

  .stat-icon {
    font-size: 20px;
    line-height: 1;
  }

  .stat-info {
    .stat-value {
      font-size: 16px;
      color: #00f6ff;
      font-weight: 600;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 10px;
      color: #8eb9d9;
    }
  }
}

// IoT 表格适配
.list-header.iot + .list-body .list-row {
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr 0.6fr 0.8fr;
}
</style>
