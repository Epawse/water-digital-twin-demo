// 雨量网格数据 - 用于热力图展示
// 模拟的降雨格点数据，支持时序动画

export interface RainfallGridPoint {
  lng: number
  lat: number
  value: number // 降雨量 (mm/h)
}

export interface RainfallFrame {
  id: string
  timestamp: string
  points: RainfallGridPoint[]
  stats: {
    maxRainfall: number
    avgRainfall: number
    totalPoints: number
    rainyPoints: number
  }
}

// 生成网格点坐标 (覆盖主要流域区域)
const generateGridPoints = (
  bounds: { west: number; south: number; east: number; north: number },
  resolution: number = 0.5
): { lng: number; lat: number }[] => {
  const points: { lng: number; lat: number }[] = []
  for (let lng = bounds.west; lng <= bounds.east; lng += resolution) {
    for (let lat = bounds.south; lat <= bounds.north; lat += resolution) {
      points.push({ lng, lat })
    }
  }
  return points
}

// 模拟降雨分布 - 使用多个降雨中心
const simulateRainfall = (
  lng: number,
  lat: number,
  centers: { lng: number; lat: number; intensity: number; radius: number }[],
  time: number
): number => {
  let rainfall = 0

  for (const center of centers) {
    const distance = Math.sqrt(
      Math.pow((lng - center.lng) * Math.cos(lat * Math.PI / 180), 2) +
      Math.pow(lat - center.lat, 2)
    ) * 111 // 转换为km

    if (distance < center.radius) {
      const factor = Math.exp(-distance / (center.radius * 0.4))
      const timeFactor = Math.sin(time * Math.PI / 12 + center.lng * 0.1) * 0.3 + 0.7
      rainfall += center.intensity * factor * timeFactor
    }
  }

  // 添加随机噪声
  rainfall *= (0.8 + Math.random() * 0.4)

  return Math.max(0, rainfall)
}

// 伊犁河流域降雨中心
const yiliRainCenters = [
  { lng: 81.5, lat: 43.8, intensity: 35, radius: 80 },
  { lng: 82.2, lat: 44.1, intensity: 28, radius: 60 },
  { lng: 80.8, lat: 43.5, intensity: 22, radius: 50 },
]

// 塔里木河流域降雨中心
const tarimRainCenters = [
  { lng: 82.5, lat: 41.2, intensity: 18, radius: 100 },
  { lng: 84.0, lat: 40.8, intensity: 12, radius: 70 },
]

// 额尔齐斯河流域降雨中心
const irtyshRainCenters = [
  { lng: 87.5, lat: 47.5, intensity: 25, radius: 90 },
  { lng: 89.0, lat: 48.0, intensity: 20, radius: 60 },
]

// 区域边界定义
export const RegionBounds = {
  yili: { west: 79.5, south: 42.5, east: 84.0, north: 45.0 },
  tarim: { west: 79.0, south: 39.0, east: 88.0, north: 42.0 },
  irtysh: { west: 85.0, south: 46.0, east: 91.0, north: 49.0 },
  xinjiang: { west: 73.5, south: 34.3, east: 96.4, north: 49.2 }
}

// 生成雨量帧数据
const generateRainfallFrames = (
  region: 'yili' | 'tarim' | 'irtysh',
  hours: number = 24
): RainfallFrame[] => {
  const frames: RainfallFrame[] = []
  const bounds = RegionBounds[region]
  const basePoints = generateGridPoints(bounds, 0.3)

  const centers = {
    yili: yiliRainCenters,
    tarim: tarimRainCenters,
    irtysh: irtyshRainCenters
  }[region]

  const startTime = new Date('2025-09-01T00:00:00Z')

  for (let h = 0; h < hours; h++) {
    const points: RainfallGridPoint[] = basePoints.map(p => ({
      lng: p.lng,
      lat: p.lat,
      value: simulateRainfall(p.lng, p.lat, centers, h)
    }))

    const rainyPoints = points.filter(p => p.value > 0.5)
    const maxRainfall = Math.max(...points.map(p => p.value))
    const avgRainfall = rainyPoints.length > 0
      ? rainyPoints.reduce((sum, p) => sum + p.value, 0) / rainyPoints.length
      : 0

    frames.push({
      id: `${region}_rain_${h.toString().padStart(3, '0')}`,
      timestamp: new Date(startTime.getTime() + h * 3600000).toISOString(),
      points,
      stats: {
        maxRainfall: Number(maxRainfall.toFixed(1)),
        avgRainfall: Number(avgRainfall.toFixed(1)),
        totalPoints: points.length,
        rainyPoints: rainyPoints.length
      }
    })
  }

  return frames
}

// 导出预生成的雨量数据
export const YiliRainfallFrames = generateRainfallFrames('yili', 24)
export const TarimRainfallFrames = generateRainfallFrames('tarim', 24)
export const IrtyshRainfallFrames = generateRainfallFrames('irtysh', 24)

// 合并所有区域数据
export const AllRainfallFrames: { [key: string]: RainfallFrame[] } = {
  yili: YiliRainfallFrames,
  tarim: TarimRainfallFrames,
  irtysh: IrtyshRainfallFrames
}

// 降雨等级颜色配置
export const RainfallColorScale = [
  { threshold: 0, color: 'rgba(0, 0, 0, 0)', label: '无降水' },
  { threshold: 0.5, color: 'rgba(166, 242, 204, 0.6)', label: '微量' },
  { threshold: 2.5, color: 'rgba(65, 193, 124, 0.7)', label: '小雨' },
  { threshold: 8, color: 'rgba(0, 150, 200, 0.75)', label: '中雨' },
  { threshold: 16, color: 'rgba(0, 0, 255, 0.8)', label: '大雨' },
  { threshold: 32, color: 'rgba(255, 0, 255, 0.85)', label: '暴雨' },
  { threshold: 64, color: 'rgba(255, 0, 0, 0.9)', label: '大暴雨' },
]

// 辅助函数：根据降雨量获取颜色
export const getRainfallColor = (value: number): string => {
  for (let i = RainfallColorScale.length - 1; i >= 0; i--) {
    if (value >= RainfallColorScale[i].threshold) {
      return RainfallColorScale[i].color
    }
  }
  return RainfallColorScale[0].color
}

// 辅助函数：获取降雨等级
export const getRainfallLevel = (value: number): string => {
  for (let i = RainfallColorScale.length - 1; i >= 0; i--) {
    if (value >= RainfallColorScale[i].threshold) {
      return RainfallColorScale[i].label
    }
  }
  return RainfallColorScale[0].label
}
