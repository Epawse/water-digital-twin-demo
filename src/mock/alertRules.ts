// 预警规则配置 - 新疆水利数字孪生系统
// 包含：预警类型、阈值规则、响应等级、通知配置

export type AlertLevel = 'blue' | 'yellow' | 'orange' | 'red'
export type AlertCategory = 'flood' | 'rainfall' | 'waterLevel' | 'dam' | 'drought' | 'waterQuality' | 'ice'
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'expired'
export type NotifyChannel = 'sms' | 'email' | 'wechat' | 'app' | 'voice' | 'broadcast'

export interface AlertRule {
  id: string
  name: string
  category: AlertCategory
  targetType: 'station' | 'reservoir' | 'dam' | 'basin' | 'region'
  targetIds?: string[] // 适用的目标ID列表，空表示适用所有
  metric: string
  conditions: AlertCondition[]
  enabled: boolean
  priority: number
  cooldownMinutes: number // 冷却时间(分钟)，防止重复告警
  description?: string
}

export interface AlertCondition {
  level: AlertLevel
  operator: '>' | '>=' | '<' | '<=' | '==' | 'between' | 'rate-of-change'
  value: number
  value2?: number // 用于between操作
  duration?: number // 持续时间(分钟)，需持续满足才触发
}

export interface AlertInstance {
  id: string
  ruleId: string
  level: AlertLevel
  category: AlertCategory
  title: string
  content: string
  targetId: string
  targetName: string
  triggerValue: number
  threshold: number
  triggerTime: string
  acknowledgeTime?: string
  resolveTime?: string
  status: AlertStatus
  location?: { lng: number; lat: number }
  responseActions?: string[]
}

export interface NotifyConfig {
  id: string
  ruleId: string
  level: AlertLevel
  channels: NotifyChannel[]
  recipients: {
    type: 'user' | 'role' | 'department'
    id: string
    name: string
  }[]
  template: string
  escalation?: {
    delayMinutes: number
    escalateTo: string[]
  }
}

export interface ResponsePlan {
  id: string
  name: string
  category: AlertCategory
  level: AlertLevel
  description: string
  steps: {
    order: number
    action: string
    responsible: string
    timeLimit: number // 分钟
  }[]
  resources: string[]
}

// 预警规则配置
export const AlertRules: AlertRule[] = [
  // 洪水预警规则
  {
    id: 'rule_flood_001',
    name: '水库入库洪水预警',
    category: 'flood',
    targetType: 'reservoir',
    metric: 'inflow',
    conditions: [
      { level: 'blue', operator: '>=', value: 500 },
      { level: 'yellow', operator: '>=', value: 800 },
      { level: 'orange', operator: '>=', value: 1200 },
      { level: 'red', operator: '>=', value: 1800 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 60,
    description: '根据入库流量触发洪水预警'
  },
  {
    id: 'rule_flood_002',
    name: '河道洪峰预警',
    category: 'flood',
    targetType: 'station',
    targetIds: ['hyd_001', 'hyd_002'],
    metric: 'discharge',
    conditions: [
      { level: 'blue', operator: '>=', value: 1000, duration: 30 },
      { level: 'yellow', operator: '>=', value: 1500, duration: 30 },
      { level: 'orange', operator: '>=', value: 2000, duration: 15 },
      { level: 'red', operator: '>=', value: 2500 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 30,
    description: '河道洪峰流量预警'
  },

  // 水位预警规则
  {
    id: 'rule_level_001',
    name: '水库水位预警',
    category: 'waterLevel',
    targetType: 'reservoir',
    metric: 'waterLevel',
    conditions: [
      { level: 'blue', operator: '>=', value: 0.9 }, // 占汛限水位的比例
      { level: 'yellow', operator: '>=', value: 0.95 },
      { level: 'orange', operator: '>=', value: 1.0 },
      { level: 'red', operator: '>=', value: 1.02 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 30,
    description: '相对汛限水位的预警'
  },
  {
    id: 'rule_level_002',
    name: '河道水位上涨速率预警',
    category: 'waterLevel',
    targetType: 'station',
    metric: 'waterLevel',
    conditions: [
      { level: 'yellow', operator: 'rate-of-change', value: 0.5, duration: 60 }, // 1小时上涨0.5m
      { level: 'orange', operator: 'rate-of-change', value: 1.0, duration: 60 },
      { level: 'red', operator: 'rate-of-change', value: 2.0, duration: 60 }
    ],
    enabled: true,
    priority: 2,
    cooldownMinutes: 60,
    description: '水位快速上涨预警'
  },

  // 降雨预警规则
  {
    id: 'rule_rain_001',
    name: '短历时强降雨预警',
    category: 'rainfall',
    targetType: 'station',
    metric: 'rainfall1h',
    conditions: [
      { level: 'blue', operator: '>=', value: 15 },
      { level: 'yellow', operator: '>=', value: 30 },
      { level: 'orange', operator: '>=', value: 50 },
      { level: 'red', operator: '>=', value: 80 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 60,
    description: '1小时累计降雨量预警'
  },
  {
    id: 'rule_rain_002',
    name: '24小时累计降雨预警',
    category: 'rainfall',
    targetType: 'basin',
    metric: 'rainfall24h',
    conditions: [
      { level: 'blue', operator: '>=', value: 25 },
      { level: 'yellow', operator: '>=', value: 50 },
      { level: 'orange', operator: '>=', value: 100 },
      { level: 'red', operator: '>=', value: 200 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 120,
    description: '流域面平均24小时降雨'
  },

  // 大坝安全预警规则
  {
    id: 'rule_dam_001',
    name: '大坝渗压异常预警',
    category: 'dam',
    targetType: 'dam',
    metric: 'porePressure',
    conditions: [
      { level: 'yellow', operator: '>=', value: 0.8 }, // 占预警值比例
      { level: 'orange', operator: '>=', value: 0.95 },
      { level: 'red', operator: '>=', value: 1.0 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 30,
    description: '渗压监测值超阈值预警'
  },
  {
    id: 'rule_dam_002',
    name: '大坝位移异常预警',
    category: 'dam',
    targetType: 'dam',
    metric: 'displacement',
    conditions: [
      { level: 'yellow', operator: '>=', value: 0.7 },
      { level: 'orange', operator: '>=', value: 0.85 },
      { level: 'red', operator: '>=', value: 1.0 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 60,
    description: '位移监测值超阈值预警'
  },
  {
    id: 'rule_dam_003',
    name: '大坝渗流量异常预警',
    category: 'dam',
    targetType: 'dam',
    metric: 'seepage',
    conditions: [
      { level: 'yellow', operator: '>=', value: 0.6 },
      { level: 'orange', operator: '>=', value: 0.8 },
      { level: 'red', operator: '>=', value: 1.0 }
    ],
    enabled: true,
    priority: 1,
    cooldownMinutes: 30,
    description: '渗流量监测值超阈值预警'
  },

  // 干旱预警规则
  {
    id: 'rule_drought_001',
    name: '农业干旱预警',
    category: 'drought',
    targetType: 'region',
    metric: 'soilMoisture',
    conditions: [
      { level: 'blue', operator: '<=', value: 40, duration: 1440 }, // 持续24小时
      { level: 'yellow', operator: '<=', value: 30, duration: 2880 },
      { level: 'orange', operator: '<=', value: 20, duration: 4320 },
      { level: 'red', operator: '<=', value: 10, duration: 7200 }
    ],
    enabled: true,
    priority: 3,
    cooldownMinutes: 1440,
    description: '土壤墒情监测干旱预警'
  },

  // 凌汛预警规则（新疆北部）
  {
    id: 'rule_ice_001',
    name: '凌汛预警',
    category: 'ice',
    targetType: 'station',
    targetIds: ['hyd_irtysh_001', 'hyd_irtysh_002'],
    metric: 'iceThickness',
    conditions: [
      { level: 'yellow', operator: '>=', value: 30 },
      { level: 'orange', operator: '>=', value: 50 },
      { level: 'red', operator: '>=', value: 70 }
    ],
    enabled: true,
    priority: 2,
    cooldownMinutes: 360,
    description: '冰层厚度凌汛预警'
  },
]

// 预警实例（活动告警）
export const AlertInstances: AlertInstance[] = [
  {
    id: 'alert_001',
    ruleId: 'rule_rain_001',
    level: 'yellow',
    category: 'rainfall',
    title: '伊犁河谷短历时强降雨预警',
    content: '伊犁河谷雨量站过去1小时累计降雨32mm，达到黄色预警阈值，请关注水情变化。',
    targetId: 'rain_002',
    targetName: '伊犁河谷雨量站',
    triggerValue: 32,
    threshold: 30,
    triggerTime: '2025-09-01T06:30:00Z',
    status: 'active',
    location: { lng: 81.85, lat: 43.45 },
    responseActions: ['通知防汛值班室', '启动水情监测加密', '关注下游水位变化']
  },
  {
    id: 'alert_002',
    ruleId: 'rule_level_001',
    level: 'blue',
    category: 'waterLevel',
    title: '大西海子水库水位预警',
    content: '大西海子水库水位846.8m，接近汛限水位848m，占比99.6%。',
    targetId: 'res_002',
    targetName: '大西海子水库',
    triggerValue: 846.8,
    threshold: 848,
    triggerTime: '2025-09-01T02:00:00Z',
    acknowledgeTime: '2025-09-01T02:15:00Z',
    status: 'acknowledged',
    location: { lng: 86.5, lat: 41.15 },
    responseActions: ['加强水库调度', '关注入库流量']
  },
  {
    id: 'alert_003',
    ruleId: 'rule_dam_003',
    level: 'yellow',
    category: 'dam',
    title: '大西海子水库大坝渗流量异常',
    content: '大西海子水库大坝渗流量监测值4.2L/s，超过正常范围上限，建议检查。',
    targetId: 'dam_dxhz',
    targetName: '大西海子水库大坝',
    triggerValue: 4.2,
    threshold: 5.0,
    triggerTime: '2025-08-31T18:00:00Z',
    status: 'active',
    location: { lng: 86.5, lat: 41.15 },
    responseActions: ['安排现场巡查', '检查排水设施', '准备加密监测']
  },
]

// 通知配置
export const NotifyConfigs: NotifyConfig[] = [
  {
    id: 'notify_001',
    ruleId: 'rule_flood_001',
    level: 'red',
    channels: ['sms', 'voice', 'wechat'],
    recipients: [
      { type: 'role', id: 'role_flood_director', name: '防汛指挥长' },
      { type: 'role', id: 'role_reservoir_manager', name: '水库管理员' },
      { type: 'department', id: 'dept_emergency', name: '应急管理部门' }
    ],
    template: '【紧急】${targetName}发生${level}洪水预警，入库流量${triggerValue}m³/s，请立即启动应急响应！',
    escalation: {
      delayMinutes: 15,
      escalateTo: ['role_water_bureau_director', 'role_city_leader']
    }
  },
  {
    id: 'notify_002',
    ruleId: 'rule_flood_001',
    level: 'orange',
    channels: ['sms', 'wechat', 'app'],
    recipients: [
      { type: 'role', id: 'role_duty_officer', name: '防汛值班员' },
      { type: 'role', id: 'role_reservoir_manager', name: '水库管理员' }
    ],
    template: '【预警】${targetName}${level}洪水预警，入库流量${triggerValue}m³/s，请加强监测。'
  },
  {
    id: 'notify_003',
    ruleId: 'rule_dam_001',
    level: 'red',
    channels: ['sms', 'voice', 'wechat'],
    recipients: [
      { type: 'role', id: 'role_dam_safety_officer', name: '大坝安全责任人' },
      { type: 'role', id: 'role_flood_director', name: '防汛指挥长' }
    ],
    template: '【紧急】${targetName}渗压异常，监测值${triggerValue}kPa，超过危险阈值，请立即现场核查！',
    escalation: {
      delayMinutes: 10,
      escalateTo: ['role_water_bureau_director']
    }
  },
]

// 应急响应预案
export const ResponsePlans: ResponsePlan[] = [
  {
    id: 'plan_flood_red',
    name: '红色洪水应急响应预案',
    category: 'flood',
    level: 'red',
    description: '特大洪水应急响应，启动最高级别防汛指挥',
    steps: [
      { order: 1, action: '启动防汛指挥部，召集成员到位', responsible: '防汛办', timeLimit: 30 },
      { order: 2, action: '发布红色预警信息', responsible: '预警中心', timeLimit: 15 },
      { order: 3, action: '启动水库联合调度', responsible: '调度中心', timeLimit: 30 },
      { order: 4, action: '组织下游群众转移', responsible: '应急管理局', timeLimit: 120 },
      { order: 5, action: '部署抢险队伍待命', responsible: '武装部', timeLimit: 60 },
      { order: 6, action: '启动交通管制', responsible: '交警', timeLimit: 45 },
    ],
    resources: ['冲锋舟50艘', '沙袋10万只', '抢险队伍500人', '挖掘机20台', '运输车辆50辆']
  },
  {
    id: 'plan_dam_red',
    name: '大坝安全红色预警响应预案',
    category: 'dam',
    level: 'red',
    description: '大坝安全紧急响应，防止溃坝风险',
    steps: [
      { order: 1, action: '启动大坝安全应急指挥', responsible: '水库管理单位', timeLimit: 15 },
      { order: 2, action: '现场专业技术人员核查', responsible: '技术组', timeLimit: 30 },
      { order: 3, action: '启动应急泄洪降低库水位', responsible: '调度中心', timeLimit: 30 },
      { order: 4, action: '组织下游危险区群众转移', responsible: '当地政府', timeLimit: 60 },
      { order: 5, action: '准备抢险物资和队伍', responsible: '抢险组', timeLimit: 45 },
    ],
    resources: ['土工布2000m²', '块石500m³', '钢筋笼50个', '技术专家组', '抢险队伍200人']
  },
]

// 预警级别描述
export const AlertLevelInfo: Record<AlertLevel, { name: string; color: string; bgColor: string; description: string }> = {
  blue: { name: '蓝色预警', color: '#1890ff', bgColor: 'rgba(24,144,255,0.1)', description: 'IV级，一般' },
  yellow: { name: '黄色预警', color: '#faad14', bgColor: 'rgba(250,173,20,0.1)', description: 'III级，较重' },
  orange: { name: '橙色预警', color: '#fa8c16', bgColor: 'rgba(250,140,22,0.1)', description: 'II级，严重' },
  red: { name: '红色预警', color: '#f5222d', bgColor: 'rgba(245,34,45,0.1)', description: 'I级，特别严重' }
}

// 辅助函数
export const getRuleById = (id: string): AlertRule | undefined => AlertRules.find(r => r.id === id)
export const getActiveAlerts = (): AlertInstance[] => AlertInstances.filter(a => a.status === 'active')
export const getAlertsByLevel = (level: AlertLevel): AlertInstance[] => AlertInstances.filter(a => a.level === level)
export const getAlertsByCategory = (category: AlertCategory): AlertInstance[] => AlertInstances.filter(a => a.category === category)
