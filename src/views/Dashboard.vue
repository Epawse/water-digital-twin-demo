<template>
  <GlobalLayout>
    <div class="dashboard">
      <!-- 左侧面板区 -->
      <div class="panel-left">
        <ProjectOverview />
        <!-- 站点快捷操作 -->
        <div class="quick-stats tech-panel">
          <div class="panel-header">
            <span class="title">站点状态</span>
          </div>
          <div class="stat-row" v-for="item in stationStats" :key="item.label">
            <span class="stat-icon">{{ item.icon }}</span>
            <span class="stat-label">{{ item.label }}</span>
            <span class="stat-value" :class="item.status">{{ item.value }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧工具栏 -->
      <div class="panel-right">
        <div class="toolbar-container">
          <div class="toolbar-btn" @click="isPanelExpanded = !isPanelExpanded" :class="{ 'is-active': isPanelExpanded }" title="底图与风格">
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
    </div>
  </GlobalLayout>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, computed } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import ProjectOverview from '@/components/ProjectOverview.vue'
import { fetchSensors, fetchWarnings, fetchIoTDevices } from '@/api/backend'

declare const Cesium: any

const isPanelExpanded = ref(false)
const sensors = ref<any[]>([])
const warnings = ref<any[]>([])
const iotDevices = ref<any[]>([])
const sensorEntities: any[] = []

// 站点统计数据
const stationStats = computed(() => {
  const reservoirs = sensors.value.filter((s) => s.code?.startsWith('res_'))
  const hydro = sensors.value.filter((s) => s.code?.startsWith('hyd_'))
  const rain = sensors.value.filter((s) => s.code?.startsWith('rain_'))
  const onlineDevices = iotDevices.value.filter((d) => d.status === 'online')

  return [
    { icon: '🏊', label: '水库站', value: `${reservoirs.length} 座`, status: 'normal' },
    { icon: '📊', label: '水文站', value: `${hydro.length} 座`, status: 'normal' },
    { icon: '🌧️', label: '雨量站', value: `${rain.length} 座`, status: 'normal' },
    { icon: '⚠️', label: '预警数', value: `${warnings.value.length} 条`, status: warnings.value.length > 0 ? 'warning' : 'normal' },
    { icon: '📡', label: '在线设备', value: `${onlineDevices.length}/${iotDevices.value.length}`, status: 'normal' },
  ]
})

const filterState = reactive({
  enabled: true,
  color: '#4E70A6'
})

const presetColors = [
  '#4E70A6', // 默认蓝
  '#409EFF', // 亮蓝
  '#00FFFF', // 赛博青
  '#001529', // 深空蓝
  '#1A237E', // 科技深蓝
  '#26C6DA', // 亮青
]

const mapState = reactive({
  type: 'amap'
})

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

const flyToXinjiang = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(85, 41.5, 3000000),
    duration: 1.5
  })
}

const truncateCode = (code: string) => {
  if (!code) return ''
  return code.length > 18 ? `${code.slice(0, 8)}...${code.slice(-6)}` : code
}

const addSensorMarkers = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  // clear previous
  sensorEntities.forEach((e) => viewer.entities.remove(e))
  sensorEntities.length = 0
  sensors.value
    .filter((s) => s.lng && s.lat)
    .forEach((s) => {
      const labelText = truncateCode(s.code)
      const ent = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(s.lng, s.lat, 10),
        point: {
          pixelSize: 8,
          color: s.is_simulated ? Cesium.Color.CYAN.withAlpha(0.6) : Cesium.Color.LIME,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: labelText,
          font: '11px sans-serif',
          pixelOffset: new Cesium.Cartesian2(0, -15),
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1,
          showBackground: true,
          backgroundColor: s.is_simulated ? Cesium.Color.fromCssColorString('#0ff').withAlpha(0.3) : Cesium.Color.fromCssColorString('#0f0').withAlpha(0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      sensorEntities.push(ent)
    })
}

onMounted(async () => {
  const timer = setInterval(() => {
    if (initGlobeFilter()) {
      clearInterval(timer)
      flyToXinjiang()
    }
  }, 300)
  sensors.value = await fetchSensors()
  warnings.value = await fetchWarnings()
  iotDevices.value = await fetchIoTDevices()
  addSensorMarkers()
})
</script>

<style scoped lang="scss">
.dashboard {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.panel-left {
  position: absolute;
  left: 110px;
  top: 120px;
  width: 280px;
  pointer-events: auto;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 246, 255, 0.3); border-radius: 2px; }
}

.quick-stats {
  padding: 12px;

  .panel-header {
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.2);

    .title {
      font-size: 13px;
      font-weight: bold;
      color: #00f6ff;
    }
  }

  .stat-row {
    display: flex;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    &:last-child { border-bottom: none; }

    .stat-icon {
      font-size: 14px;
      margin-right: 8px;
    }

    .stat-label {
      flex: 1;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    .stat-value {
      font-size: 12px;
      font-family: 'Courier New', monospace;
      color: #00f6ff;

      &.warning { color: #ffbd2e; }
      &.danger { color: #f44336; }
    }
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
</style>
