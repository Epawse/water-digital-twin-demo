// 模拟数据源与三维资源清单，用于演示数据管理与页面调度
export type StationKind = 'reservoir' | 'hydrological' | 'rain'

export interface Station {
  id: string
  name: string
  type: StationKind
  lng: number
  lat: number
  status: 'normal' | 'warning' | 'danger'
  waterLevel?: number
  warningLevel?: number
  guaranteeLevel?: number
  inflow?: number
  outflow?: number
  rainfall?: number
  rainfallTotal?: number
  description?: string
}

export interface FloodEvent {
  id: string
  name: string
  severity: 'mild' | 'medium' | 'severe'
  level: 'red' | 'orange' | 'yellow' | 'blue'  // 预警等级
  status: 'pending' | 'active' | 'resolved'    // 事件状态
  start: string
  end: string
  region: string
  basin: string                                 // 流域名称
  center: { lng: number; lat: number }
  affectedArea: number                          // 影响面积 km²
  description: string
  products: {
    inundationGeoJson: string
    waterSurfaceTileset: string
    rainGrid: string
    timeSteps: number
  }
}

export interface RainGridFrame {
  id: string
  time: string
  grid: string
  coverage: string
}

export type IoTProtocol = 'SL651-2014' | 'ModbusRTU' | 'RS485' | 'TCP' | 'MQTT'

export type IoTMetric = 'waterLevel' | 'flow' | 'rainfall' | 'gateStatus' | 'porePressure'

export interface IoTDevice {
  id: string
  name: string
  protocol: IoTProtocol
  stationId: string
  metrics: IoTMetric[]
  freqSec: number
  status: 'online' | 'offline'
  note?: string
}

export interface ThreeDResource {
  id: string
  name: string
  source: string
  tilesetUrl: string
  target: { lng: number; lat: number; height: number }
  note?: string
}

export const SimStations: Station[] = [
  // ========== 水库站 ==========
  // 和田河流域
  { id: 'res_001', name: '乌鲁瓦提水库', type: 'reservoir', lng: 79.35, lat: 37.25, waterLevel: 1962.5, warningLevel: 1965, guaranteeLevel: 1968, inflow: 125, outflow: 110, status: 'normal', description: '和田河干流水库，大型水利枢纽' },
  // 塔里木河流域
  { id: 'res_002', name: '大西海子水库', type: 'reservoir', lng: 86.5, lat: 41.15, waterLevel: 846.8, warningLevel: 848, guaranteeLevel: 850, inflow: 85, outflow: 90, status: 'warning', description: '塔里木河下游水库' },
  { id: 'res_003', name: '克孜尔水库', type: 'reservoir', lng: 82.85, lat: 41.75, waterLevel: 1120, warningLevel: 1125, guaranteeLevel: 1130, inflow: 210, outflow: 195, status: 'normal', description: '渭干河水利枢纽' },
  { id: 'res_004', name: '小二库水库', type: 'reservoir', lng: 81.32, lat: 40.18, waterLevel: 1052.3, warningLevel: 1054.5, guaranteeLevel: 1056.8, inflow: 95, outflow: 88, status: 'normal', description: '塔里木河支流调节水库' },
  // 额尔齐斯河流域
  { id: 'res_005', name: '可可托海水库', type: 'reservoir', lng: 89.78, lat: 47.12, waterLevel: 1288.5, warningLevel: 1290, guaranteeLevel: 1293.5, inflow: 165, outflow: 158, status: 'normal', description: '额尔齐斯河上游水库' },
  { id: 'res_006', name: '布尔津水库', type: 'reservoir', lng: 86.85, lat: 47.72, waterLevel: 542.8, warningLevel: 545, guaranteeLevel: 548, inflow: 280, outflow: 275, status: 'normal', description: '额尔齐斯河支流水库' },
  // 伊犁河流域
  { id: 'res_007', name: '恰甫其海水库', type: 'reservoir', lng: 80.85, lat: 43.62, waterLevel: 1125.6, warningLevel: 1128, guaranteeLevel: 1131, inflow: 320, outflow: 310, status: 'normal', description: '伊犁河干流大型水库' },
  { id: 'res_008', name: '吉林台水库', type: 'reservoir', lng: 82.15, lat: 43.88, waterLevel: 985.2, warningLevel: 988, guaranteeLevel: 991, inflow: 185, outflow: 180, status: 'normal', description: '喀什河水库' },
  // 玛纳斯河流域
  { id: 'res_009', name: '肯斯瓦特水库', type: 'reservoir', lng: 85.42, lat: 43.85, waterLevel: 1278.5, warningLevel: 1280, guaranteeLevel: 1283.5, inflow: 145, outflow: 140, status: 'normal', description: '玛纳斯河干流水库' },
  { id: 'res_010', name: '红山嘴水库', type: 'reservoir', lng: 85.78, lat: 44.15, waterLevel: 865.3, warningLevel: 868, guaranteeLevel: 870, inflow: 78, outflow: 75, status: 'normal', description: '玛纳斯河中游水库' },
  // 开都河-孔雀河流域
  { id: 'res_011', name: '博斯腾湖', type: 'reservoir', lng: 87.05, lat: 41.98, waterLevel: 1048.2, warningLevel: 1049.5, guaranteeLevel: 1050.5, inflow: 35, outflow: 32, status: 'normal', description: '中国最大内陆淡水湖' },
  // 喀什噶尔河流域
  { id: 'res_012', name: '下坂地水库', type: 'reservoir', lng: 75.52, lat: 39.28, waterLevel: 1895.5, warningLevel: 1898, guaranteeLevel: 1901, inflow: 68, outflow: 65, status: 'normal', description: '喀什噶尔河源头水库' },

  // ========== 水文站 ==========
  // 塔里木河干流
  { id: 'hyd_001', name: '阿拉尔水文站', type: 'hydrological', lng: 81.28, lat: 40.55, waterLevel: 1012.5, warningLevel: 1015, status: 'normal', description: '塔里木河上游控制站' },
  { id: 'hyd_002', name: '英巴扎水文站', type: 'hydrological', lng: 84.25, lat: 41.35, waterLevel: 892, warningLevel: 895, status: 'warning', description: '塔里木河中游' },
  { id: 'hyd_003', name: '恰拉水文站', type: 'hydrological', lng: 85.68, lat: 41.22, waterLevel: 878.5, warningLevel: 882, status: 'normal', description: '塔里木河中下游' },
  { id: 'hyd_004', name: '铁干里克水文站', type: 'hydrological', lng: 87.72, lat: 40.68, waterLevel: 835.2, warningLevel: 840, status: 'normal', description: '塔里木河下游' },
  // 伊犁河干流
  { id: 'hyd_005', name: '巩留水文站', type: 'hydrological', lng: 82.25, lat: 43.48, waterLevel: 718.5, warningLevel: 722, status: 'normal', description: '伊犁河上游' },
  { id: 'hyd_006', name: '伊宁水文站', type: 'hydrological', lng: 81.28, lat: 43.92, waterLevel: 625.8, warningLevel: 630, status: 'normal', description: '伊犁河干流' },
  { id: 'hyd_007', name: '雅马渡水文站', type: 'hydrological', lng: 80.35, lat: 44.12, waterLevel: 568.2, warningLevel: 572, status: 'normal', description: '伊犁河出境断面' },
  // 额尔齐斯河干流
  { id: 'hyd_008', name: '可可托海水文站', type: 'hydrological', lng: 89.72, lat: 47.18, waterLevel: 1182.5, warningLevel: 1186, status: 'normal', description: '额尔齐斯河上游' },
  { id: 'hyd_009', name: '北屯水文站', type: 'hydrological', lng: 87.82, lat: 47.35, waterLevel: 518.6, warningLevel: 522, status: 'normal', description: '额尔齐斯河中游' },
  { id: 'hyd_010', name: '布尔津水文站', type: 'hydrological', lng: 86.88, lat: 47.68, waterLevel: 475.3, warningLevel: 480, status: 'normal', description: '额尔齐斯河出境断面' },
  // 其他主要水文站
  { id: 'hyd_011', name: '玛纳斯水文站', type: 'hydrological', lng: 86.22, lat: 44.32, waterLevel: 652.8, warningLevel: 658, status: 'normal', description: '玛纳斯河干流' },
  { id: 'hyd_012', name: '开都河水文站', type: 'hydrological', lng: 86.52, lat: 42.35, waterLevel: 1085.5, warningLevel: 1090, status: 'normal', description: '开都河干流' },
  { id: 'hyd_013', name: '和田水文站', type: 'hydrological', lng: 79.92, lat: 37.15, waterLevel: 1385.2, warningLevel: 1390, status: 'normal', description: '和田河干流' },
  { id: 'hyd_014', name: '叶尔羌水文站', type: 'hydrological', lng: 77.25, lat: 38.42, waterLevel: 1265.8, warningLevel: 1270, status: 'normal', description: '叶尔羌河干流' },
  { id: 'hyd_015', name: '阿克苏水文站', type: 'hydrological', lng: 80.28, lat: 41.12, waterLevel: 1108.5, warningLevel: 1112, status: 'normal', description: '阿克苏河干流' },

  // ========== 雨量站 ==========
  // 天山山脉
  { id: 'rain_001', name: '天山北坡雨量站', type: 'rain', lng: 86.85, lat: 43.95, rainfall: 12.5, rainfallTotal: 185, status: 'normal', description: '天山北坡' },
  { id: 'rain_002', name: '伊犁河谷雨量站', type: 'rain', lng: 81.85, lat: 43.45, rainfall: 25, rainfallTotal: 320, status: 'warning', description: '伊犁河谷' },
  { id: 'rain_003', name: '阿尔泰山雨量站', type: 'rain', lng: 88.12, lat: 47.85, rainfall: 8.5, rainfallTotal: 156, status: 'normal', description: '阿尔泰山区' },
  { id: 'rain_004', name: '乌鲁木齐雨量站', type: 'rain', lng: 87.62, lat: 43.82, rainfall: 15.2, rainfallTotal: 245, status: 'normal', description: '乌鲁木齐市区' },
  { id: 'rain_005', name: '巴音布鲁克雨量站', type: 'rain', lng: 84.15, lat: 43.05, rainfall: 18.5, rainfallTotal: 268, status: 'normal', description: '巴音布鲁克草原' },
  { id: 'rain_006', name: '那拉提雨量站', type: 'rain', lng: 83.85, lat: 43.32, rainfall: 22.8, rainfallTotal: 295, status: 'normal', description: '那拉提草原' },
  // 昆仑山北麓
  { id: 'rain_007', name: '和田山区雨量站', type: 'rain', lng: 79.52, lat: 36.85, rainfall: 5.2, rainfallTotal: 85, status: 'normal', description: '昆仑山北麓' },
  { id: 'rain_008', name: '叶城山区雨量站', type: 'rain', lng: 77.42, lat: 37.52, rainfall: 6.8, rainfallTotal: 92, status: 'normal', description: '喀喇昆仑山区' },
  // 准噶尔盆地
  { id: 'rain_009', name: '石河子雨量站', type: 'rain', lng: 86.05, lat: 44.32, rainfall: 10.5, rainfallTotal: 168, status: 'normal', description: '准噶尔盆地南缘' },
  { id: 'rain_010', name: '克拉玛依雨量站', type: 'rain', lng: 84.85, lat: 45.58, rainfall: 3.2, rainfallTotal: 52, status: 'normal', description: '准噶尔盆地西北' },
  // 塔里木盆地
  { id: 'rain_011', name: '库尔勒雨量站', type: 'rain', lng: 86.15, lat: 41.78, rainfall: 2.5, rainfallTotal: 38, status: 'normal', description: '塔里木盆地东北' },
  { id: 'rain_012', name: '阿克苏雨量站', type: 'rain', lng: 80.28, lat: 41.18, rainfall: 4.5, rainfallTotal: 65, status: 'normal', description: '塔里木盆地北缘' },
  { id: 'rain_013', name: '喀什雨量站', type: 'rain', lng: 76.02, lat: 39.48, rainfall: 3.8, rainfallTotal: 58, status: 'normal', description: '塔里木盆地西缘' },
  // 哈密-吐鲁番
  { id: 'rain_014', name: '哈密雨量站', type: 'rain', lng: 93.52, lat: 42.82, rainfall: 2.2, rainfallTotal: 35, status: 'normal', description: '东天山南麓' },
  { id: 'rain_015', name: '吐鲁番雨量站', type: 'rain', lng: 89.18, lat: 42.95, rainfall: 0.8, rainfallTotal: 12, status: 'normal', description: '吐鲁番盆地，全国最干旱' },
]

export const FloodEvents: FloodEvent[] = [
  // 喀什-和田流域
  {
    id: 'evt_mild',
    name: '中小洪水演练',
    severity: 'mild',
    level: 'blue',
    status: 'resolved',
    start: '2025-09-01T00:00:00Z',
    end: '2025-09-02T00:00:00Z',
    region: '喀什-和田流域',
    basin: '和田河',
    center: { lng: 79.6, lat: 38.1 },
    affectedArea: 450,
    description: '短历时中小洪水，验证站点联动与淹没范围展示。',
    products: {
      inundationGeoJson: '/mock/flood/mild/inundation.geojson',
      waterSurfaceTileset: '/mock/flood/mild/tileset.json',
      rainGrid: '/mock/flood/mild/rain.nc',
      timeSteps: 24,
    }
  },
  // 塔里木河干流
  {
    id: 'evt_large',
    name: '大洪水演练',
    severity: 'medium',
    level: 'orange',
    status: 'active',
    start: '2025-09-05T00:00:00Z',
    end: '2025-09-06T12:00:00Z',
    region: '塔里木干流',
    basin: '塔里木河',
    center: { lng: 82.5, lat: 40.7 },
    affectedArea: 1280,
    description: '覆盖主干流的洪水过程，包含分时淹没面与水位过程线。',
    products: {
      inundationGeoJson: '/mock/flood/large/inundation.geojson',
      waterSurfaceTileset: '/mock/flood/large/tileset.json',
      rainGrid: '/mock/flood/large/rain.nc',
      timeSteps: 36,
    }
  },
  // 伊犁河流域
  {
    id: 'evt_extreme',
    name: '特大洪水演练',
    severity: 'severe',
    level: 'red',
    status: 'active',
    start: '2025-09-10T00:00:00Z',
    end: '2025-09-12T00:00:00Z',
    region: '伊犁河流域',
    basin: '伊犁河',
    center: { lng: 81.2, lat: 43.8 },
    affectedArea: 2560,
    description: '特大洪水假设场景，用于压力测试可视化与交互。',
    products: {
      inundationGeoJson: '/mock/flood/extreme/inundation.geojson',
      waterSurfaceTileset: '/mock/flood/extreme/tileset.json',
      rainGrid: '/mock/flood/extreme/rain.nc',
      timeSteps: 48,
    }
  },
  // 额尔齐斯河流域
  {
    id: 'evt_irtysh_spring',
    name: '额尔齐斯河春汛',
    severity: 'medium',
    level: 'yellow',
    status: 'pending',
    start: '2025-04-15T00:00:00Z',
    end: '2025-04-20T00:00:00Z',
    region: '额尔齐斯河流域',
    basin: '额尔齐斯河',
    center: { lng: 88.5, lat: 47.5 },
    affectedArea: 980,
    description: '春季融雪性洪水，阿尔泰山区积雪快速消融引发。',
    products: {
      inundationGeoJson: '/mock/flood/irtysh_spring/inundation.geojson',
      waterSurfaceTileset: '/mock/flood/irtysh_spring/tileset.json',
      rainGrid: '/mock/flood/irtysh_spring/rain.nc',
      timeSteps: 120,
    }
  },
  // 玛纳斯河流域
  {
    id: 'evt_manas_summer',
    name: '玛纳斯河夏季洪水',
    severity: 'mild',
    level: 'blue',
    status: 'resolved',
    start: '2025-07-20T00:00:00Z',
    end: '2025-07-22T00:00:00Z',
    region: '玛纳斯河流域',
    basin: '玛纳斯河',
    center: { lng: 86.0, lat: 44.0 },
    affectedArea: 320,
    description: '夏季暴雨叠加冰川融水形成的洪水过程。',
    products: {
      inundationGeoJson: '/mock/flood/manas_summer/inundation.geojson',
      waterSurfaceTileset: '/mock/flood/manas_summer/tileset.json',
      rainGrid: '/mock/flood/manas_summer/rain.nc',
      timeSteps: 48,
    }
  },
  // 开都河-孔雀河流域
  {
    id: 'evt_kaidu_flood',
    name: '开都河洪水演练',
    severity: 'medium',
    level: 'yellow',
    status: 'active',
    start: '2025-08-01T00:00:00Z',
    end: '2025-08-04T00:00:00Z',
    region: '开都河-博斯腾湖',
    basin: '开都河',
    center: { lng: 86.5, lat: 42.0 },
    affectedArea: 860,
    description: '天山南坡暴雨引发的开都河洪水，影响博斯腾湖水位。',
    products: {
      inundationGeoJson: '/mock/flood/kaidu/inundation.geojson',
      waterSurfaceTileset: '/mock/flood/kaidu/tileset.json',
      rainGrid: '/mock/flood/kaidu/rain.nc',
      timeSteps: 72,
    }
  },
  // 叶尔羌河流域（冰川湖溃决）
  {
    id: 'evt_yarkant_glof',
    name: '叶尔羌河冰湖溃决洪水',
    severity: 'severe',
    level: 'red',
    status: 'active',
    start: '2025-08-15T00:00:00Z',
    end: '2025-08-18T00:00:00Z',
    region: '叶尔羌河流域',
    basin: '叶尔羌河',
    center: { lng: 77.0, lat: 38.0 },
    affectedArea: 1850,
    description: '喀喇昆仑山冰川湖溃决(GLOF)引发的特大洪水，突发性强。',
    products: {
      inundationGeoJson: '/mock/flood/yarkant_glof/inundation.geojson',
      waterSurfaceTileset: '/mock/flood/yarkant_glof/tileset.json',
      rainGrid: '/mock/flood/yarkant_glof/rain.nc',
      timeSteps: 72,
    }
  }
]

export const RainGridFrames: RainGridFrame[] = [
  { id: 'rain_20250901_00', time: '2025-09-01T00:00:00Z', grid: '/mock/rain/20250901_00.nc', coverage: '全疆' },
  { id: 'rain_20250901_06', time: '2025-09-01T06:00:00Z', grid: '/mock/rain/20250901_06.nc', coverage: '全疆' },
  { id: 'rain_20250901_12', time: '2025-09-01T12:00:00Z', grid: '/mock/rain/20250901_12.nc', coverage: '全疆' },
  { id: 'rain_20250901_18', time: '2025-09-01T18:00:00Z', grid: '/mock/rain/20250901_18.nc', coverage: '全疆' },
]

export const IoTDevices: IoTDevice[] = [
  // 塔里木河流域
  { id: 'iot_lvl_001', name: '水位遥测终端-阿拉尔', protocol: 'SL651-2014', stationId: 'hyd_001', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准，5分钟一报' },
  { id: 'iot_lvl_002', name: '水位遥测终端-英巴扎', protocol: 'SL651-2014', stationId: 'hyd_002', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_lvl_003', name: '水位遥测终端-恰拉', protocol: 'SL651-2014', stationId: 'hyd_003', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_gate_001', name: '闸门控制器-大西海子', protocol: 'ModbusRTU', stationId: 'res_002', metrics: ['gateStatus'], freqSec: 120, status: 'online', note: 'Modbus RTU轮询' },
  { id: 'iot_pore_001', name: '渗压计-大西海子坝', protocol: 'RS485', stationId: 'res_002', metrics: ['porePressure'], freqSec: 900, status: 'online', note: '大坝安全监测' },

  // 伊犁河流域
  { id: 'iot_rain_001', name: '雨量站终端-伊犁', protocol: 'RS485', stationId: 'rain_002', metrics: ['rainfall'], freqSec: 600, status: 'online', note: 'RS485 总线' },
  { id: 'iot_lvl_004', name: '水位遥测终端-巩留', protocol: 'SL651-2014', stationId: 'hyd_005', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_lvl_005', name: '水位遥测终端-伊宁', protocol: 'SL651-2014', stationId: 'hyd_006', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_gate_002', name: '闸门控制器-恰甫其海', protocol: 'ModbusRTU', stationId: 'res_007', metrics: ['gateStatus'], freqSec: 120, status: 'online', note: 'Modbus RTU' },

  // 额尔齐斯河流域
  { id: 'iot_lvl_006', name: '水位遥测终端-可可托海', protocol: 'SL651-2014', stationId: 'hyd_008', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_lvl_007', name: '水位遥测终端-北屯', protocol: 'SL651-2014', stationId: 'hyd_009', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_rain_002', name: '雨量站终端-阿尔泰', protocol: 'MQTT', stationId: 'rain_003', metrics: ['rainfall'], freqSec: 300, status: 'online', note: 'MQTT协议，新一代设备' },
  { id: 'iot_gate_003', name: '闸门控制器-可可托海', protocol: 'ModbusRTU', stationId: 'res_005', metrics: ['gateStatus'], freqSec: 120, status: 'online', note: 'Modbus RTU' },

  // 和田河流域
  { id: 'iot_pore_002', name: '渗压计-乌鲁瓦提坝', protocol: 'RS485', stationId: 'res_001', metrics: ['porePressure'], freqSec: 900, status: 'online', note: '大坝安全监测' },
  { id: 'iot_lvl_008', name: '水位遥测终端-和田', protocol: 'SL651-2014', stationId: 'hyd_013', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_gate_004', name: '闸门控制器-乌鲁瓦提', protocol: 'ModbusRTU', stationId: 'res_001', metrics: ['gateStatus'], freqSec: 120, status: 'online', note: 'Modbus RTU' },

  // 玛纳斯河流域
  { id: 'iot_lvl_009', name: '水位遥测终端-玛纳斯', protocol: 'SL651-2014', stationId: 'hyd_011', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_gate_005', name: '闸门控制器-肯斯瓦特', protocol: 'ModbusRTU', stationId: 'res_009', metrics: ['gateStatus'], freqSec: 120, status: 'online', note: 'Modbus RTU' },
  { id: 'iot_rain_003', name: '雨量站终端-石河子', protocol: 'MQTT', stationId: 'rain_009', metrics: ['rainfall'], freqSec: 300, status: 'online', note: 'MQTT协议' },

  // 开都河流域
  { id: 'iot_lvl_010', name: '水位遥测终端-开都河', protocol: 'SL651-2014', stationId: 'hyd_012', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_rain_004', name: '雨量站终端-库尔勒', protocol: 'RS485', stationId: 'rain_011', metrics: ['rainfall'], freqSec: 600, status: 'online', note: 'RS485 总线' },

  // 天山北坡
  { id: 'iot_rain_005', name: '雨量站终端-天山北坡', protocol: 'MQTT', stationId: 'rain_001', metrics: ['rainfall'], freqSec: 300, status: 'online', note: 'MQTT协议' },
  { id: 'iot_rain_006', name: '雨量站终端-乌鲁木齐', protocol: 'TCP', stationId: 'rain_004', metrics: ['rainfall'], freqSec: 300, status: 'online', note: 'TCP直连' },

  // 叶尔羌河流域
  { id: 'iot_lvl_011', name: '水位遥测终端-叶尔羌', protocol: 'SL651-2014', stationId: 'hyd_014', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_rain_007', name: '雨量站终端-叶城', protocol: 'RS485', stationId: 'rain_008', metrics: ['rainfall'], freqSec: 600, status: 'offline', note: '设备离线维护中' },

  // 阿克苏河流域
  { id: 'iot_lvl_012', name: '水位遥测终端-阿克苏', protocol: 'SL651-2014', stationId: 'hyd_015', metrics: ['waterLevel', 'flow'], freqSec: 300, status: 'online', note: 'SL651 标准' },
  { id: 'iot_gate_006', name: '闸门控制器-克孜尔', protocol: 'ModbusRTU', stationId: 'res_003', metrics: ['gateStatus'], freqSec: 120, status: 'online', note: 'Modbus RTU' },
]

export const ThreeDResources: ThreeDResource[] = [
  {
    id: 'urumqi_buildings',
    name: '乌鲁木齐市建筑群',
    source: '程序化生成',
    tilesetUrl: '', // 不再使用外部3D Tiles，改用Entity生成
    target: { lng: 87.617, lat: 43.792, height: 800 },
    note: '使用Cesium Entity程序化生成的乌鲁木齐市建筑模拟数据。'
  },
  {
    id: 'urumqi_water_facilities',
    name: '乌鲁木齐水利设施',
    source: '程序化生成',
    tilesetUrl: '',
    target: { lng: 87.5, lat: 43.7, height: 800 },
    note: '模拟水利基础设施：水库管理站、泵站、闸站等。'
  }
]

// 分组/衍生数据
export const ReservoirStations = SimStations.filter(s => s.type === 'reservoir')
export const HydrologicalStations = SimStations.filter(s => s.type === 'hydrological')
export const RainStations = SimStations.filter(s => s.type === 'rain')
export const WarningStations = SimStations.filter(s => s.status === 'warning' || s.status === 'danger')
export const XinjiangCenter = { lng: 85, lat: 41.5, height: 3000000 }
