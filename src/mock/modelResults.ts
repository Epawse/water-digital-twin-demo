// 水文水动力模型结果数据 - 新疆主要流域
// 包含：HEC-RAS、MIKE、SWMM模型配置与计算结果

export type ModelType = 'HEC-RAS' | 'MIKE11' | 'MIKE21' | 'MIKE-FLOOD' | 'SWMM' | 'IFMS'
export type SimulationType = 'steady' | 'unsteady' | 'quasi-unsteady'
export type ScenarioType = 'historical' | 'design' | 'forecast' | 'emergency'

export interface HydroModel {
  id: string
  name: string
  type: ModelType
  version: string
  basin: string
  description: string
  riverLength: number // 模拟河段长度(km)
  crossSections: number // 断面数量
  calibrationPeriod?: string
  validationPeriod?: string
  status: 'ready' | 'running' | 'completed' | 'error'
}

export interface ModelScenario {
  id: string
  modelId: string
  name: string
  type: ScenarioType
  returnPeriod?: number // 重现期(年)
  simulationType: SimulationType
  startTime: string
  endTime: string
  timeStep: number // 计算时间步长(秒)
  outputInterval: number // 输出间隔(分钟)
  boundaryConditions: {
    upstream: { type: 'flow' | 'stage'; value: number }
    downstream: { type: 'flow' | 'stage' | 'rating-curve'; value?: number }
  }
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
}

export interface CrossSection {
  id: string
  modelId: string
  stationId: string // 桩号标识
  chainage: number // 桩号(km)
  lng: number
  lat: number
  riverName: string
  bankfullWidth: number // 平滩宽度(m)
  mainChannelWidth: number // 主槽宽度(m)
  bedElevation: number // 河底高程(m)
  manningN: number // 糙率
}

export interface FlowResult {
  id: string
  scenarioId: string
  crossSectionId: string
  timestamp: string
  waterLevel: number // 水位(m)
  discharge: number // 流量(m³/s)
  velocity: number // 流速(m/s)
  area: number // 过水面积(m²)
  topWidth: number // 水面宽度(m)
  froudeNumber: number // 弗劳德数
}

export interface InundationResult {
  id: string
  scenarioId: string
  timestamp: string
  bounds: { west: number; south: number; east: number; north: number }
  maxDepth: number // 最大水深(m)
  totalArea: number // 淹没面积(km²)
  affectedArea: number // 影响区域面积(km²)
  geojsonUrl: string
  rasterUrl?: string
}

export interface FloodPeak {
  id: string
  scenarioId: string
  stationName: string
  chainage: number
  peakTime: string
  peakDischarge: number // 洪峰流量(m³/s)
  peakWaterLevel: number // 洪峰水位(m)
  travelTime: number // 传播时间(小时)
}

// 新疆主要流域水文模型
export const HydroModels: HydroModel[] = [
  // 塔里木河流域
  {
    id: 'model_tarim',
    name: '塔里木河干流水动力模型',
    type: 'MIKE11',
    version: '2023.1',
    basin: '塔里木河流域',
    description: '覆盖阿拉尔至台特玛湖河段，包含主要分流口和水库调度',
    riverLength: 1321,
    crossSections: 156,
    calibrationPeriod: '2015-2018',
    validationPeriod: '2019-2020',
    status: 'ready'
  },
  {
    id: 'model_tarim_flood',
    name: '塔里木河洪水演进模型',
    type: 'MIKE-FLOOD',
    version: '2023.1',
    basin: '塔里木河流域',
    description: '一二维耦合洪水淹没模型，模拟漫滩洪水',
    riverLength: 800,
    crossSections: 98,
    status: 'ready'
  },
  // 伊犁河流域
  {
    id: 'model_yili',
    name: '伊犁河干流水动力模型',
    type: 'HEC-RAS',
    version: '6.3',
    basin: '伊犁河流域',
    description: '伊宁市上游至边境河段水动力模拟',
    riverLength: 442,
    crossSections: 88,
    calibrationPeriod: '2016-2019',
    validationPeriod: '2020-2021',
    status: 'ready'
  },
  {
    id: 'model_yili_urban',
    name: '伊宁市城区排水模型',
    type: 'SWMM',
    version: '5.2',
    basin: '伊犁河流域',
    description: '伊宁市主城区雨洪排水管网模型',
    riverLength: 0,
    crossSections: 0,
    status: 'ready'
  },
  // 额尔齐斯河流域
  {
    id: 'model_irtysh',
    name: '额尔齐斯河水动力模型',
    type: 'MIKE11',
    version: '2023.1',
    basin: '额尔齐斯河流域',
    description: '可可托海至北屯河段水动力模拟',
    riverLength: 546,
    crossSections: 72,
    calibrationPeriod: '2017-2019',
    validationPeriod: '2020',
    status: 'ready'
  },
  // 玛纳斯河流域
  {
    id: 'model_manas',
    name: '玛纳斯河洪水模型',
    type: 'HEC-RAS',
    version: '6.3',
    basin: '玛纳斯河流域',
    description: '肯斯瓦特水库至下游灌区洪水演进模型',
    riverLength: 185,
    crossSections: 45,
    status: 'ready'
  },
  // 渭干河流域
  {
    id: 'model_weigan',
    name: '渭干河水动力模型',
    type: 'MIKE11',
    version: '2023.1',
    basin: '渭干河流域',
    description: '克孜尔水库至库车河段',
    riverLength: 168,
    crossSections: 38,
    status: 'ready'
  },
  // 和田河流域
  {
    id: 'model_hotan',
    name: '和田河水动力模型',
    type: 'HEC-RAS',
    version: '6.3',
    basin: '和田河流域',
    description: '乌鲁瓦提水库至塔里木河汇入口',
    riverLength: 325,
    crossSections: 52,
    status: 'ready'
  },
]

// 模型计算方案
export const ModelScenarios: ModelScenario[] = [
  // 塔里木河方案
  {
    id: 'scenario_tarim_20y',
    modelId: 'model_tarim',
    name: '塔里木河20年一遇设计洪水',
    type: 'design',
    returnPeriod: 20,
    simulationType: 'unsteady',
    startTime: '2025-09-01T00:00:00Z',
    endTime: '2025-09-05T00:00:00Z',
    timeStep: 60,
    outputInterval: 60,
    boundaryConditions: {
      upstream: { type: 'flow', value: 1850 },
      downstream: { type: 'rating-curve' }
    },
    status: 'completed'
  },
  {
    id: 'scenario_tarim_50y',
    modelId: 'model_tarim',
    name: '塔里木河50年一遇设计洪水',
    type: 'design',
    returnPeriod: 50,
    simulationType: 'unsteady',
    startTime: '2025-09-01T00:00:00Z',
    endTime: '2025-09-06T00:00:00Z',
    timeStep: 60,
    outputInterval: 60,
    boundaryConditions: {
      upstream: { type: 'flow', value: 2450 },
      downstream: { type: 'rating-curve' }
    },
    status: 'completed'
  },
  {
    id: 'scenario_tarim_forecast',
    modelId: 'model_tarim',
    name: '塔里木河实时洪水预报',
    type: 'forecast',
    simulationType: 'unsteady',
    startTime: '2025-09-01T00:00:00Z',
    endTime: '2025-09-03T00:00:00Z',
    timeStep: 60,
    outputInterval: 30,
    boundaryConditions: {
      upstream: { type: 'flow', value: 1280 },
      downstream: { type: 'rating-curve' }
    },
    status: 'running',
    progress: 65
  },
  // 伊犁河方案
  {
    id: 'scenario_yili_100y',
    modelId: 'model_yili',
    name: '伊犁河100年一遇设计洪水',
    type: 'design',
    returnPeriod: 100,
    simulationType: 'unsteady',
    startTime: '2025-09-01T00:00:00Z',
    endTime: '2025-09-07T00:00:00Z',
    timeStep: 30,
    outputInterval: 60,
    boundaryConditions: {
      upstream: { type: 'flow', value: 3200 },
      downstream: { type: 'stage', value: 565.5 }
    },
    status: 'completed'
  },
  {
    id: 'scenario_yili_urban',
    modelId: 'model_yili_urban',
    name: '伊宁市50年暴雨内涝',
    type: 'design',
    returnPeriod: 50,
    simulationType: 'unsteady',
    startTime: '2025-09-01T00:00:00Z',
    endTime: '2025-09-01T12:00:00Z',
    timeStep: 10,
    outputInterval: 10,
    boundaryConditions: {
      upstream: { type: 'flow', value: 0 },
      downstream: { type: 'stage', value: 620.0 }
    },
    status: 'completed'
  },
  // 额尔齐斯河方案
  {
    id: 'scenario_irtysh_hist',
    modelId: 'model_irtysh',
    name: '额尔齐斯河历史洪水重现(2010)',
    type: 'historical',
    simulationType: 'unsteady',
    startTime: '2010-07-15T00:00:00Z',
    endTime: '2010-07-25T00:00:00Z',
    timeStep: 60,
    outputInterval: 60,
    boundaryConditions: {
      upstream: { type: 'flow', value: 1580 },
      downstream: { type: 'rating-curve' }
    },
    status: 'completed'
  },
]

// 典型断面数据
export const CrossSections: CrossSection[] = [
  // 塔里木河断面
  { id: 'xs_tarim_001', modelId: 'model_tarim', stationId: 'TRM+000', chainage: 0, lng: 81.28, lat: 40.55, riverName: '塔里木河', bankfullWidth: 850, mainChannelWidth: 320, bedElevation: 1008, manningN: 0.035 },
  { id: 'xs_tarim_050', modelId: 'model_tarim', stationId: 'TRM+050', chainage: 50, lng: 81.85, lat: 40.62, riverName: '塔里木河', bankfullWidth: 920, mainChannelWidth: 350, bedElevation: 998, manningN: 0.032 },
  { id: 'xs_tarim_100', modelId: 'model_tarim', stationId: 'TRM+100', chainage: 100, lng: 82.45, lat: 40.71, riverName: '塔里木河', bankfullWidth: 1050, mainChannelWidth: 380, bedElevation: 985, manningN: 0.030 },
  { id: 'xs_tarim_200', modelId: 'model_tarim', stationId: 'TRM+200', chainage: 200, lng: 83.65, lat: 40.85, riverName: '塔里木河', bankfullWidth: 1200, mainChannelWidth: 420, bedElevation: 962, manningN: 0.028 },
  { id: 'xs_tarim_300', modelId: 'model_tarim', stationId: 'TRM+300', chainage: 300, lng: 84.25, lat: 41.35, riverName: '塔里木河', bankfullWidth: 1350, mainChannelWidth: 450, bedElevation: 938, manningN: 0.028 },

  // 伊犁河断面
  { id: 'xs_yili_001', modelId: 'model_yili', stationId: 'YL+000', chainage: 0, lng: 80.12, lat: 43.52, riverName: '伊犁河', bankfullWidth: 580, mainChannelWidth: 220, bedElevation: 712, manningN: 0.038 },
  { id: 'xs_yili_050', modelId: 'model_yili', stationId: 'YL+050', chainage: 50, lng: 80.58, lat: 43.68, riverName: '伊犁河', bankfullWidth: 650, mainChannelWidth: 250, bedElevation: 695, manningN: 0.035 },
  { id: 'xs_yili_100', modelId: 'model_yili', stationId: 'YL+100', chainage: 100, lng: 81.05, lat: 43.82, riverName: '伊犁河', bankfullWidth: 720, mainChannelWidth: 280, bedElevation: 678, manningN: 0.032 },

  // 额尔齐斯河断面
  { id: 'xs_irtysh_001', modelId: 'model_irtysh', stationId: 'IR+000', chainage: 0, lng: 89.78, lat: 47.12, riverName: '额尔齐斯河', bankfullWidth: 320, mainChannelWidth: 150, bedElevation: 1185, manningN: 0.040 },
  { id: 'xs_irtysh_100', modelId: 'model_irtysh', stationId: 'IR+100', chainage: 100, lng: 88.52, lat: 47.35, riverName: '额尔齐斯河', bankfullWidth: 450, mainChannelWidth: 200, bedElevation: 1052, manningN: 0.035 },
]

// 生成流量结果时序
const generateFlowResults = (scenarioId: string, crossSectionId: string, baseFlow: number, peakFlow: number, hours: number): FlowResult[] => {
  const results: FlowResult[] = []
  const startTime = new Date('2025-09-01T00:00:00Z')

  for (let i = 0; i < hours; i++) {
    const t = i / hours
    // 模拟洪水过程线：上升-峰值-退水
    const flowRatio = t < 0.3 ? Math.pow(t / 0.3, 1.5) : Math.exp(-3 * (t - 0.3))
    const discharge = baseFlow + (peakFlow - baseFlow) * flowRatio

    const xs = CrossSections.find(x => x.id === crossSectionId)
    const bedElev = xs?.bedElevation || 1000
    const width = xs?.mainChannelWidth || 300

    // 简化水力计算
    const depth = Math.pow(discharge / (width * 2.5), 0.6)
    const waterLevel = bedElev + depth
    const velocity = discharge / (depth * width)
    const area = depth * width
    const topWidth = width + depth * 2
    const froudeNumber = velocity / Math.sqrt(9.81 * depth)

    results.push({
      id: `${scenarioId}_${crossSectionId}_${i}`,
      scenarioId,
      crossSectionId,
      timestamp: new Date(startTime.getTime() + i * 3600000).toISOString(),
      waterLevel: Number(waterLevel.toFixed(2)),
      discharge: Number(discharge.toFixed(1)),
      velocity: Number(velocity.toFixed(2)),
      area: Number(area.toFixed(1)),
      topWidth: Number(topWidth.toFixed(1)),
      froudeNumber: Number(froudeNumber.toFixed(3))
    })
  }
  return results
}

// 模型计算结果
export const FlowResults: FlowResult[] = [
  ...generateFlowResults('scenario_tarim_20y', 'xs_tarim_001', 450, 1850, 96),
  ...generateFlowResults('scenario_tarim_20y', 'xs_tarim_100', 480, 1780, 96),
  ...generateFlowResults('scenario_yili_100y', 'xs_yili_001', 320, 3200, 144),
  ...generateFlowResults('scenario_irtysh_hist', 'xs_irtysh_001', 280, 1580, 240),
]

// 淹没范围结果
export const InundationResults: InundationResult[] = [
  {
    id: 'inund_tarim_20y_t24',
    scenarioId: 'scenario_tarim_20y',
    timestamp: '2025-09-02T00:00:00Z',
    bounds: { west: 81.0, south: 40.3, east: 85.0, north: 41.2 },
    maxDepth: 3.2,
    totalArea: 125.8,
    affectedArea: 89.5,
    geojsonUrl: '/mock/model/tarim_20y_t24.geojson',
    rasterUrl: '/mock/model/tarim_20y_t24.tif'
  },
  {
    id: 'inund_tarim_20y_t48',
    scenarioId: 'scenario_tarim_20y',
    timestamp: '2025-09-03T00:00:00Z',
    bounds: { west: 81.0, south: 40.2, east: 86.0, north: 41.5 },
    maxDepth: 4.5,
    totalArea: 215.3,
    affectedArea: 156.2,
    geojsonUrl: '/mock/model/tarim_20y_t48.geojson',
    rasterUrl: '/mock/model/tarim_20y_t48.tif'
  },
  {
    id: 'inund_tarim_50y_t48',
    scenarioId: 'scenario_tarim_50y',
    timestamp: '2025-09-03T00:00:00Z',
    bounds: { west: 80.5, south: 40.0, east: 87.0, north: 42.0 },
    maxDepth: 5.8,
    totalArea: 358.6,
    affectedArea: 275.4,
    geojsonUrl: '/mock/model/tarim_50y_t48.geojson',
    rasterUrl: '/mock/model/tarim_50y_t48.tif'
  },
  {
    id: 'inund_yili_100y_t72',
    scenarioId: 'scenario_yili_100y',
    timestamp: '2025-09-04T00:00:00Z',
    bounds: { west: 80.0, south: 43.2, east: 82.5, north: 44.5 },
    maxDepth: 6.2,
    totalArea: 185.2,
    affectedArea: 142.8,
    geojsonUrl: '/mock/model/yili_100y_t72.geojson',
    rasterUrl: '/mock/model/yili_100y_t72.tif'
  },
]

// 洪峰传播结果
export const FloodPeaks: FloodPeak[] = [
  { id: 'peak_tarim_20y_001', scenarioId: 'scenario_tarim_20y', stationName: '阿拉尔', chainage: 0, peakTime: '2025-09-01T18:00:00Z', peakDischarge: 1850, peakWaterLevel: 1015.2, travelTime: 0 },
  { id: 'peak_tarim_20y_002', scenarioId: 'scenario_tarim_20y', stationName: '沙雅', chainage: 180, peakTime: '2025-09-02T12:00:00Z', peakDischarge: 1720, peakWaterLevel: 972.5, travelTime: 18 },
  { id: 'peak_tarim_20y_003', scenarioId: 'scenario_tarim_20y', stationName: '轮台', chainage: 350, peakTime: '2025-09-03T06:00:00Z', peakDischarge: 1580, peakWaterLevel: 928.8, travelTime: 36 },
  { id: 'peak_yili_100y_001', scenarioId: 'scenario_yili_100y', stationName: '巩留', chainage: 0, peakTime: '2025-09-02T00:00:00Z', peakDischarge: 3200, peakWaterLevel: 718.5, travelTime: 0 },
  { id: 'peak_yili_100y_002', scenarioId: 'scenario_yili_100y', stationName: '伊宁', chainage: 120, peakTime: '2025-09-02T18:00:00Z', peakDischarge: 2950, peakWaterLevel: 672.8, travelTime: 18 },
]

// 辅助函数
export const getModelById = (id: string): HydroModel | undefined => HydroModels.find(m => m.id === id)
export const getScenariosByModel = (modelId: string): ModelScenario[] => ModelScenarios.filter(s => s.modelId === modelId)
export const getFlowResultsByScenario = (scenarioId: string): FlowResult[] => FlowResults.filter(r => r.scenarioId === scenarioId)
export const getInundationByScenario = (scenarioId: string): InundationResult[] => InundationResults.filter(r => r.scenarioId === scenarioId)
