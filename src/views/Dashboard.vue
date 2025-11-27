<template>
  <GlobalLayout>
    <div class="dashboard">
      <div class="panel-left">
        <ProjectOverview />
      </div>

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
import { onMounted, reactive, ref } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import ProjectOverview from '@/components/ProjectOverview.vue'
import { StationMarkerManager } from '@/modules/FloodControl/StationMarker'

declare const Cesium: any

const isPanelExpanded = ref(false)

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

const ensureStationMarkers = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  const cache = (window as any).__stationMarkerManager
  if (cache) return
  const mgr = new StationMarkerManager(viewer)
  mgr.init()
  ;(window as any).__stationMarkerManager = mgr
}

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
      ensureStationMarkers()
      showStationMarkers()
      flyToXinjiang()
    }
  }, 300)
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
  width: 320px;
  pointer-events: auto;
  z-index: 30;
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
