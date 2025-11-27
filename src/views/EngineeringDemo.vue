<template>
  <GlobalLayout>
    <div class="page">
      <div class="panel-left">
        <div class="panel">
          <h2>工程 / BIM 演示（新疆模拟）</h2>
          <p>加载开源深圳场景并重定位到新疆示例点，演示模型展示与监测状态。</p>
          <div class="section">
            <div class="label">模型</div>
            <div class="value">{{ model.name }}</div>
            <div class="meta">{{ model.source }}</div>
          </div>
          <div class="section">
            <div class="label">目标位置</div>
            <div class="value">{{ model.target.lng.toFixed(2) }}, {{ model.target.lat.toFixed(2) }}, {{ model.target.height }}m</div>
          </div>
          <div class="section warn" v-if="loadError">
            <div class="value">{{ loadError }}</div>
          </div>
          <div class="actions">
            <button class="btn" :disabled="loadingTileset" @click="flyToModel">
              {{ loadingTileset ? '加载中...' : '定位模型' }}
            </button>
            <button class="btn ghost" :disabled="loadingTileset" @click="toggleTilesetVisibility">{{ tilesetVisible ? '隐藏' : '显示' }}</button>
          </div>
          <div class="note">{{ model.note }}</div>
        </div>
      </div>

      <!-- 右侧工具栏与底图控制面板 -->
      <div class="panel-right">
        <div class="toolbar-container">
          <div class="toolbar-btn" @click="isPanelExpanded = !isPanelExpanded" :class="{ 'is-active': isPanelExpanded }" title="底图与风格">
            <svg viewBox="0 0 32 32" width="100%" height="100%">
              <path d="M28 20v-6l-12-6-12 6v6l12 6 12-6zm-12-4l8.5-4.25L16 7.5l-8.5 4.25L16 16zm-10 4.6l2 1 8 4 8-4 2-1v4.4l-10 5-10-5v-4.4z" fill="currentColor" />
            </svg>
          </div>
          <div class="toolbar-btn" @click="flyToModel" title="定位模型">
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
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import { ThreeDResources } from '@/mock/simData'

declare const Cesium: any

const model = ThreeDResources[0]
const tilesetRef = ref<any>(null)
const tilesetVisible = ref(true)
const loadingTileset = ref(false)
const loadError = ref('')

// ========== 底图处理逻辑（与首页/洪水演进页保持一致）==========
const isPanelExpanded = ref(false)

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

const loadTilesetOnce = async () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  if (!model || !model.tilesetUrl) {
    loadError.value = '未配置模型资源'
    return
  }
  if (loadingTileset.value) return
  // 避免重复加载：如果已有标记则直接引用
  if ((window as any).__bimTileset) {
    tilesetRef.value = (window as any).__bimTileset
    tilesetRef.value.show = true
    tilesetVisible.value = true
    return
  }
  loadError.value = ''
  loadingTileset.value = true
  const tileset = new Cesium.Cesium3DTileset({
    url: model.tilesetUrl,
    maximumScreenSpaceError: 2,
    maximumNumberOfLoadedTiles: 256,
    shadows: Cesium.ShadowMode.DISABLED
  })
  const primitive = viewer.scene.primitives.add(tileset)
  const onReady = () => {
    const target = Cesium.Cartesian3.fromDegrees(model.target.lng, model.target.lat, model.target.height)
    const center = tileset.boundingSphere.center
    const translation = Cesium.Cartesian3.subtract(target, center, new Cesium.Cartesian3())
    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation)
    tilesetRef.value = tileset
    ;(window as any).__bimTileset = tileset
    loadingTileset.value = false
  }
  const onError = (err: any) => {
    console.error('Tileset load failed', err)
    loadError.value = '模型加载失败或资源不存在'
    tilesetRef.value = null
    if (primitive) viewer.scene.primitives.remove(primitive)
    loadingTileset.value = false
    addPlaceholderEntity()
  }
  if (tileset.readyPromise && typeof tileset.readyPromise.then === 'function') {
    tileset.readyPromise.then(onReady, onError)
  } else {
    try { onReady() } catch (e) { onError(e) }
  }
}

const addPlaceholderEntity = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  const position = Cesium.Cartesian3.fromDegrees(model.target.lng, model.target.lat, model.target.height)
  const entity = viewer.entities.add({
    position,
    box: {
      dimensions: new Cesium.Cartesian3(500, 500, 500),
      material: Cesium.Color.fromBytes(0, 180, 255, 120)
    }
  })
  entity.show = true
  tilesetRef.value = entity
  ;(window as any).__bimTileset = entity
  tilesetVisible.value = true
}
const flyToModel = () => {
  const viewer = (window as any).Gviewer
  if (!viewer) return
  if (tilesetRef.value) {
    viewer.zoomTo(tilesetRef.value, new Cesium.HeadingPitchRange(0, -0.3, 800))
  } else {
    viewer.scene.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(model.target.lng, model.target.lat, model.target.height + 1500),
      duration: 1.5
    })
  }
}

const toggleTilesetVisibility = () => {
  if (tilesetRef.value) {
    tilesetVisible.value = !tilesetVisible.value
    tilesetRef.value.show = tilesetVisible.value
  }
}

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
      // 初始化底图滤镜（与首页/洪水演进页一致）
      initGlobeFilter()
      // 确保洪水图层隐藏，避免串场
      const floodCache = (window as any).__floodLayerCache
      if (floodCache) {
        Object.values(floodCache).forEach((set: any) => {
          Object.values(set).forEach((layer: any) => layer && (layer.show = false))
        })
      }
      // 隐藏站点标注，工程页仅展示模型
      setStationMarkersVisible(false)
      loadTilesetOnce()
      flyToModel()
    }
  }, 300)
})

onUnmounted(() => {
  // 不移除 tileset，只隐藏，避免重复加载；保持单实例
  if (tilesetRef.value) {
    tilesetRef.value.show = false
  }
  // 返回其他页面时恢复站点标注
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
  width: 360px;
  pointer-events: auto;
}

.panel {
  width: 100%;
  background: rgba(0, 20, 40, 0.85);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 6px;
  padding: 16px;
  color: #d7e8ff;
  box-shadow: -4px 6px 20px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  line-height: 1.6;

  h2 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #00f6ff;
  }

  .section {
    margin-top: 10px;
    .label {
      font-size: 12px;
      color: #8eb9d9;
    }
    .value {
      font-size: 14px;
      color: #fff;
    }
    .meta {
      font-size: 12px;
      color: #9fb4cc;
    }
  }

  .actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .warn {
    .value {
      color: #ffb347;
    }
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
    &:hover { background: rgba(0, 246, 255, 0.2); color: #fff; }
    &.ghost {
      border-color: rgba(255, 255, 255, 0.2);
      color: #d7e8ff;
      background: rgba(255, 255, 255, 0.05);
    }
  }

  .note {
    margin-top: 8px;
    font-size: 12px;
    color: #9fb4cc;
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
