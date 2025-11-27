// 大坝安全监测数据 - 新疆主要水库
// 包含：渗压、位移、应力应变、渗流量、扬压力等监测时序

export type DamType = 'earth-rock' | 'concrete-gravity' | 'concrete-arch' | 'masonry'
export type MonitoringType = 'pore-pressure' | 'displacement' | 'stress-strain' | 'seepage' | 'uplift-pressure' | 'settlement'

export interface Dam {
  id: string
  name: string
  type: DamType
  reservoirId: string
  lng: number
  lat: number
  height: number // 坝高(m)
  crestLength: number // 坝顶长度(m)
  crestElevation: number // 坝顶高程(m)
  designFloodLevel: number // 设计洪水位(m)
  checkFloodLevel: number // 校核洪水位(m)
  totalCapacity: number // 总库容(亿m³)
  constructionYear: number
  safetyGrade: 'I' | 'II' | 'III' | 'IV' | 'V'
  status: 'normal' | 'attention' | 'warning' | 'danger'
}

export interface MonitoringSensor {
  id: string
  damId: string
  type: MonitoringType
  name: string
  location: string // 安装位置描述
  elevation: number // 安装高程(m)
  chainage: number // 桩号
  installDate: string
  unit: string
  normalRange: { min: number; max: number }
  warningThreshold: number
  dangerThreshold: number
  status: 'online' | 'offline' | 'fault'
}

export interface MonitoringRecord {
  id: string
  sensorId: string
  timestamp: string
  value: number
  status: 'normal' | 'warning' | 'danger'
  temperature?: number // 环境温度
}

export interface DamInspection {
  id: string
  damId: string
  inspectionDate: string
  inspector: string
  type: 'routine' | 'special' | 'annual'
  items: {
    item: string
    result: 'normal' | 'abnormal' | 'critical'
    description?: string
  }[]
  overallStatus: 'normal' | 'attention' | 'warning'
  nextInspectionDate: string
}

// 新疆主要水库大坝
export const Dams: Dam[] = [
  // 伊犁河流域
  {
    id: 'dam_kns',
    name: '克孜尔水库大坝',
    type: 'earth-rock',
    reservoirId: 'res_003',
    lng: 82.85,
    lat: 41.75,
    height: 44.0,
    crestLength: 1180,
    crestElevation: 1141.5,
    designFloodLevel: 1137.8,
    checkFloodLevel: 1140.2,
    totalCapacity: 6.37,
    constructionYear: 1998,
    safetyGrade: 'II',
    status: 'normal'
  },
  {
    id: 'dam_wlwt',
    name: '乌鲁瓦提水库大坝',
    type: 'concrete-gravity',
    reservoirId: 'res_001',
    lng: 79.35,
    lat: 37.25,
    height: 135.0,
    crestLength: 384,
    crestElevation: 1970.0,
    designFloodLevel: 1965.0,
    checkFloodLevel: 1968.5,
    totalCapacity: 3.47,
    constructionYear: 2001,
    safetyGrade: 'I',
    status: 'normal'
  },
  {
    id: 'dam_dxhz',
    name: '大西海子水库大坝',
    type: 'earth-rock',
    reservoirId: 'res_002',
    lng: 86.5,
    lat: 41.15,
    height: 28.0,
    crestLength: 2850,
    crestElevation: 852.0,
    designFloodLevel: 848.0,
    checkFloodLevel: 850.5,
    totalCapacity: 4.62,
    constructionYear: 1983,
    safetyGrade: 'II',
    status: 'attention'
  },
  // 额尔齐斯河流域
  {
    id: 'dam_kty',
    name: '可可托海水库大坝',
    type: 'concrete-arch',
    reservoirId: 'res_kty',
    lng: 89.78,
    lat: 47.12,
    height: 92.0,
    crestLength: 320,
    crestElevation: 1295.0,
    designFloodLevel: 1290.0,
    checkFloodLevel: 1293.5,
    totalCapacity: 2.85,
    constructionYear: 2015,
    safetyGrade: 'I',
    status: 'normal'
  },
  // 塔里木河流域
  {
    id: 'dam_xek',
    name: '小二库水库大坝',
    type: 'earth-rock',
    reservoirId: 'res_xek',
    lng: 81.32,
    lat: 40.18,
    height: 38.5,
    crestLength: 1560,
    crestElevation: 1058.0,
    designFloodLevel: 1054.5,
    checkFloodLevel: 1056.8,
    totalCapacity: 1.95,
    constructionYear: 2008,
    safetyGrade: 'III',
    status: 'normal'
  },
  // 玛纳斯河流域
  {
    id: 'dam_knsh',
    name: '肯斯瓦特水库大坝',
    type: 'concrete-gravity',
    reservoirId: 'res_knsh',
    lng: 85.42,
    lat: 43.85,
    height: 106.0,
    crestLength: 450,
    crestElevation: 1285.0,
    designFloodLevel: 1280.0,
    checkFloodLevel: 1283.5,
    totalCapacity: 3.15,
    constructionYear: 2012,
    safetyGrade: 'I',
    status: 'normal'
  },
]

// 监测传感器配置
export const MonitoringSensors: MonitoringSensor[] = [
  // 乌鲁瓦提水库大坝监测点
  { id: 'sensor_wlwt_pp01', damId: 'dam_wlwt', type: 'pore-pressure', name: '渗压计P01', location: '坝基廊道0+050', elevation: 1860, chainage: 50, installDate: '2001-06-15', unit: 'kPa', normalRange: { min: 0, max: 350 }, warningThreshold: 400, dangerThreshold: 500, status: 'online' },
  { id: 'sensor_wlwt_pp02', damId: 'dam_wlwt', type: 'pore-pressure', name: '渗压计P02', location: '坝基廊道0+120', elevation: 1860, chainage: 120, installDate: '2001-06-15', unit: 'kPa', normalRange: { min: 0, max: 380 }, warningThreshold: 430, dangerThreshold: 530, status: 'online' },
  { id: 'sensor_wlwt_pp03', damId: 'dam_wlwt', type: 'pore-pressure', name: '渗压计P03', location: '坝基廊道0+200', elevation: 1860, chainage: 200, installDate: '2001-06-15', unit: 'kPa', normalRange: { min: 0, max: 320 }, warningThreshold: 380, dangerThreshold: 480, status: 'online' },
  { id: 'sensor_wlwt_dp01', damId: 'dam_wlwt', type: 'displacement', name: '位移计D01', location: '坝顶0+100', elevation: 1970, chainage: 100, installDate: '2001-06-15', unit: 'mm', normalRange: { min: -15, max: 15 }, warningThreshold: 25, dangerThreshold: 40, status: 'online' },
  { id: 'sensor_wlwt_dp02', damId: 'dam_wlwt', type: 'displacement', name: '位移计D02', location: '坝顶0+200', elevation: 1970, chainage: 200, installDate: '2001-06-15', unit: 'mm', normalRange: { min: -15, max: 15 }, warningThreshold: 25, dangerThreshold: 40, status: 'online' },
  { id: 'sensor_wlwt_sp01', damId: 'dam_wlwt', type: 'seepage', name: '渗流量计S01', location: '坝后集水井', elevation: 1850, chainage: 0, installDate: '2001-06-15', unit: 'L/s', normalRange: { min: 0, max: 2.5 }, warningThreshold: 4.0, dangerThreshold: 6.0, status: 'online' },
  { id: 'sensor_wlwt_up01', damId: 'dam_wlwt', type: 'uplift-pressure', name: '扬压力计U01', location: '坝基廊道0+100', elevation: 1855, chainage: 100, installDate: '2001-06-15', unit: 'kPa', normalRange: { min: 0, max: 600 }, warningThreshold: 750, dangerThreshold: 900, status: 'online' },

  // 克孜尔水库大坝监测点
  { id: 'sensor_kns_pp01', damId: 'dam_kns', type: 'pore-pressure', name: '渗压计P01', location: '坝体0+300断面', elevation: 1115, chainage: 300, installDate: '1998-08-20', unit: 'kPa', normalRange: { min: 0, max: 180 }, warningThreshold: 220, dangerThreshold: 280, status: 'online' },
  { id: 'sensor_kns_pp02', damId: 'dam_kns', type: 'pore-pressure', name: '渗压计P02', location: '坝体0+600断面', elevation: 1118, chainage: 600, installDate: '1998-08-20', unit: 'kPa', normalRange: { min: 0, max: 200 }, warningThreshold: 250, dangerThreshold: 300, status: 'online' },
  { id: 'sensor_kns_st01', damId: 'dam_kns', type: 'settlement', name: '沉降计ST01', location: '坝顶0+500', elevation: 1141.5, chainage: 500, installDate: '1998-08-20', unit: 'mm', normalRange: { min: -30, max: 5 }, warningThreshold: -50, dangerThreshold: -80, status: 'online' },
  { id: 'sensor_kns_dp01', damId: 'dam_kns', type: 'displacement', name: '位移计D01', location: '坝顶0+400', elevation: 1141.5, chainage: 400, installDate: '1998-08-20', unit: 'mm', normalRange: { min: -20, max: 20 }, warningThreshold: 35, dangerThreshold: 50, status: 'online' },

  // 大西海子水库大坝监测点
  { id: 'sensor_dxhz_pp01', damId: 'dam_dxhz', type: 'pore-pressure', name: '渗压计P01', location: '坝体0+800断面', elevation: 838, chainage: 800, installDate: '1983-10-10', unit: 'kPa', normalRange: { min: 0, max: 120 }, warningThreshold: 150, dangerThreshold: 200, status: 'online' },
  { id: 'sensor_dxhz_sp01', damId: 'dam_dxhz', type: 'seepage', name: '渗流量计S01', location: '坝后排水沟', elevation: 825, chainage: 0, installDate: '1983-10-10', unit: 'L/s', normalRange: { min: 0, max: 5.0 }, warningThreshold: 8.0, dangerThreshold: 12.0, status: 'online' },
  { id: 'sensor_dxhz_st01', damId: 'dam_dxhz', type: 'settlement', name: '沉降计ST01', location: '坝顶0+1200', elevation: 852, chainage: 1200, installDate: '1983-10-10', unit: 'mm', normalRange: { min: -25, max: 5 }, warningThreshold: -40, dangerThreshold: -60, status: 'fault' },
]

// 生成模拟监测时序数据
const generateTimeSeries = (sensorId: string, baseValue: number, variance: number, hours: number): MonitoringRecord[] => {
  const records: MonitoringRecord[] = []
  const now = new Date('2025-09-01T00:00:00Z')

  for (let i = 0; i < hours; i++) {
    const timestamp = new Date(now.getTime() - i * 3600000).toISOString()
    const variation = (Math.random() - 0.5) * variance
    const value = Number((baseValue + variation).toFixed(2))

    const sensor = MonitoringSensors.find(s => s.id === sensorId)
    let status: 'normal' | 'warning' | 'danger' = 'normal'
    if (sensor) {
      if (Math.abs(value) >= sensor.dangerThreshold) status = 'danger'
      else if (Math.abs(value) >= sensor.warningThreshold) status = 'warning'
    }

    records.push({
      id: `${sensorId}_${i}`,
      sensorId,
      timestamp,
      value,
      status,
      temperature: Number((15 + Math.random() * 10).toFixed(1))
    })
  }
  return records.reverse()
}

// 模拟监测数据（过去72小时）
export const MonitoringRecords: MonitoringRecord[] = [
  ...generateTimeSeries('sensor_wlwt_pp01', 280, 30, 72),
  ...generateTimeSeries('sensor_wlwt_pp02', 310, 35, 72),
  ...generateTimeSeries('sensor_wlwt_dp01', 2.5, 3, 72),
  ...generateTimeSeries('sensor_wlwt_sp01', 1.8, 0.5, 72),
  ...generateTimeSeries('sensor_kns_pp01', 145, 20, 72),
  ...generateTimeSeries('sensor_kns_st01', -18, 5, 72),
  ...generateTimeSeries('sensor_dxhz_pp01', 95, 15, 72),
  ...generateTimeSeries('sensor_dxhz_sp01', 4.2, 1.0, 72),
]

// 巡检记录
export const DamInspections: DamInspection[] = [
  {
    id: 'insp_wlwt_001',
    damId: 'dam_wlwt',
    inspectionDate: '2025-08-25',
    inspector: '张工',
    type: 'routine',
    items: [
      { item: '坝顶道路', result: 'normal' },
      { item: '上游护坡', result: 'normal' },
      { item: '下游坝坡', result: 'normal' },
      { item: '溢洪道', result: 'normal' },
      { item: '启闭机房', result: 'normal' },
      { item: '观测设施', result: 'abnormal', description: '2号位移计读数偏差较大，需校核' },
    ],
    overallStatus: 'attention',
    nextInspectionDate: '2025-09-01'
  },
  {
    id: 'insp_kns_001',
    damId: 'dam_kns',
    inspectionDate: '2025-08-28',
    inspector: '李工',
    type: 'routine',
    items: [
      { item: '坝顶道路', result: 'normal' },
      { item: '心墙防渗体', result: 'normal' },
      { item: '排水棱体', result: 'normal' },
      { item: '溢洪道', result: 'normal' },
      { item: '放水建筑物', result: 'normal' },
    ],
    overallStatus: 'normal',
    nextInspectionDate: '2025-09-04'
  },
  {
    id: 'insp_dxhz_001',
    damId: 'dam_dxhz',
    inspectionDate: '2025-08-20',
    inspector: '王工',
    type: 'special',
    items: [
      { item: '坝顶道路', result: 'abnormal', description: '局部路面破损' },
      { item: '上游护坡', result: 'abnormal', description: '部分块石松动' },
      { item: '下游坝坡', result: 'normal' },
      { item: '排水设施', result: 'abnormal', description: '排水沟淤积较多' },
      { item: '监测设施', result: 'critical', description: 'ST01沉降计故障' },
    ],
    overallStatus: 'warning',
    nextInspectionDate: '2025-08-27'
  },
]

// 辅助函数
export const getDamById = (id: string): Dam | undefined => Dams.find(d => d.id === id)
export const getSensorsByDam = (damId: string): MonitoringSensor[] => MonitoringSensors.filter(s => s.damId === damId)
export const getRecordsBySensor = (sensorId: string): MonitoringRecord[] => MonitoringRecords.filter(r => r.sensorId === sensorId)
export const getLatestRecord = (sensorId: string): MonitoringRecord | undefined => {
  const records = getRecordsBySensor(sensorId)
  return records.length > 0 ? records[records.length - 1] : undefined
}
