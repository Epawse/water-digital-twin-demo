<template>
  <GlobalLayout>
    <div class="data-management-page">
      <!-- 左侧主面板 -->
      <div class="panel-main" :class="{ collapsed: isPanelCollapsed }">
        <div class="panel-header" @click="isPanelCollapsed = !isPanelCollapsed">
          <div class="header-content">
            <h2>数据与模型管理</h2>
            <p v-if="!isPanelCollapsed">集中管理后端数据源与配置</p>
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
            <div class="tab-item" :class="{ active: activeTab === 'sensors' }" @click="activeTab = 'sensors'">
              <span class="tab-icon">📍</span>传感器
              <span class="tab-count">{{ sensors.length }}</span>
            </div>
            <div class="tab-item" :class="{ active: activeTab === 'warnings' }" @click="activeTab = 'warnings'">
              <span class="tab-icon">⚠️</span>告警
              <span class="tab-count">{{ warningCount }}</span>
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
            <!-- 传感器 -->
            <div v-show="activeTab === 'sensors'" class="content-section">
            <div class="section-header">
              <span>传感器列表</span>
              <div class="filter-group">
                <span class="filter-btn" :class="{ active: sensorFilter === 'all' }" @click="sensorFilter = 'all'">全部</span>
                <span class="filter-btn" :class="{ active: sensorFilter === 'real' }" @click="sensorFilter = 'real'">真实</span>
                <span class="filter-btn" :class="{ active: sensorFilter === 'sim' }" @click="sensorFilter = 'sim'">模拟</span>
                <input class="search-input" v-model="sensorKeyword" placeholder="搜索编号" />
              </div>
            </div>
            <div class="data-list">
              <div class="list-header iot">
                <span class="col-device">编号</span>
                <span class="col-protocol">类型ID</span>
                <span class="col-station">断面</span>
                <span class="col-status">来源</span>
              </div>
              <div class="list-body">
                <div class="list-row" v-for="s in searchedSensors" :key="s.id" @click="loadSensorMetrics(s.id)">
                  <span class="col-device">{{ s.code }}</span>
                  <span class="col-protocol">{{ s.sensor_type_id ?? '-' }}</span>
                  <span class="col-station">{{ s.section_id }}</span>
                  <span class="col-status">
                    <span class="status-dot" :class="s.is_simulated ? 'offline' : 'online'"></span>
                    {{ s.is_simulated ? '模拟' : '真实' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="section-header" style="margin-top: 12px;">
              <span>指标与最新读数</span>
            </div>
            <div class="data-list compact" v-if="metrics.length">
                <div class="list-body">
                  <div class="list-row compact-row" v-for="m in metrics" :key="m.id" @click="loadReadings(m.metric_key)">
                    <span class="col-name">{{ m.metric_key }}</span>
                    <span class="col-value">{{ readingsMap[m.id]?.value_num ?? '—' }} {{ m.unit || '' }}</span>
                    <span class="col-time">{{ readingsMap[m.id]?.reading_time || '' }}</span>
                    <span class="col-status">
                      <span v-if="m.warn_low !== null || m.warn_high !== null" class="warn-range">
                        {{ m.warn_low ?? '-' }} ~ {{ m.warn_high ?? '-' }}
                      </span>
                      <span v-if="selectedMetricKey === m.metric_key" class="active-tag">历史</span>
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-tip">请选择传感器查看指标</div>
              <div v-if="readings.length" class="history-box">
                <div class="section-header" style="margin-top: 8px;">
                  <span>最近读数（{{ selectedMetricKey }}）</span>
                  <div class="filter-group">
                    <input class="time-input" type="datetime-local" v-model="historyStart" />
                    <input class="time-input" type="datetime-local" v-model="historyEnd" />
                    <input class="limit-input" type="number" min="1" max="500" v-model.number="historyLimit" />
                    <span class="filter-btn" @click="selectedMetricKey && loadReadings(selectedMetricKey)">刷新</span>
                  </div>
                </div>
                <div class="chart-container">
                  <div ref="historyChartRef" class="echarts-box small-chart"></div>
                </div>
                <div class="data-list compact">
                  <div class="list-body">
                    <div class="list-row compact-row" v-for="r in readings" :key="r.id">
                      <span class="col-time">{{ r.reading_time }}</span>
                      <span class="col-value">{{ r.value_num ?? '—' }} {{ r.unit || '' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 告警 -->
            <div v-show="activeTab === 'warnings'" class="content-section">
              <div class="section-header">
                <span>当前告警（后端）</span>
                <div class="filter-group">
                  <span class="filter-btn" :class="{ active: warnFilter === 'all' }" @click="warnFilter = 'all'">全部</span>
                  <span class="filter-btn" :class="{ active: warnFilter === 'yellow' }" @click="warnFilter = 'yellow'">Yellow</span>
                  <span class="filter-btn" :class="{ active: warnFilter === 'red' }" @click="warnFilter = 'red'">Red</span>
                </div>
              </div>
              <div class="data-list">
                <div class="list-header floods">
                  <span class="col-name">传感器</span>
                  <span class="col-level">级别</span>
                  <span class="col-time">时间</span>
                  <span class="col-region">描述</span>
                </div>
                <div class="list-body">
                  <div class="list-row flood-row" v-for="w in filteredWarnings" :key="w.sensor_id + w.time + w.metric">
                    <span class="col-name">{{ w.sensor_id || '-' }} / {{ w.metric }}</span>
                    <span class="col-level">
                      <span class="level-tag" :class="w.level.toLowerCase()">{{ w.level }}</span>
                    </span>
                    <span class="col-time">{{ w.time }}</span>
                    <span class="col-region">{{ w.message }}</span>
                  </div>
                  <div v-if="!filteredWarnings.length" class="empty-tip">当前无告警</div>
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
          </div> <!-- Closes panel-content -->
        </template> <!-- Closes template v-if="!isPanelCollapsed" -->
      </div> <!-- Closes panel-main -->

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

      <!-- 中下方图表统计面板 -->
      <div class="chart-panel tech-panel" v-show="!isPanelCollapsed">
        <div class="chart-header">
          <span class="chart-title">数据统计分析</span>
          <div class="chart-tabs">
            <span :class="{ active: chartType === 'waterLevel' }" @click="chartType = 'waterLevel'">水位趋势</span>
            <span :class="{ active: chartType === 'rainfall' }" @click="chartType = 'rainfall'">降雨分布</span>
            <span :class="{ active: chartType === 'status' }" @click="chartType = 'status'">设备状态</span>
          </div>
        </div>
        <div class="chart-body">
          <div class="chart-content">
            <div v-if="waterLevels.length === 0" class="empty-tip">暂无后端水位数据</div>
            <div v-else class="data-list compact">
              <div class="list-row compact-row" v-for="wl in waterLevels" :key="wl.sensor_id">
                <span class="col-name">{{ wl.station_name || wl.sensor_id }}</span>
                <span class="col-value">{{ wl.latest_level ?? '—' }} {{ wl.unit || '' }}</span>
                <span class="col-time">{{ wl.time }}</span>
              </div>
            </div>
          </div>
          <div class="chart-content">
            <div v-if="rainfallData.length === 0" class="empty-tip">暂无后端降雨数据</div>
            <div class="bar-chart" v-else>
              <div class="bar-item" v-for="(r, i) in rainfallData" :key="i">
                <div class="bar-wrapper">
                  <div class="bar" :style="{ height: r.value + '%', background: r.color }"></div>
                </div>
                <span class="bar-label">{{ r.label }}</span>
                <span class="bar-value">{{ r.mm }}mm</span>
              </div>
            </div>
          </div>
          <div class="chart-content">
            <div class="status-chart">
              <div class="pie-container">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="20" />
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#00ff96" stroke-width="20"
                    :stroke-dasharray="`${onlinePercent * 3.45} 345`" stroke-dashoffset="86" />
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#ff5050" stroke-width="20"
                    :stroke-dasharray="`${offlinePercent * 3.45} 345`" :stroke-dashoffset="`${86 - onlinePercent * 3.45}`" />
                  <text x="70" y="65" text-anchor="middle" fill="#fff" font-size="20" font-weight="bold">{{ onlinePercent }}%</text>
                  <text x="70" y="82" text-anchor="middle" fill="#8eb9d9" font-size="10">在线率</text>
                </svg>
              </div>
              <div class="status-details">
                <div class="detail-row">
                  <span class="status-dot online"></span>
                  <span class="detail-label">在线设备</span>
                  <span class="detail-value">{{ onlineIoTCount }}</span>
                </div>
                <div class="detail-row">
                  <span class="status-dot offline"></span>
                  <span class="detail-label">离线设备</span>
                  <span class="detail-value">{{ iotDevices.length - onlineIoTCount }}</span>
                </div>
                <div class="detail-row">
                  <span class="status-dot warning"></span>
                  <span class="detail-label">预警站点</span>
                  <span class="detail-value">{{ warningCount }}</span>
                </div>
                <div class="detail-row total">
                  <span class="detail-label">设备总数</span>
                  <span class="detail-value">{{ iotDevices.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
import { ref, computed, reactive, onMounted, nextTick, watch } from 'vue'
import GlobalLayout from '@/components/GlobalLayout.vue'
import { 
  fetchStationsTree, 
  fetchStationData, 
  fetchFloodEvents, 
  fetchRainGridFrames, 
  fetchIoTDevices, 
  fetchThreeDResources,
  fetchSensors,
  fetchWarnings,
  fetchWaterLevels,
  fetchRainfallData,
  fetchSensorMetrics,
  fetchReadings,
  StationNode, 
  ExcelData,
  FloodEvent,
  RainGridFrame,
  IoTDevice,
  ThreeDResource,
  SensorItem,
  SensorMetricItem,
  ReadingItem
} from '@/api/backend'
import * as echarts from 'echarts'

declare const Cesium: any

// Extend StationNode for UI state
interface UIStationNode extends StationNode {
  expanded?: boolean;
  children?: UIStationNode[];
}

const stationTree = ref<UIStationNode[]>([])
const events = ref<FloodEvent[]>([])
const rainFrames = ref<RainGridFrame[]>([])
const models = ref<ThreeDResource[]>([])
const iotDevices = ref<IoTDevice[]>([])
const sensors = ref<SensorItem[]>([])
const warnings = ref<any[]>([])
const waterLevels = ref<any[]>([])
const rainData = ref<any[]>([])
const metrics = ref<SensorMetricItem[]>([])
const readingsMap = ref<Record<number, ReadingItem>>({})
const selectedSensorId = ref<number | null>(null)
const selectedMetricKey = ref<string | null>(null)
const readings = ref<ReadingItem[]>([])
const sensorFilter = ref<'all' | 'real' | 'sim'>('all')
const warnFilter = ref<'all' | 'yellow' | 'red'>('all')
const historyLimit = ref<number>(50)
const historyStart = ref<string | null>(null)
const historyEnd = ref<string | null>(null)
const sensorKeyword = ref('')

// 面板状态
const isPanelCollapsed = ref(false)
const isMapPanelExpanded = ref(false)
const activeTab = ref<'sensors' | 'warnings' | 'iot' | 'models'>('sensors')
const stationFilter = ref<'all' | 'file'>('all')
const iotFilter = ref<'all' | 'online' | 'offline'>('all')
const chartType = ref<'waterLevel' | 'rainfall' | 'status'>('waterLevel')

// File Viewing State
const selectedFile = ref<UIStationNode | null>(null)
const fileData = ref<ExcelData | null>(null)
const fileLoading = ref(false)
const fileError = ref('')
const chartRef = ref<HTMLElement | null>(null)
const historyChartRef = ref<HTMLElement | null>(null)
const chartOption = ref<any>(null)
const historyChart = ref<any>(null)

// Helper to count files recursively
const countFiles = (nodes: UIStationNode[]): number => {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') count++;
    if (node.children) count += countFiles(node.children);
  }
  return count;
}

const stationFileCount = computed(() => countFiles(stationTree.value));

const activeStationGroups = computed(() => {
    return stationTree.value;
});

const toggleNode = (node: UIStationNode) => {
    node.expanded = !node.expanded;
}

// 加载传感器的指标与最新读数
const loadSensorMetrics = async (sensorId: number) => {
  selectedSensorId.value = sensorId
  readingsMap.value = {}
  metrics.value = await fetchSensorMetrics(sensorId)
  for (const m of metrics.value) {
    const r = await fetchReadings({ sensor_id: sensorId, metric_key: m.metric_key, limit: 1 })
    if (r && r.length) {
      readingsMap.value[m.id] = r[0]
    }
  }
  if (metrics.value.length) {
    selectedMetricKey.value = metrics.value[0].metric_key
    await loadReadings(metrics.value[0].metric_key)
  } else {
    readings.value = []
    selectedMetricKey.value = null
  }
}

const loadReadings = async (metricKey: string) => {
  if (!selectedSensorId.value) return
  selectedMetricKey.value = metricKey
  readings.value = await fetchReadings({
    sensor_id: selectedSensorId.value,
    metric_key: metricKey,
    limit: historyLimit.value,
    start: historyStart.value || undefined,
    end: historyEnd.value || undefined
  })
  await nextTick()
  renderHistoryChart()
}

const renderHistoryChart = () => {
  const el = historyChartRef.value
  if (!el || !readings.value.length) {
    if (historyChart.value) {
      historyChart.value.dispose()
      historyChart.value = null
    }
    return
  }
  // ensure element has size
  if (!el.clientWidth || !el.clientHeight) {
    requestAnimationFrame(renderHistoryChart)
    return
  }
  const sorted = [...readings.value].sort((a, b) => (a.reading_time || '').localeCompare(b.reading_time || ''))
  const xData = sorted.map(r => r.reading_time)
  const yData = sorted.map(r => r.value_num ?? null)
  if (!historyChart.value) {
    historyChart.value = echarts.init(historyChartRef.value)
  }
  historyChart.value.setOption({
    tooltip: { trigger: 'axis' },
    grid: { top: 20, bottom: 40, left: 40, right: 10 },
    xAxis: { type: 'category', data: xData, axisLabel: { color: '#888', rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: '#888' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } },
    series: [{
      name: selectedMetricKey.value,
      type: 'line',
      smooth: true,
      data: yData,
      itemStyle: { color: '#00f6ff' },
      areaStyle: { opacity: 0.1, color: '#00f6ff' }
    }]
  })
  window.addEventListener('resize', () => historyChart.value && historyChart.value.resize())
}

watch(readings, renderHistoryChart)

onMounted(async () => {
  const [eventsData, rainFramesData, iotData, modelsData, sensorData, warnData, wlData, rfData] = await Promise.all([
    fetchFloodEvents(),
    fetchRainGridFrames(),
    fetchIoTDevices(),
    fetchThreeDResources(),
    fetchSensors(),
    fetchWarnings(),
    fetchWaterLevels(),
    fetchRainfallData()
  ]);

  events.value = eventsData;
  rainFrames.value = rainFramesData;
  iotDevices.value = iotData;
  models.value = modelsData;
  sensors.value = sensorData;
  warnings.value = warnData;
  waterLevels.value = wlData;
  rainData.value = rfData;
})

// ... (keep other functions like toggleBaseMap, etc.) ...
// We need to keep the rest of the script valid.
// Copying specific parts to ensure validity.

// 降雨数据（来自后端，如无真实雨量数据则为空）
const rainfallData = computed(() => {
    return rainData.value.map((r) => ({
      label: r.station_name || r.sensor_id,
      mm: r.latest_rainfall || 0,
      value: Math.min(100, (r.latest_rainfall || 0) * 3),
      color: r.latest_rainfall > 25 ? '#ff6b6b' : r.latest_rainfall > 10 ? '#0096c8' : '#00c864'
    }))
})
const filteredSensors = computed(() => {
  if (sensorFilter.value === 'real') return sensors.value.filter(s => !s.is_simulated)
  if (sensorFilter.value === 'sim') return sensors.value.filter(s => s.is_simulated)
  return sensors.value
})
const searchedSensors = computed(() => {
  const kw = sensorKeyword.value.trim()
  let arr = filteredSensors.value
  if (kw) {
    arr = arr.filter(s => s.code.toLowerCase().includes(kw.toLowerCase()))
  }
  return arr
})
const filteredWarnings = computed(() => {
  if (warnFilter.value === 'all') return warnings.value
  return warnings.value.filter((w: any) => w.level?.toLowerCase() === warnFilter.value)
})

const onlinePercent = computed(() => {
    if (iotDevices.value.length === 0) return 0;
    return Math.round((onlineIoTCount.value / iotDevices.value.length) * 100);
})
const offlinePercent = computed(() => 100 - onlinePercent.value)

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

const hideAllBaseLayers = () => {}
const toggleBaseMap = (val: string) => {}
const initGlobeFilter = () => false
// ========== 底图处理逻辑结束 ==========

// Removed filteredStations computed prop as we use stationTree now

const filteredIoT = computed(() => {
  if (iotFilter.value === 'all') return iotDevices.value
  return iotDevices.value.filter(d => d.status === iotFilter.value)
})

const reservoirCount = computed(() => sensors.value.filter(s => s.code.startsWith('res_')).length)
const hydroCount = computed(() => sensors.value.filter(s => s.code.startsWith('hyd_')).length)
const rainCount = computed(() => sensors.value.filter(s => s.code.startsWith('rain_')).length)

const warningCount = computed(() => warnings.value.length)
const onlineIoTCount = computed(() => iotDevices.value.filter(d => d.status === 'online').length)

// Removed typeLabel, statusLabel for stations as structure changed

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
const hideCachedFloodLayers = () => {}
const hideCachedBimTileset = () => {}
const showStationMarkers = () => {}
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

// File Browser Styles
.file-browser {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 246, 255, 0.1);
  border-radius: 6px;
  padding: 10px;
  height: 400px;
  overflow-y: auto;

  .tree-node {
    margin-bottom: 4px;
  }

  .node-header {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
    color: #d7e8ff;

    &:hover {
      background: rgba(0, 246, 255, 0.1);
    }

    .node-icon {
      margin-right: 6px;
      font-size: 14px;
    }

    .node-label {
      font-size: 13px;
      font-weight: 500;
    }

    &.sub-category {
      padding-left: 20px;
      .node-label {
        font-size: 12px;
        color: #8eb9d9;
      }
    }
  }

  .node-children {
    margin-left: 10px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 4px 8px 4px 30px;
    cursor: pointer;
    color: #bbb;
    transition: all 0.2s;

    &:hover {
      color: #00f6ff;
      background: rgba(0, 246, 255, 0.05);
    }

    .file-icon {
      margin-right: 6px;
      font-size: 12px;
    }

    .file-name {
      font-size: 12px;
    }
  }
}

// File Dialog Overlay
.file-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-dialog {
  width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: #0a1520;
  border: 1px solid #00f6ff;
  box-shadow: 0 0 30px rgba(0, 246, 255, 0.2);

  .dialog-header {
    padding: 15px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 16px;
      font-weight: bold;
      color: #00f6ff;
    }

    .close-btn {
      background: none;
      border: none;
      color: #888;
      font-size: 24px;
      cursor: pointer;
      &:hover { color: #fff; }
    }
  }

  .dialog-body {
    padding: 20px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .chart-container {
    min-height: 200px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    padding: 10px;
    
    .echarts-box {
      width: 100%;
      height: 100%;
      &.small-chart {
        min-height: 200px;
      }
    }
  }

  .data-table-wrapper {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;

      th, td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      th {
        background: rgba(0, 246, 255, 0.1);
        color: #00f6ff;
      }

      td {
        color: #ccc;
      }

      tr:hover td {
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .table-footer {
      padding: 8px;
      text-align: center;
      font-size: 11px;
      color: #666;
      background: rgba(0, 0, 0, 0.2);
    }
  }
  
  .loading-state, .error-state {
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #ccc;
    
    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(0, 246, 255, 0.2);
      border-top-color: #00f6ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
  }
  
  .error-state {
    color: #ff5050;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
      background: none;
      border: none;
      color: #888;
      font-size: 24px;
      cursor: pointer;
      &:hover { color: #fff; }
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

// 图表统计面板
.chart-panel {
  position: absolute;
  left: 110px;
  bottom: 30px;
  width: 450px;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 8px;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  overflow: hidden;

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.15);
    background: rgba(0, 246, 255, 0.05);

    .chart-title {
      font-size: 13px;
      color: #00f6ff;
      font-weight: 500;
    }

    .chart-tabs {
      display: flex;
      gap: 4px;

      span {
        padding: 4px 10px;
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
    }
  }

  .chart-body {
    padding: 12px;
  }

  .chart-content {
    animation: fadeIn 0.2s ease;
  }

  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 10px;
    font-size: 10px;
    color: #8eb9d9;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;

      &.water { background: #00f6ff; }
      &.warning { background: #ffbd2e; }
      &.light { background: #a6f2cc; }
      &.moderate { background: #00c864; }
      &.heavy { background: #0096c8; }
    }
  }

  // 柱状图
  .bar-chart {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    height: 130px;
    padding: 10px 0;

    .bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .bar-wrapper {
        width: 30px;
        height: 100px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px 4px 0 0;
        display: flex;
        align-items: flex-end;
        overflow: hidden;

        .bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
        }
      }

      .bar-label {
        font-size: 10px;
        color: #8eb9d9;
      }

      .bar-value {
        font-size: 11px;
        color: #00f6ff;
        font-weight: 500;
      }
    }
  }

  // 设备状态图
  .status-chart {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 10px;

    .pie-container {
      flex-shrink: 0;
    }

    .status-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .detail-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;

          &.online { background: #00ff96; }
          &.offline { background: #ff5050; }
          &.warning { background: #ffbd2e; }
        }

        .detail-label {
          flex: 1;
          font-size: 12px;
          color: #8eb9d9;
        }

        .detail-value {
          font-size: 14px;
          color: #fff;
          font-weight: 500;
        }

        &.total {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);

          .detail-label {
            color: #fff;
          }

          .detail-value {
            color: #00f6ff;
            font-size: 16px;
          }
        }
      }
    }
  }
}
</style>
