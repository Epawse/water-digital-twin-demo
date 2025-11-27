// 乌鲁木齐市模拟建筑数据
// 用于工程演示页面的三维建筑可视化

// 乌鲁木齐市中心坐标
export const UrumqiCenter = {
  lng: 87.617,
  lat: 43.792,
  height: 800 // 海拔高度
}

// 建筑类型
export type BuildingType =
  | 'residential'    // 住宅楼
  | 'commercial'     // 商业建筑
  | 'office'         // 办公楼
  | 'industrial'     // 工业建筑
  | 'infrastructure' // 基础设施
  | 'landmark'       // 地标建筑

// 建筑数据接口
export interface Building {
  id: string
  name: string
  type: BuildingType
  lng: number
  lat: number
  height: number      // 建筑高度 (m)
  width: number       // 宽度 (m)
  depth: number       // 进深 (m)
  floors: number      // 层数
  rotation?: number   // 旋转角度 (度)
  color?: string      // 颜色
  description?: string
}

// 区域配置
export interface DistrictConfig {
  id: string
  name: string
  center: { lng: number; lat: number }
  radius: number // km
  buildingDensity: number // 0-1
  avgHeight: number
  description: string
}

// 乌鲁木齐主要区域
export const UrumqiDistricts: DistrictConfig[] = [
  {
    id: 'tianshan',
    name: '天山区',
    center: { lng: 87.631, lat: 43.794 },
    radius: 3,
    buildingDensity: 0.8,
    avgHeight: 60,
    description: '乌鲁木齐市中心商业区'
  },
  {
    id: 'saybag',
    name: '沙依巴克区',
    center: { lng: 87.598, lat: 43.801 },
    radius: 2.5,
    buildingDensity: 0.7,
    avgHeight: 45,
    description: '红山公园所在区域'
  },
  {
    id: 'xinshi',
    name: '新市区',
    center: { lng: 87.569, lat: 43.856 },
    radius: 3,
    buildingDensity: 0.6,
    avgHeight: 50,
    description: '高新技术开发区'
  },
  {
    id: 'shuimogou',
    name: '水磨沟区',
    center: { lng: 87.642, lat: 43.832 },
    radius: 2,
    buildingDensity: 0.5,
    avgHeight: 35,
    description: '温泉度假区'
  }
]

// 预定义的建筑颜色方案
export const BuildingColors: Record<BuildingType, string> = {
  residential: 'rgba(100, 149, 237, 0.85)',    // 蓝色
  commercial: 'rgba(255, 165, 0, 0.85)',       // 橙色
  office: 'rgba(70, 130, 180, 0.85)',          // 钢蓝色
  industrial: 'rgba(128, 128, 128, 0.85)',     // 灰色
  infrastructure: 'rgba(46, 139, 87, 0.85)',   // 绿色
  landmark: 'rgba(220, 20, 60, 0.85)'          // 红色
}

// 生成随机建筑数据
const generateBuildings = (): Building[] => {
  const buildings: Building[] = []
  let id = 1

  // 地标建筑 - 固定位置
  const landmarks: Building[] = [
    {
      id: 'landmark_001',
      name: '新疆国际大巴扎',
      type: 'landmark',
      lng: 87.6167,
      lat: 43.7892,
      height: 80,
      width: 120,
      depth: 100,
      floors: 6,
      rotation: 15,
      color: 'rgba(139, 69, 19, 0.9)',
      description: '乌鲁木齐标志性建筑'
    },
    {
      id: 'landmark_002',
      name: '红山公园塔',
      type: 'landmark',
      lng: 87.6012,
      lat: 43.7956,
      height: 45,
      width: 20,
      depth: 20,
      floors: 9,
      color: 'rgba(178, 34, 34, 0.9)',
      description: '红山宝塔'
    },
    {
      id: 'landmark_003',
      name: '新疆国际会展中心',
      type: 'landmark',
      lng: 87.5678,
      lat: 43.8523,
      height: 55,
      width: 200,
      depth: 150,
      floors: 4,
      color: 'rgba(65, 105, 225, 0.9)',
      description: '大型会展中心'
    },
    {
      id: 'landmark_004',
      name: '乌鲁木齐中心',
      type: 'office',
      lng: 87.6234,
      lat: 43.7978,
      height: 120,
      width: 50,
      depth: 50,
      floors: 30,
      color: 'rgba(30, 144, 255, 0.9)',
      description: '市中心高层写字楼'
    },
    {
      id: 'landmark_005',
      name: '天山大厦',
      type: 'office',
      lng: 87.6312,
      lat: 43.7912,
      height: 95,
      width: 45,
      depth: 45,
      floors: 24,
      color: 'rgba(70, 130, 180, 0.9)',
      description: '天山区标志性办公楼'
    }
  ]
  buildings.push(...landmarks)

  // 生成各区域的随机建筑
  UrumqiDistricts.forEach(district => {
    const buildingCount = Math.floor(40 * district.buildingDensity)

    for (let i = 0; i < buildingCount; i++) {
      // 在区域内随机分布
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * district.radius * 0.008 // 转换为经纬度偏移

      const lng = district.center.lng + distance * Math.cos(angle)
      const lat = district.center.lat + distance * Math.sin(angle) * 0.7 // 纬度方向缩放

      // 随机建筑类型
      const types: BuildingType[] = ['residential', 'commercial', 'office', 'residential', 'residential']
      const type = types[Math.floor(Math.random() * types.length)]

      // 根据类型和区域生成建筑尺寸
      let height: number, width: number, depth: number, floors: number

      switch (type) {
        case 'residential':
          floors = 6 + Math.floor(Math.random() * 20)
          height = floors * 3
          width = 15 + Math.random() * 25
          depth = 12 + Math.random() * 20
          break
        case 'commercial':
          floors = 2 + Math.floor(Math.random() * 6)
          height = floors * 4.5
          width = 30 + Math.random() * 50
          depth = 25 + Math.random() * 40
          break
        case 'office':
          floors = 10 + Math.floor(Math.random() * 25)
          height = floors * 3.5
          width = 25 + Math.random() * 35
          depth = 20 + Math.random() * 30
          break
        default:
          floors = 5
          height = 15
          width = 20
          depth = 20
      }

      // 区域调整
      height *= (0.7 + district.avgHeight / 100)

      buildings.push({
        id: `building_${id++}`,
        name: `${district.name}${type === 'residential' ? '住宅' : type === 'commercial' ? '商业' : '办公'}${i + 1}号`,
        type,
        lng,
        lat,
        height: Math.round(height),
        width: Math.round(width),
        depth: Math.round(depth),
        floors,
        rotation: Math.random() * 360,
        color: BuildingColors[type],
        description: `${district.name}区域建筑`
      })
    }
  })

  // 添加水利设施建筑
  const waterFacilities: Building[] = [
    {
      id: 'water_001',
      name: '乌拉泊水库管理站',
      type: 'infrastructure',
      lng: 87.4523,
      lat: 43.6234,
      height: 12,
      width: 30,
      depth: 20,
      floors: 3,
      color: 'rgba(46, 139, 87, 0.9)',
      description: '水库管理设施'
    },
    {
      id: 'water_002',
      name: '红雁池水库泵站',
      type: 'infrastructure',
      lng: 87.5012,
      lat: 43.7012,
      height: 8,
      width: 25,
      depth: 15,
      floors: 2,
      color: 'rgba(46, 139, 87, 0.9)',
      description: '供水泵站'
    },
    {
      id: 'water_003',
      name: '水磨河闸站',
      type: 'infrastructure',
      lng: 87.6523,
      lat: 43.8234,
      height: 6,
      width: 20,
      depth: 12,
      floors: 2,
      color: 'rgba(46, 139, 87, 0.9)',
      description: '河道闸门控制站'
    },
    {
      id: 'water_004',
      name: '乌鲁木齐河防洪堤监测站',
      type: 'infrastructure',
      lng: 87.6089,
      lat: 43.8456,
      height: 10,
      width: 15,
      depth: 10,
      floors: 2,
      color: 'rgba(46, 139, 87, 0.9)',
      description: '防洪监测设施'
    }
  ]
  buildings.push(...waterFacilities)

  return buildings
}

// 导出建筑数据
export const UrumqiBuildings: Building[] = generateBuildings()

// 按类型分组
export const ResidentialBuildings = UrumqiBuildings.filter(b => b.type === 'residential')
export const CommercialBuildings = UrumqiBuildings.filter(b => b.type === 'commercial')
export const OfficeBuildings = UrumqiBuildings.filter(b => b.type === 'office')
export const LandmarkBuildings = UrumqiBuildings.filter(b => b.type === 'landmark')
export const InfrastructureBuildings = UrumqiBuildings.filter(b => b.type === 'infrastructure')

// 获取建筑统计信息
export const getBuildingStats = () => ({
  total: UrumqiBuildings.length,
  residential: ResidentialBuildings.length,
  commercial: CommercialBuildings.length,
  office: OfficeBuildings.length,
  landmark: LandmarkBuildings.length,
  infrastructure: InfrastructureBuildings.length,
  avgHeight: Math.round(UrumqiBuildings.reduce((sum, b) => sum + b.height, 0) / UrumqiBuildings.length),
  maxHeight: Math.max(...UrumqiBuildings.map(b => b.height))
})

// 辅助函数：解析颜色字符串为Cesium颜色参数
export const parseColor = (colorStr: string): { r: number; g: number; b: number; a: number } => {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      r: parseInt(match[1]) / 255,
      g: parseInt(match[2]) / 255,
      b: parseInt(match[3]) / 255,
      a: parseFloat(match[4] || '1')
    }
  }
  return { r: 0.5, g: 0.5, b: 0.5, a: 0.8 }
}
