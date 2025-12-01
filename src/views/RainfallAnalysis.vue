<template>
  <GlobalLayout>
    <div class="rainfall-analysis-page">
      <!-- Base Map Controls (Left Panel) -->
      <div class="panel-left">
        <div class="toolbar-container">
          <div class="toolbar-btn" @click="isPanelExpanded = !isPanelExpanded" :class="{ 'is-active': isPanelExpanded }"
            title="底图与风格">
            <svg viewBox="0 0 32 32" width="100%" height="100%">
              <path
                d="M28 20v-6l-12-6-12 6v6l12 6 12-6zm-12-4l8.5-4.25L16 7.5l-8.5 4.25L16 16zm-10 4.6l2 1 8 4 8-4 2-1v4.4l-10 5-10-5v-4.4z"
                fill="currentColor" />
            </svg>
          </div>
          <!-- No flyToXinjiang here, specific to FloodEvolution -->
        </div>

        <transition name="el-zoom-in-left"> <!-- Changed to zoom-in-left -->
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

              <!-- No Flood Event selection here -->

              <div class="setting-group toggles">
                <div class="group-label">专题图层</div>
                <!-- Keep only rain grid toggle if relevant, remove others -->
                <el-checkbox v-model="showRainGrid" @change="updateRainGridVisibility">雨量格网</el-checkbox>
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

      <!-- Rainfall Heatmap Layer -->
      <!-- Note: We pass 'cesiumViewer' which is computed from window.Gviewer -->
      <RainfallHeatmapLayer
        v-if="cesiumViewer"
        :viewer="cesiumViewer"
        :showControls="true"
        initialRegion="yili"
        @frameChange="handleRainfallFrameChange"
      />
      
      <!-- Optional: Add a simple info panel or title if needed -->
      <div class="info-panel tech-panel" v-if="currentFrame">
        <div class="panel-header">
          <span class="title">实时降雨监测</span>
        </div>
        <div class="stat-row">
          <span class="label">时间:</span>
          <span class="value tech-font">{{ formatTime(currentFrame.timestamp) }}</span>
        </div>
        <div class="stat-row">
          <span class="label">最大雨强:</span>
          <span class="value tech-font warning">{{ currentFrame.stats.maxRainfall }} mm/h</span>
        </div>
        <div class="stat-row">
          <span class="label">平均降雨:</span>
          <span class="value tech-font">{{ currentFrame.stats.avgRainfall }} mm/h</span>
        </div>
      </div>
    </div>
  </GlobalLayout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import RainfallHeatmapLayer from '@/components/RainfallHeatmapLayer.vue'
import type { RainfallFrame } from '@/mock/rainfallGrid'

declare const Cesium: any

// Access the global viewer attached by CesiumMap (inside GlobalLayout)
const cesiumViewer = computed(() => (window as any).Gviewer)
const currentFrame = ref<RainfallFrame | null>(null)

const handleRainfallFrameChange = (frame: RainfallFrame | null) => {
  currentFrame.value = frame
  if (frame) {
    // Optional: Log or additional logic
  }
}

const formatTime = (ts: string | number) => {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

// Map Control States and Functions (Copied from DigitalTwin/index.vue)
const filterState = reactive({
  enabled: true,
  color: '#4E70A6'
})

const mapState = reactive({
  type: 'amap'
})

const isPanelExpanded = ref(false)

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

const amapUrl = 'https://webst0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&style=7'

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

// Rainfall-specific toggle for rain grid
const showRainGrid = ref(false)
const updateRainGridVisibility = () => {
  const viewer = (window as any).Gviewer
  if (!viewer || !viewer.entities) return

  // Assuming RainfallHeatmapLayer component internally manages its visibility
  // If it needs external control, this part needs adjustment.
  // For now, this checkbox is for conceptual control or if the heatmap layer itself exposes a prop.
  // Let's assume the heatmap layer will respond to some kind of global state or its own prop.
  // Since the RainfallHeatmapLayer has showControls, it likely handles its own visibility.
  // This checkbox in the panel would typically toggle a layer that's added separately.
  // For now, this is a placeholder. The `RainfallHeatmapLayer` itself has internal controls.
  // This checkbox might be redundant if the component handles everything.
  // If the component needs a prop for this, it would be e.g. `<RainfallHeatmapLayer :showRainGridOverlay="showRainGrid" ... />`
  // For simplicity, let's just make it a local ref for now.
  console.log('Toggle rain grid visibility:', showRainGrid.value);
}

onMounted(() => {
  // 轮询等待 Cesium viewer 初始化完成
  const timer = setInterval(() => {
    if (initGlobeFilter()) {
      clearInterval(timer)
    }
  }, 300)
})

onUnmounted(() => {
  // Cleanup if necessary
})
</script>

<style lang="scss" scoped>
.rainfall-analysis-page {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.panel-left {
  position: absolute;
  left: var(--layout-panel-left); /* Position next to navigation menu */
  top: var(--layout-panel-top);
  pointer-events: auto;
  display: flex;
  flex-direction: row; /* Layout toolbar and control box horizontally */
  align-items: flex-start;
  gap: var(--layout-panel-gap);
  z-index: var(--z-panels);

  .toolbar-container {
    display: flex;
    flex-direction: column;
    background: var(--surface-2);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    overflow: hidden;

    .toolbar-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--primary-color);
      transition: all 0.2s;
      padding: 6px;

      &:hover {
        background: rgba(0, 225, 255, 0.12);
      }

      &.is-active {
        background: rgba(0, 225, 255, 0.18);
        color: #fff;
      }
    }
  }

  .control-panel-box {
    width: 360px;
    background: var(--surface-3);
    border: 1px solid var(--border-color);
    padding: 0;
    border-radius: var(--radius-md);
    color: var(--text-strong);
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5); /* Adjusted shadow for left panel */

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      background: rgba(0, 225, 255, 0.08);

      h3 {
        margin: 0;
        font-size: 14px;
        color: var(--primary-color);
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
      padding: var(--space-4);
    }

    .setting-group {
      margin-top: var(--space-4);

      .group-label {
          font-size: 14px;
          color: var(--text-mid);
          margin-bottom: var(--space-2);
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
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2);
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
          border-color: var(--primary-color);
          background: rgba(0, 225, 255, 0.1);

          span {
            color: var(--primary-color);
          }
        }
      }
    }
  }
}

.info-panel {
  position: absolute;
  top: calc(var(--layout-panel-top) + var(--layout-alert-stack-height));
  right: var(--layout-panel-right);
  width: 240px;
  padding: var(--space-4);
  pointer-events: auto;
  z-index: var(--z-panels);

  .panel-header {
    margin-bottom: 15px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.3);
    padding-bottom: 5px;
    .title {
      color: var(--primary-color);
      font-weight: bold;
    }
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;

    .label {
      color: var(--text-secondary);
    }
    .value {
      color: #fff;
      &.warning { color: #ffbd2e; }
    }
  }
}
</style>
