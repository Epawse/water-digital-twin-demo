// 气象雷达数据 - 新疆全域
// 包含：气象雷达站点、雷达回波数据、卫星云图元数据

export type RadarType = 'doppler' | 'dual-polarization' | 'phased-array'

export interface RadarStation {
  id: string
  name: string
  type: RadarType
  lng: number
  lat: number
  altitude: number // 海拔高度(m)
  range: number // 探测半径(km)
  status: 'online' | 'offline' | 'maintenance'
  updateFreq: number // 更新频率(分钟)
  description?: string
}

export interface RadarEchoFrame {
  id: string
  stationId: string
  timestamp: string
  echoUrl: string // 雷达回波图URL
  maxDbz: number // 最大回波强度(dBZ)
  coverage: number // 降水覆盖率(%)
  precipType: 'none' | 'light' | 'moderate' | 'heavy' | 'storm'
}

export interface SatelliteImage {
  id: string
  satellite: string
  sensor: string
  timestamp: string
  bounds: { west: number; south: number; east: number; north: number }
  resolution: number // 空间分辨率(m)
  cloudCover: number // 云量(%)
  url: string
  bands: string[]
}

export interface WeatherForecast {
  id: string
  region: string
  issueTime: string
  validFrom: string
  validTo: string
  temperature: { min: number; max: number }
  precipitation: number // 预报降水量(mm)
  precipProbability: number // 降水概率(%)
  windSpeed: number // 风速(m/s)
  windDirection: string
  weather: string
  warningLevel?: 'blue' | 'yellow' | 'orange' | 'red'
}

// 新疆气象雷达站点 - 覆盖主要城市和流域
export const RadarStations: RadarStation[] = [
  // 北疆雷达站
  { id: 'radar_urumqi', name: '乌鲁木齐雷达站', type: 'dual-polarization', lng: 87.617, lat: 43.792, altitude: 935, range: 230, status: 'online', updateFreq: 6, description: '新疆中心气象雷达' },
  { id: 'radar_changji', name: '昌吉雷达站', type: 'doppler', lng: 87.308, lat: 44.011, altitude: 580, range: 200, status: 'online', updateFreq: 6, description: '天山北坡经济带' },
  { id: 'radar_shihezi', name: '石河子雷达站', type: 'doppler', lng: 86.041, lat: 44.306, altitude: 442, range: 200, status: 'online', updateFreq: 6, description: '玛纳斯河流域' },
  { id: 'radar_yili', name: '伊宁雷达站', type: 'dual-polarization', lng: 81.278, lat: 43.921, altitude: 663, range: 230, status: 'online', updateFreq: 6, description: '伊犁河谷' },
  { id: 'radar_tacheng', name: '塔城雷达站', type: 'doppler', lng: 82.987, lat: 46.751, altitude: 548, range: 200, status: 'online', updateFreq: 6, description: '塔额盆地' },
  { id: 'radar_altay', name: '阿勒泰雷达站', type: 'doppler', lng: 88.139, lat: 47.848, altitude: 737, range: 200, status: 'online', updateFreq: 6, description: '额尔齐斯河上游' },
  { id: 'radar_bole', name: '博乐雷达站', type: 'doppler', lng: 82.067, lat: 44.906, altitude: 532, range: 180, status: 'online', updateFreq: 6, description: '博尔塔拉河流域' },

  // 南疆雷达站
  { id: 'radar_korla', name: '库尔勒雷达站', type: 'dual-polarization', lng: 86.146, lat: 41.764, altitude: 932, range: 230, status: 'online', updateFreq: 6, description: '塔里木盆地东北' },
  { id: 'radar_aksu', name: '阿克苏雷达站', type: 'doppler', lng: 80.263, lat: 41.123, altitude: 1108, range: 200, status: 'online', updateFreq: 6, description: '塔里木河上游' },
  { id: 'radar_kashgar', name: '喀什雷达站', type: 'dual-polarization', lng: 75.989, lat: 39.467, altitude: 1291, range: 230, status: 'online', updateFreq: 6, description: '喀什噶尔河流域' },
  { id: 'radar_hotan', name: '和田雷达站', type: 'doppler', lng: 79.927, lat: 37.112, altitude: 1375, range: 200, status: 'online', updateFreq: 6, description: '和田河流域' },
  { id: 'radar_ruoqiang', name: '若羌雷达站', type: 'doppler', lng: 88.167, lat: 39.023, altitude: 888, range: 180, status: 'maintenance', updateFreq: 6, description: '塔里木盆地东南' },

  // 东疆雷达站
  { id: 'radar_hami', name: '哈密雷达站', type: 'doppler', lng: 93.514, lat: 42.818, altitude: 739, range: 200, status: 'online', updateFreq: 6, description: '东天山区域' },
  { id: 'radar_turpan', name: '吐鲁番雷达站', type: 'doppler', lng: 89.189, lat: 42.951, altitude: -50, range: 180, status: 'online', updateFreq: 6, description: '吐鲁番盆地' },
]

// 雷达回波数据帧示例
export const RadarEchoFrames: RadarEchoFrame[] = [
  { id: 'echo_urumqi_001', stationId: 'radar_urumqi', timestamp: '2025-09-01T00:00:00Z', echoUrl: '/mock/radar/urumqi_00.png', maxDbz: 35, coverage: 15, precipType: 'light' },
  { id: 'echo_urumqi_002', stationId: 'radar_urumqi', timestamp: '2025-09-01T00:06:00Z', echoUrl: '/mock/radar/urumqi_06.png', maxDbz: 42, coverage: 22, precipType: 'moderate' },
  { id: 'echo_urumqi_003', stationId: 'radar_urumqi', timestamp: '2025-09-01T00:12:00Z', echoUrl: '/mock/radar/urumqi_12.png', maxDbz: 48, coverage: 28, precipType: 'moderate' },
  { id: 'echo_yili_001', stationId: 'radar_yili', timestamp: '2025-09-01T00:00:00Z', echoUrl: '/mock/radar/yili_00.png', maxDbz: 55, coverage: 35, precipType: 'heavy' },
  { id: 'echo_yili_002', stationId: 'radar_yili', timestamp: '2025-09-01T00:06:00Z', echoUrl: '/mock/radar/yili_06.png', maxDbz: 58, coverage: 40, precipType: 'heavy' },
  { id: 'echo_korla_001', stationId: 'radar_korla', timestamp: '2025-09-01T00:00:00Z', echoUrl: '/mock/radar/korla_00.png', maxDbz: 25, coverage: 8, precipType: 'light' },
  { id: 'echo_kashgar_001', stationId: 'radar_kashgar', timestamp: '2025-09-01T00:00:00Z', echoUrl: '/mock/radar/kashgar_00.png', maxDbz: 30, coverage: 12, precipType: 'light' },
]

// 卫星影像元数据
export const SatelliteImages: SatelliteImage[] = [
  {
    id: 'sat_fy4a_001',
    satellite: 'FY-4A',
    sensor: 'AGRI',
    timestamp: '2025-09-01T00:00:00Z',
    bounds: { west: 73, south: 34, east: 97, north: 50 },
    resolution: 500,
    cloudCover: 25,
    url: '/mock/satellite/fy4a_xinjiang_001.tif',
    bands: ['VIS', 'NIR', 'WV', 'IR']
  },
  {
    id: 'sat_fy4a_002',
    satellite: 'FY-4A',
    sensor: 'AGRI',
    timestamp: '2025-09-01T01:00:00Z',
    bounds: { west: 73, south: 34, east: 97, north: 50 },
    resolution: 500,
    cloudCover: 28,
    url: '/mock/satellite/fy4a_xinjiang_002.tif',
    bands: ['VIS', 'NIR', 'WV', 'IR']
  },
  {
    id: 'sat_gf1_001',
    satellite: 'GF-1',
    sensor: 'PMS',
    timestamp: '2025-08-28T04:30:00Z',
    bounds: { west: 79, south: 40, east: 82, north: 42 },
    resolution: 2,
    cloudCover: 5,
    url: '/mock/satellite/gf1_tarim_001.tif',
    bands: ['R', 'G', 'B', 'NIR']
  },
  {
    id: 'sat_sentinel2_001',
    satellite: 'Sentinel-2',
    sensor: 'MSI',
    timestamp: '2025-08-30T05:15:00Z',
    bounds: { west: 80, south: 43, east: 83, north: 45 },
    resolution: 10,
    cloudCover: 12,
    url: '/mock/satellite/sentinel2_yili_001.tif',
    bands: ['B02', 'B03', 'B04', 'B08', 'B11', 'B12']
  },
]

// 天气预报数据
export const WeatherForecasts: WeatherForecast[] = [
  // 北疆
  { id: 'fc_urumqi_001', region: '乌鲁木齐市', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 15, max: 28 }, precipitation: 5, precipProbability: 40, windSpeed: 3.5, windDirection: 'NW', weather: '多云转小雨' },
  { id: 'fc_yili_001', region: '伊犁哈萨克自治州', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 12, max: 25 }, precipitation: 25, precipProbability: 75, windSpeed: 4.2, windDirection: 'W', weather: '中到大雨', warningLevel: 'yellow' },
  { id: 'fc_altay_001', region: '阿勒泰地区', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 8, max: 22 }, precipitation: 8, precipProbability: 50, windSpeed: 5.0, windDirection: 'N', weather: '阵雨' },
  { id: 'fc_tacheng_001', region: '塔城地区', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 10, max: 24 }, precipitation: 15, precipProbability: 60, windSpeed: 4.8, windDirection: 'NW', weather: '小到中雨' },

  // 南疆
  { id: 'fc_korla_001', region: '巴音郭楞蒙古自治州', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 18, max: 32 }, precipitation: 0, precipProbability: 10, windSpeed: 2.5, windDirection: 'E', weather: '晴' },
  { id: 'fc_aksu_001', region: '阿克苏地区', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 16, max: 30 }, precipitation: 2, precipProbability: 20, windSpeed: 3.0, windDirection: 'SW', weather: '多云' },
  { id: 'fc_kashgar_001', region: '喀什地区', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 17, max: 33 }, precipitation: 0, precipProbability: 5, windSpeed: 2.0, windDirection: 'S', weather: '晴间多云' },
  { id: 'fc_hotan_001', region: '和田地区', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 20, max: 35 }, precipitation: 0, precipProbability: 5, windSpeed: 2.8, windDirection: 'SE', weather: '晴' },

  // 东疆
  { id: 'fc_hami_001', region: '哈密市', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 16, max: 30 }, precipitation: 0, precipProbability: 10, windSpeed: 4.0, windDirection: 'E', weather: '晴' },
  { id: 'fc_turpan_001', region: '吐鲁番市', issueTime: '2025-09-01T06:00:00Z', validFrom: '2025-09-01T08:00:00Z', validTo: '2025-09-02T08:00:00Z', temperature: { min: 25, max: 42 }, precipitation: 0, precipProbability: 0, windSpeed: 3.5, windDirection: 'E', weather: '晴，高温' },
]

// 新疆气象区域边界
export const XinjiangMeteoBounds = {
  west: 73.5,
  south: 34.3,
  east: 96.4,
  north: 49.2
}

// 辅助函数：根据dBZ判断降水强度
export const getDbzLevel = (dbz: number): string => {
  if (dbz < 15) return '无降水'
  if (dbz < 30) return '小雨'
  if (dbz < 40) return '中雨'
  if (dbz < 50) return '大雨'
  return '暴雨/冰雹'
}
