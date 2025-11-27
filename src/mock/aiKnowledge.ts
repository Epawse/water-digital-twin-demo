// AI智能助手知识库与工具池 - 新疆水利数字孪生系统
// 基于LLM+RAG+ReWOO架构，参考PDF技术方案

export type ToolCategory = 'query' | 'analysis' | 'visualization' | 'control' | 'report' | 'forecast'
export type KnowledgeType = 'regulation' | 'standard' | 'manual' | 'case' | 'faq' | 'glossary'

// AI工具定义（供LLM调用）
export interface AITool {
  id: string
  name: string
  category: ToolCategory
  description: string
  parameters: {
    name: string
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required: boolean
    description: string
    enum?: string[]
  }[]
  returns: string
  examples: {
    query: string
    params: Record<string, any>
    result: string
  }[]
}

// 知识库条目
export interface KnowledgeEntry {
  id: string
  type: KnowledgeType
  title: string
  content: string
  keywords: string[]
  source?: string
  updateTime: string
  relevance: number // 相关性权重
}

// 对话历史
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  toolCalls?: {
    toolId: string
    params: Record<string, any>
    result: any
  }[]
}

// AI工具池
export const AITools: AITool[] = [
  // 查询类工具
  {
    id: 'tool_query_station',
    name: '查询监测站点',
    category: 'query',
    description: '查询指定类型或区域的水文监测站点信息',
    parameters: [
      { name: 'stationType', type: 'string', required: false, description: '站点类型', enum: ['reservoir', 'hydrological', 'rain'] },
      { name: 'region', type: 'string', required: false, description: '区域名称' },
      { name: 'status', type: 'string', required: false, description: '站点状态', enum: ['normal', 'warning', 'danger'] }
    ],
    returns: '站点列表，包含名称、位置、当前数据等',
    examples: [
      { query: '查询所有水库站点', params: { stationType: 'reservoir' }, result: '找到3个水库站点：乌鲁瓦提水库、大西海子水库、克孜尔水库...' },
      { query: '伊犁地区有哪些雨量站', params: { stationType: 'rain', region: '伊犁' }, result: '伊犁河谷雨量站，当前降雨量25mm...' }
    ]
  },
  {
    id: 'tool_query_realtime',
    name: '查询实时监测数据',
    category: 'query',
    description: '获取指定站点的实时监测数据',
    parameters: [
      { name: 'stationId', type: 'string', required: true, description: '站点ID' },
      { name: 'metrics', type: 'array', required: false, description: '指标列表' }
    ],
    returns: '实时数据，包含水位、流量、降雨等指标',
    examples: [
      { query: '乌鲁瓦提水库现在水位多少', params: { stationId: 'res_001' }, result: '乌鲁瓦提水库当前水位1962.5m，距汛限水位2.5m，入库流量125m³/s' }
    ]
  },
  {
    id: 'tool_query_history',
    name: '查询历史数据',
    category: 'query',
    description: '查询指定站点的历史监测数据',
    parameters: [
      { name: 'stationId', type: 'string', required: true, description: '站点ID' },
      { name: 'startTime', type: 'string', required: true, description: '开始时间' },
      { name: 'endTime', type: 'string', required: true, description: '结束时间' },
      { name: 'interval', type: 'string', required: false, description: '时间间隔', enum: ['hourly', 'daily', 'monthly'] }
    ],
    returns: '历史数据时序',
    examples: [
      { query: '查询大西海子水库过去一周的水位变化', params: { stationId: 'res_002', startTime: '2025-08-25', endTime: '2025-09-01', interval: 'daily' }, result: '过去7天水位从845.2m上升至846.8m，上涨1.6m' }
    ]
  },
  {
    id: 'tool_query_alert',
    name: '查询预警信息',
    category: 'query',
    description: '查询当前活动的预警信息',
    parameters: [
      { name: 'level', type: 'string', required: false, description: '预警级别', enum: ['blue', 'yellow', 'orange', 'red'] },
      { name: 'category', type: 'string', required: false, description: '预警类型', enum: ['flood', 'rainfall', 'waterLevel', 'dam'] },
      { name: 'region', type: 'string', required: false, description: '区域' }
    ],
    returns: '预警列表',
    examples: [
      { query: '目前有哪些预警', params: {}, result: '当前有3条活动预警：1条黄色降雨预警(伊犁)、1条蓝色水位预警(大西海子)、1条黄色大坝渗流预警' }
    ]
  },

  // 分析类工具
  {
    id: 'tool_analyze_trend',
    name: '水情趋势分析',
    category: 'analysis',
    description: '分析指定站点的水情变化趋势',
    parameters: [
      { name: 'stationId', type: 'string', required: true, description: '站点ID' },
      { name: 'days', type: 'number', required: false, description: '分析天数' }
    ],
    returns: '趋势分析结果，包含变化率、预测等',
    examples: [
      { query: '分析塔里木河近期水情趋势', params: { stationId: 'hyd_002', days: 7 }, result: '英巴扎站过去7天水位呈上升趋势，日均上涨0.15m，预计48小时内可能达到警戒水位' }
    ]
  },
  {
    id: 'tool_analyze_flood',
    name: '洪水影响分析',
    category: 'analysis',
    description: '分析洪水淹没范围和影响',
    parameters: [
      { name: 'scenarioId', type: 'string', required: true, description: '洪水场景ID' },
      { name: 'timestamp', type: 'string', required: false, description: '时间点' }
    ],
    returns: '淹没分析结果，包含面积、深度、影响区域等',
    examples: [
      { query: '20年一遇洪水会淹没多大范围', params: { scenarioId: 'scenario_tarim_20y' }, result: '塔里木河20年一遇洪水最大淹没面积215.3km²，最大水深4.5m，主要影响沙雅县沿河乡镇' }
    ]
  },
  {
    id: 'tool_analyze_dam',
    name: '大坝安全评估',
    category: 'analysis',
    description: '评估大坝安全状态',
    parameters: [
      { name: 'damId', type: 'string', required: true, description: '大坝ID' }
    ],
    returns: '安全评估报告',
    examples: [
      { query: '乌鲁瓦提水库大坝安全情况如何', params: { damId: 'dam_wlwt' }, result: '乌鲁瓦提水库大坝总体安全，6个监测点数据正常，渗压280kPa(正常范围)，渗流量1.8L/s(正常)，位移2.5mm(正常)' }
    ]
  },
  {
    id: 'tool_analyze_rainfall',
    name: '降雨分析',
    category: 'analysis',
    description: '分析区域降雨情况',
    parameters: [
      { name: 'region', type: 'string', required: true, description: '区域名称' },
      { name: 'period', type: 'string', required: false, description: '时段', enum: ['1h', '3h', '6h', '12h', '24h'] }
    ],
    returns: '降雨分析结果',
    examples: [
      { query: '伊犁地区今天降雨情况', params: { region: '伊犁', period: '24h' }, result: '伊犁河谷过去24小时累计降雨48mm，最大小时雨强32mm/h，属于中到大雨级别' }
    ]
  },

  // 可视化工具
  {
    id: 'tool_viz_flyto',
    name: '视角定位',
    category: 'visualization',
    description: '将地图视角飞行到指定位置',
    parameters: [
      { name: 'target', type: 'string', required: true, description: '目标名称或坐标' },
      { name: 'height', type: 'number', required: false, description: '视角高度(m)' }
    ],
    returns: '定位结果',
    examples: [
      { query: '带我看看乌鲁瓦提水库', params: { target: '乌鲁瓦提水库', height: 2000 }, result: '已定位到乌鲁瓦提水库(79.35°E, 37.25°N)' }
    ]
  },
  {
    id: 'tool_viz_layer',
    name: '图层控制',
    category: 'visualization',
    description: '控制专题图层的显示/隐藏',
    parameters: [
      { name: 'layerName', type: 'string', required: true, description: '图层名称' },
      { name: 'visible', type: 'boolean', required: true, description: '是否显示' }
    ],
    returns: '操作结果',
    examples: [
      { query: '显示洪水淹没范围', params: { layerName: '淹没面', visible: true }, result: '已显示淹没面图层' }
    ]
  },
  {
    id: 'tool_viz_chart',
    name: '生成图表',
    category: 'visualization',
    description: '生成水情数据图表',
    parameters: [
      { name: 'chartType', type: 'string', required: true, description: '图表类型', enum: ['line', 'bar', 'area', 'scatter'] },
      { name: 'stationId', type: 'string', required: true, description: '站点ID' },
      { name: 'metric', type: 'string', required: true, description: '指标' },
      { name: 'period', type: 'string', required: false, description: '时段' }
    ],
    returns: '图表数据',
    examples: [
      { query: '画一个水位过程线', params: { chartType: 'line', stationId: 'res_001', metric: 'waterLevel', period: '7d' }, result: '已生成乌鲁瓦提水库7日水位过程线图' }
    ]
  },

  // 预报工具
  {
    id: 'tool_forecast_flood',
    name: '洪水预报',
    category: 'forecast',
    description: '基于模型进行洪水预报',
    parameters: [
      { name: 'modelId', type: 'string', required: true, description: '模型ID' },
      { name: 'forecastHours', type: 'number', required: false, description: '预报时长(小时)' }
    ],
    returns: '预报结果',
    examples: [
      { query: '未来24小时塔里木河洪水预报', params: { modelId: 'model_tarim', forecastHours: 24 }, result: '塔里木河未来24小时预计洪峰流量1280m³/s，约在12小时后到达阿拉尔站' }
    ]
  },
  {
    id: 'tool_forecast_weather',
    name: '天气预报查询',
    category: 'forecast',
    description: '查询天气预报信息',
    parameters: [
      { name: 'region', type: 'string', required: true, description: '区域名称' },
      { name: 'days', type: 'number', required: false, description: '预报天数' }
    ],
    returns: '天气预报',
    examples: [
      { query: '伊犁明天天气怎么样', params: { region: '伊犁', days: 1 }, result: '伊犁明天中到大雨，气温12-25℃，西风4级，降水概率75%，已发布黄色预警' }
    ]
  },

  // 报告工具
  {
    id: 'tool_report_daily',
    name: '生成日报',
    category: 'report',
    description: '生成水情日报',
    parameters: [
      { name: 'date', type: 'string', required: false, description: '日期' },
      { name: 'region', type: 'string', required: false, description: '区域' }
    ],
    returns: '日报内容',
    examples: [
      { query: '生成今天的水情日报', params: { date: '2025-09-01' }, result: '新疆水情日报(2025-09-01)：全疆8个监测站点运行正常，3个站点预警状态，详细数据如下...' }
    ]
  },
]

// 知识库条目
export const KnowledgeEntries: KnowledgeEntry[] = [
  // 法规标准
  {
    id: 'kb_reg_001',
    type: 'regulation',
    title: '中华人民共和国防洪法',
    content: '为了防治洪水，防御、减轻洪涝灾害，维护人民的生命和财产安全，保障社会主义现代化建设顺利进行，制定本法...',
    keywords: ['防洪', '法律', '洪水防御', '防洪规划'],
    source: '全国人大常委会',
    updateTime: '2016-07-02',
    relevance: 1.0
  },
  {
    id: 'kb_reg_002',
    type: 'regulation',
    title: '水库大坝安全管理条例',
    content: '为了加强水库大坝安全管理，保障人民生命财产安全，根据《中华人民共和国水法》等法律，制定本条例...',
    keywords: ['水库', '大坝', '安全管理', '责任制'],
    source: '国务院',
    updateTime: '2018-03-19',
    relevance: 1.0
  },
  {
    id: 'kb_std_001',
    type: 'standard',
    title: 'SL 651-2014 水文监测数据通信规约',
    content: '本标准规定了水文监测数据传输的通信规约，适用于水文自动测报系统、水资源监控系统等...',
    keywords: ['SL651', '水文监测', '数据通信', '遥测终端'],
    source: '水利行业标准',
    updateTime: '2014-06-01',
    relevance: 0.9
  },
  {
    id: 'kb_std_002',
    type: 'standard',
    title: 'GB/T 50805-2012 城市防洪工程设计规范',
    content: '本规范适用于城市防洪工程的规划、设计，规定了防洪标准、堤防设计、排涝设计等内容...',
    keywords: ['城市防洪', '设计规范', '防洪标准', '排涝'],
    source: '国家标准',
    updateTime: '2012-05-01',
    relevance: 0.85
  },

  // 操作手册
  {
    id: 'kb_manual_001',
    type: 'manual',
    title: '水库调度规程编制指南',
    content: '水库调度规程是水库运行管理的重要依据，应包含：水库特性、调度原则、汛期调度、非汛期调度、应急调度等内容...',
    keywords: ['水库调度', '调度规程', '汛期', '应急调度'],
    updateTime: '2024-01-15',
    relevance: 0.9
  },
  {
    id: 'kb_manual_002',
    type: 'manual',
    title: '大坝安全监测操作规程',
    content: '大坝安全监测应遵循：定期巡查、仪器观测、数据分析、异常处置等流程。渗压监测每日不少于1次，位移监测每周不少于1次...',
    keywords: ['大坝监测', '安全监测', '渗压', '位移'],
    updateTime: '2024-03-20',
    relevance: 0.9
  },

  // 案例库
  {
    id: 'kb_case_001',
    type: 'case',
    title: '2010年新疆特大洪水应急响应案例',
    content: '2010年7月，受强降雨影响，额尔齐斯河、伊犁河等发生特大洪水。启动I级响应，紧急转移群众5.2万人，成功避免重大人员伤亡...',
    keywords: ['洪水案例', '应急响应', '2010年', '额尔齐斯河'],
    updateTime: '2023-08-10',
    relevance: 0.8
  },
  {
    id: 'kb_case_002',
    type: 'case',
    title: '塔里木河生态输水工程案例',
    content: '2000年起实施塔里木河下游生态输水工程，累计输水超过80亿立方米，台特玛湖水面恢复至500平方公里以上...',
    keywords: ['生态输水', '塔里木河', '台特玛湖', '生态恢复'],
    updateTime: '2024-02-28',
    relevance: 0.75
  },

  // 常见问题
  {
    id: 'kb_faq_001',
    type: 'faq',
    title: '什么是汛限水位？',
    content: '汛限水位是指水库在汛期允许兴利蓄水的上限水位，也叫防洪限制水位。超过汛限水位时，水库应加大泄量，将水位降至汛限以下。',
    keywords: ['汛限水位', '防洪', '水库', '水位控制'],
    updateTime: '2024-01-01',
    relevance: 0.9
  },
  {
    id: 'kb_faq_002',
    type: 'faq',
    title: '洪水预警等级如何划分？',
    content: '洪水预警分为四级：蓝色(IV级)一般、黄色(III级)较重、橙色(II级)严重、红色(I级)特别严重。不同级别对应不同的响应措施。',
    keywords: ['预警等级', '蓝黄橙红', '应急响应'],
    updateTime: '2024-01-01',
    relevance: 0.95
  },
  {
    id: 'kb_faq_003',
    type: 'faq',
    title: '新疆主要河流有哪些？',
    content: '新疆主要河流包括：塔里木河(中国最长内陆河)、伊犁河、额尔齐斯河(中国唯一注入北冰洋的河流)、和田河、玛纳斯河、渭干河等。',
    keywords: ['新疆河流', '塔里木河', '伊犁河', '额尔齐斯河'],
    updateTime: '2024-01-01',
    relevance: 0.85
  },

  // 术语表
  {
    id: 'kb_gloss_001',
    type: 'glossary',
    title: '水文水利术语表',
    content: `
      - 洪峰流量：洪水过程中最大流量
      - 洪水波：洪水沿河道向下游传播的波动
      - 退水：洪峰过后水位/流量下降的过程
      - 产流：降雨转化为径流的过程
      - 汇流：降雨径流汇集到河道的过程
      - 糙率：反映河床阻力的系数(曼宁n)
      - 比降：河道水面或河底的坡度
      - 弗劳德数：判断水流急缓的无量纲参数
    `,
    keywords: ['水文术语', '洪峰', '产流', '汇流', '糙率'],
    updateTime: '2024-01-01',
    relevance: 0.8
  },
]

// 示例对话
export const SampleConversations: ChatMessage[] = [
  {
    id: 'msg_001',
    role: 'user',
    content: '目前新疆有哪些预警？',
    timestamp: '2025-09-01T08:00:00Z'
  },
  {
    id: 'msg_002',
    role: 'assistant',
    content: '当前新疆有3条活动预警：\n\n1. **黄色降雨预警**（伊犁河谷）\n   - 过去1小时降雨32mm\n   - 建议关注下游水位变化\n\n2. **蓝色水位预警**（大西海子水库）\n   - 当前水位846.8m，接近汛限\n   - 已通知水库管理人员\n\n3. **黄色大坝渗流预警**（大西海子水库大坝）\n   - 渗流量4.2L/s，超正常范围\n   - 建议安排现场检查',
    timestamp: '2025-09-01T08:00:05Z',
    toolCalls: [
      { toolId: 'tool_query_alert', params: {}, result: { count: 3 } }
    ]
  },
  {
    id: 'msg_003',
    role: 'user',
    content: '带我看看大西海子水库',
    timestamp: '2025-09-01T08:01:00Z'
  },
  {
    id: 'msg_004',
    role: 'assistant',
    content: '已将视角定位到大西海子水库（86.5°E, 41.15°N）。\n\n该水库位于塔里木河下游，当前状态：\n- 水位：846.8m（汛限848m）\n- 入库流量：85m³/s\n- 出库流量：90m³/s\n- 安全状态：需关注',
    timestamp: '2025-09-01T08:01:05Z',
    toolCalls: [
      { toolId: 'tool_viz_flyto', params: { target: '大西海子水库', height: 5000 }, result: { success: true } },
      { toolId: 'tool_query_realtime', params: { stationId: 'res_002' }, result: { waterLevel: 846.8 } }
    ]
  },
]

// AI助手系统提示词
export const SystemPrompt = `你是新疆水利数字孪生系统的智能助手，名叫"水利通"。

你的能力：
1. 查询水情数据：实时监测、历史数据、预警信息
2. 分析水文趋势：水位变化、洪水风险、大坝安全
3. 控制可视化：定位视角、切换图层、生成图表
4. 预报预测：洪水预报、天气查询
5. 知识问答：水利法规、技术标准、操作规程

回答原则：
- 使用专业但易懂的语言
- 数据要准确，必要时标注单位
- 涉及预警时要说明级别和建议措施
- 可以主动推荐相关功能或信息
- 遇到不确定的情况要如实说明

新疆水利概况：
- 三大流域：塔里木河、伊犁河、额尔齐斯河
- 主要水库：乌鲁瓦提、大西海子、克孜尔等
- 监测站点覆盖全疆主要水系
`

// 辅助函数
export const getToolById = (id: string): AITool | undefined => AITools.find(t => t.id === id)
export const getToolsByCategory = (category: ToolCategory): AITool[] => AITools.filter(t => t.category === category)
export const searchKnowledge = (query: string): KnowledgeEntry[] => {
  const keywords = query.toLowerCase().split(/\s+/)
  return KnowledgeEntries.filter(entry =>
    keywords.some(kw =>
      entry.title.toLowerCase().includes(kw) ||
      entry.keywords.some(k => k.toLowerCase().includes(kw))
    )
  ).sort((a, b) => b.relevance - a.relevance)
}
