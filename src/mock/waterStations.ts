/**
 * 新疆水利站点模拟数据
 * 包含水库、水文站、雨量站等
 */

export interface WaterStation {
  id: string
  name: string
  type: 'reservoir' | 'hydrological' | 'rain' // 水库 | 水文站 | 雨量站
  lng: number
  lat: number
  // 水位数据
  waterLevel?: number      // 当前水位 (m)
  warningLevel?: number    // 警戒水位 (m)
  guaranteeLevel?: number  // 保证水位 (m)
  // 水库特有
  capacity?: string        // 库容
  inflow?: number          // 入库流量 (m³/s)
  outflow?: number         // 出库流量 (m³/s)
  // 雨量数据
  rainfall?: number        // 当日降雨量 (mm)
  rainfallTotal?: number   // 累计降雨量 (mm)
  // 状态
  status: 'normal' | 'warning' | 'danger'
  description?: string
}

// 新疆主要水库
export const reservoirs: WaterStation[] = [
  {
    id: 'reservoir_001',
    name: '乌鲁瓦提水库',
    type: 'reservoir',
    lng: 79.35,
    lat: 37.25,
    waterLevel: 1962.5,
    warningLevel: 1965.0,
    guaranteeLevel: 1968.0,
    capacity: '3.47亿m³',
    inflow: 125,
    outflow: 110,
    status: 'normal',
    description: '和田河干流上的大型水库'
  },
  {
    id: 'reservoir_002',
    name: '大西海子水库',
    type: 'reservoir',
    lng: 86.5,
    lat: 41.15,
    waterLevel: 846.8,
    warningLevel: 848.0,
    guaranteeLevel: 850.0,
    capacity: '1.5亿m³',
    inflow: 85,
    outflow: 90,
    status: 'warning',
    description: '塔里木河下游重要水库'
  },
  {
    id: 'reservoir_003',
    name: '克孜尔水库',
    type: 'reservoir',
    lng: 82.85,
    lat: 41.75,
    waterLevel: 1120.0,
    warningLevel: 1125.0,
    guaranteeLevel: 1130.0,
    capacity: '6.4亿m³',
    inflow: 210,
    outflow: 195,
    status: 'normal',
    description: '渭干河上大型水利枢纽'
  },
  {
    id: 'reservoir_004',
    name: '乌拉泊水库',
    type: 'reservoir',
    lng: 87.45,
    lat: 43.65,
    waterLevel: 918.5,
    warningLevel: 920.0,
    guaranteeLevel: 922.0,
    capacity: '0.8亿m³',
    inflow: 45,
    outflow: 50,
    status: 'normal',
    description: '乌鲁木齐市重要水源地'
  },
  {
    id: 'reservoir_005',
    name: '红山水库',
    type: 'reservoir',
    lng: 87.55,
    lat: 43.85,
    waterLevel: 1052.0,
    warningLevel: 1050.0,
    guaranteeLevel: 1055.0,
    capacity: '0.5亿m³',
    inflow: 38,
    outflow: 30,
    status: 'danger',
    description: '乌鲁木齐河上游水库'
  },
  {
    id: 'reservoir_006',
    name: '开都河水库',
    type: 'reservoir',
    lng: 86.15,
    lat: 42.05,
    waterLevel: 1048.0,
    warningLevel: 1055.0,
    guaranteeLevel: 1060.0,
    capacity: '2.1亿m³',
    inflow: 156,
    outflow: 140,
    status: 'normal',
    description: '博斯腾湖主要补给水源'
  },
]

// 新疆水文站
export const hydrologicalStations: WaterStation[] = [
  {
    id: 'hydro_001',
    name: '阿拉尔水文站',
    type: 'hydrological',
    lng: 81.28,
    lat: 40.55,
    waterLevel: 1012.5,
    warningLevel: 1015.0,
    status: 'normal',
    description: '塔里木河上游重要水文站'
  },
  {
    id: 'hydro_002',
    name: '英巴扎水文站',
    type: 'hydrological',
    lng: 84.25,
    lat: 41.35,
    waterLevel: 892.0,
    warningLevel: 895.0,
    status: 'warning',
    description: '塔里木河中游水文站'
  },
  {
    id: 'hydro_003',
    name: '伊宁水文站',
    type: 'hydrological',
    lng: 81.32,
    lat: 43.92,
    waterLevel: 645.5,
    warningLevel: 650.0,
    status: 'normal',
    description: '伊犁河谷重要水文站'
  },
  {
    id: 'hydro_004',
    name: '喀什水文站',
    type: 'hydrological',
    lng: 75.98,
    lat: 39.47,
    waterLevel: 1285.0,
    warningLevel: 1290.0,
    status: 'normal',
    description: '喀什噶尔河水文监测'
  },
  {
    id: 'hydro_005',
    name: '哈密水文站',
    type: 'hydrological',
    lng: 93.52,
    lat: 42.82,
    waterLevel: 738.0,
    warningLevel: 745.0,
    status: 'normal',
    description: '哈密盆地水文监测'
  },
]

// 新疆雨量站
export const rainStations: WaterStation[] = [
  {
    id: 'rain_001',
    name: '天山北坡雨量站',
    type: 'rain',
    lng: 86.85,
    lat: 43.95,
    rainfall: 12.5,
    rainfallTotal: 185.0,
    status: 'normal',
    description: '天山北坡降水监测'
  },
  {
    id: 'rain_002',
    name: '伊犁河谷雨量站',
    type: 'rain',
    lng: 81.85,
    lat: 43.45,
    rainfall: 25.0,
    rainfallTotal: 320.0,
    status: 'warning',
    description: '伊犁河谷降水监测，降雨偏多'
  },
  {
    id: 'rain_003',
    name: '阿尔泰山雨量站',
    type: 'rain',
    lng: 88.12,
    lat: 47.85,
    rainfall: 8.5,
    rainfallTotal: 156.0,
    status: 'normal',
    description: '阿尔泰山区降水监测'
  },
  {
    id: 'rain_004',
    name: '昆仑山北麓雨量站',
    type: 'rain',
    lng: 80.25,
    lat: 37.05,
    rainfall: 3.2,
    rainfallTotal: 45.0,
    status: 'normal',
    description: '昆仑山北麓降水监测'
  },
  {
    id: 'rain_005',
    name: '塔城雨量站',
    type: 'rain',
    lng: 82.98,
    lat: 46.75,
    rainfall: 18.0,
    rainfallTotal: 210.0,
    status: 'normal',
    description: '塔城地区降水监测'
  },
]

// 所有站点汇总
export const allStations: WaterStation[] = [
  ...reservoirs,
  ...hydrologicalStations,
  ...rainStations,
]

// 新疆区域中心点（用于地图初始定位）
export const xinjiangCenter = {
  lng: 85.0,
  lat: 41.5,
  height: 3000000  // 相机高度，可看到整个新疆
}

// 新疆边界范围（大致）
export const xinjiangBounds = {
  west: 73.5,
  east: 96.5,
  south: 34.5,
  north: 49.2
}
