<template>
  <div class="ai-panel" :class="{ collapsed: isCollapsed }">
    <div class="header" @click="toggleCollapse">
      <div class="left">
        <div class="status-dot" :class="{ thinking: isThinking }"></div>
        <span class="title">智能助手</span>
      </div>
      <div class="toggle-icon">{{ isCollapsed ? '+' : '−' }}</div>
    </div>

    <div class="body" v-show="!isCollapsed" ref="chatBodyRef">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <button
          v-for="action in quickActions"
          :key="action.id"
          class="action-btn"
          @click="executeQuickAction(action)"
        >
          <span class="icon">{{ action.icon }}</span>
          <span class="label">{{ action.label }}</span>
        </button>
      </div>

      <div class="messages-container">
        <div v-for="(msg, idx) in messages" :key="idx" class="msg-row" :class="msg.role">
          <div class="avatar" v-if="msg.role === 'ai'">🤖</div>
          <div class="bubble">
            <div class="msg-text" v-html="formatMessage(msg.text)"></div>
            <!-- Data Card -->
            <div class="data-card" v-if="msg.data">
              <div class="card-header">
                <span class="card-icon">{{ msg.data.icon }}</span>
                <span class="card-title">{{ msg.data.title }}</span>
              </div>
              <div class="card-items">
                <div v-for="(item, i) in msg.data.items" :key="i" class="card-item">
                  <span class="item-label">{{ item.label }}</span>
                  <span class="item-value" :class="item.status">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="avatar user" v-if="msg.role === 'user'">👤</div>
        </div>
        <!-- Typing Indicator -->
        <div class="msg-row ai" v-if="isThinking">
          <div class="avatar">🤖</div>
          <div class="bubble typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer" v-show="!isCollapsed">
      <input
        v-model="inputText"
        @keyup.enter="sendMessage"
        placeholder="输入查询 (水位/流量/告警/模型...)"
        :disabled="isThinking"
      />
      <button @click="sendMessage" :disabled="isThinking">
        {{ isThinking ? '...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick } from 'vue'
import { SimStations, FloodEvents, IoTDevices } from '../mock/simData'
import { HydroModels, ModelScenarios, FloodPeaks } from '../mock/modelResults'
import { WeatherForecasts, RadarStations } from '../mock/radarData'

interface DataCard {
  icon: string
  title: string
  items: { label: string; value: string; status?: string }[]
}

interface Message {
  role: 'user' | 'ai'
  text: string
  data?: DataCard
}

interface QuickAction {
  id: string
  icon: string
  label: string
  query: string
}

export default defineComponent({
  name: 'AIChat',
  setup() {
    const isCollapsed = ref(false)
    const isThinking = ref(false)
    const inputText = ref('')
    const chatBodyRef = ref<HTMLElement | null>(null)
    const messages = ref<Message[]>([
      { role: 'ai', text: 'System initialized. DeepSeek-R1 engine ready.\n\n可查询: 水位、流量、告警、模型、天气、站点统计等' }
    ])

    const quickActions: QuickAction[] = [
      { id: 'water_level', icon: '💧', label: '水位', query: '查询当前水位' },
      { id: 'alert', icon: '⚠️', label: '告警', query: '显示当前告警' },
      { id: 'model', icon: '📊', label: '模型', query: '模型运行状态' },
      { id: 'weather', icon: '🌦️', label: '天气', query: '天气预报' },
    ]

    const toggleCollapse = () => isCollapsed.value = !isCollapsed.value

    const scrollToBottom = () => {
      nextTick(() => {
        if (chatBodyRef.value) {
          const container = chatBodyRef.value.querySelector('.messages-container')
          if (container) container.scrollTop = container.scrollHeight
        }
      })
    }

    const formatMessage = (text: string): string => {
      return text.replace(/\n/g, '<br>')
    }

    // 解析查询意图
    const parseIntent = (query: string): { intent: string; params: any } => {
      const q = query.toLowerCase()

      if (q.includes('水位') || q.includes('水库') || q.includes('库容')) {
        return { intent: 'water_level', params: {} }
      }
      if (q.includes('流量') || q.includes('洪峰')) {
        return { intent: 'flow', params: {} }
      }
      if (q.includes('告警') || q.includes('预警') || q.includes('警报')) {
        return { intent: 'alert', params: {} }
      }
      if (q.includes('模型') || q.includes('计算') || q.includes('方案')) {
        return { intent: 'model', params: {} }
      }
      if (q.includes('天气') || q.includes('降雨') || q.includes('预报')) {
        return { intent: 'weather', params: {} }
      }
      if (q.includes('设备') || q.includes('iot') || q.includes('传感器')) {
        return { intent: 'device', params: {} }
      }
      if (q.includes('站点') || q.includes('统计') || q.includes('概览')) {
        return { intent: 'overview', params: {} }
      }
      if (q.includes('雷达') || q.includes('回波')) {
        return { intent: 'radar', params: {} }
      }

      return { intent: 'unknown', params: {} }
    }

    // 生成响应
    const generateResponse = (intent: string): Message => {
      switch (intent) {
        case 'water_level': {
          const reservoirs = SimStations.filter(s => s.type === 'reservoir')
          const normalCount = reservoirs.filter(s => s.status === 'normal').length
          const warningCount = reservoirs.filter(s => s.status === 'warning').length

          return {
            role: 'ai',
            text: `检索到 ${reservoirs.length} 座水库站点数据：`,
            data: {
              icon: '💧',
              title: '水库水位监测',
              items: [
                { label: '监测站点', value: `${reservoirs.length} 个` },
                { label: '正常状态', value: `${normalCount} 个`, status: 'success' },
                { label: '预警状态', value: `${warningCount} 个`, status: warningCount > 0 ? 'warning' : 'success' },
                { label: '平均水位', value: `${(reservoirs.reduce((sum, s) => sum + (s.waterLevel || 0), 0) / reservoirs.length).toFixed(1)} m` },
              ]
            }
          }
        }

        case 'flow': {
          const peaks = FloodPeaks.slice(0, 3)
          return {
            role: 'ai',
            text: `最近洪峰传播数据 (${peaks.length}条记录)：`,
            data: {
              icon: '🌊',
              title: '洪峰流量监测',
              items: peaks.map(p => ({
                label: p.stationName,
                value: `${p.peakDischarge.toLocaleString()} m³/s`,
                status: p.peakDischarge > 2000 ? 'danger' : p.peakDischarge > 1000 ? 'warning' : 'success'
              }))
            }
          }
        }

        case 'alert': {
          const activeEvents = FloodEvents.filter(e => e.status === 'active' || e.level === 'red' || e.level === 'orange')
          return {
            role: 'ai',
            text: activeEvents.length > 0
              ? `当前有 ${activeEvents.length} 个活动预警事件：`
              : '当前无活动预警。系统运行正常。',
            data: activeEvents.length > 0 ? {
              icon: '⚠️',
              title: '预警事件',
              items: activeEvents.slice(0, 4).map(e => ({
                label: e.name,
                value: e.level.toUpperCase(),
                status: e.level === 'red' ? 'danger' : e.level === 'orange' ? 'warning' : 'info'
              }))
            } : undefined
          }
        }

        case 'model': {
          const runningScenarios = ModelScenarios.filter(s => s.status === 'running')
          const completedScenarios = ModelScenarios.filter(s => s.status === 'completed')

          return {
            role: 'ai',
            text: `水文模型系统状态：`,
            data: {
              icon: '📊',
              title: '模型运行状态',
              items: [
                { label: '可用模型', value: `${HydroModels.length} 个` },
                { label: '计算方案', value: `${ModelScenarios.length} 个` },
                { label: '运行中', value: `${runningScenarios.length} 个`, status: runningScenarios.length > 0 ? 'info' : 'success' },
                { label: '已完成', value: `${completedScenarios.length} 个`, status: 'success' },
              ]
            }
          }
        }

        case 'weather': {
          const forecasts = WeatherForecasts.slice(0, 4)
          const warnings = forecasts.filter(f => f.warningLevel)

          return {
            role: 'ai',
            text: `天气预报概要 (${forecasts.length}个区域)：`,
            data: {
              icon: '🌦️',
              title: '气象预报',
              items: forecasts.map(f => ({
                label: f.region.replace('哈萨克自治州', '').replace('蒙古自治州', ''),
                value: `${f.weather} ${f.precipitation}mm`,
                status: f.warningLevel === 'red' ? 'danger' : f.warningLevel === 'orange' || f.warningLevel === 'yellow' ? 'warning' : 'success'
              }))
            }
          }
        }

        case 'device': {
          const onlineDevices = IoTDevices.filter(d => d.status === 'online')
          const offlineDevices = IoTDevices.filter(d => d.status === 'offline')

          return {
            role: 'ai',
            text: `IoT设备监控统计：`,
            data: {
              icon: '📡',
              title: 'IoT设备状态',
              items: [
                { label: '设备总数', value: `${IoTDevices.length} 台` },
                { label: '在线设备', value: `${onlineDevices.length} 台`, status: 'success' },
                { label: '离线设备', value: `${offlineDevices.length} 台`, status: offlineDevices.length > 0 ? 'warning' : 'success' },
                { label: '在线率', value: `${((onlineDevices.length / IoTDevices.length) * 100).toFixed(1)}%` },
              ]
            }
          }
        }

        case 'overview': {
          const hydroStations = SimStations.filter(s => s.type === 'hydrological')
          const rainStations = SimStations.filter(s => s.type === 'rain')
          const reservoirs = SimStations.filter(s => s.type === 'reservoir')

          return {
            role: 'ai',
            text: `系统监测站点概览：`,
            data: {
              icon: '📍',
              title: '站点统计',
              items: [
                { label: '水库站', value: `${reservoirs.length} 个` },
                { label: '水文站', value: `${hydroStations.length} 个` },
                { label: '雨量站', value: `${rainStations.length} 个` },
                { label: '站点总数', value: `${SimStations.length} 个` },
              ]
            }
          }
        }

        case 'radar': {
          const onlineRadars = RadarStations.filter(r => r.status === 'online')

          return {
            role: 'ai',
            text: `气象雷达网络状态：`,
            data: {
              icon: '📡',
              title: '雷达站点',
              items: [
                { label: '雷达总数', value: `${RadarStations.length} 座` },
                { label: '在线运行', value: `${onlineRadars.length} 座`, status: 'success' },
                { label: '维护中', value: `${RadarStations.length - onlineRadars.length} 座`, status: 'warning' },
                { label: '覆盖范围', value: '全域覆盖' },
              ]
            }
          }
        }

        default:
          return {
            role: 'ai',
            text: `收到指令。请尝试以下查询：\n\n• 查询水位/水库状态\n• 显示流量/洪峰数据\n• 查看告警/预警信息\n• 模型运行状态\n• 天气预报\n• 设备状态\n• 站点统计`
          }
      }
    }

    const sendMessage = () => {
      if (!inputText.value.trim() || isThinking.value) return

      const query = inputText.value
      messages.value.push({ role: 'user', text: query })
      inputText.value = ''
      isThinking.value = true
      scrollToBottom()

      // Simulate AI thinking
      setTimeout(() => {
        const { intent } = parseIntent(query)
        const response = generateResponse(intent)
        messages.value.push(response)
        isThinking.value = false
        scrollToBottom()
      }, 800 + Math.random() * 500)
    }

    const executeQuickAction = (action: QuickAction) => {
      inputText.value = action.query
      sendMessage()
    }

    return {
      isCollapsed,
      isThinking,
      inputText,
      messages,
      quickActions,
      chatBodyRef,
      toggleCollapse,
      sendMessage,
      executeQuickAction,
      formatMessage
    }
  }
})
</script>

<style lang="scss" scoped>
.ai-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 340px;
  background: var(--bg-panel);
  backdrop-filter: blur(15px);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: height 0.3s ease;
  z-index: 200;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  pointer-events: auto;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 10px; height: 10px;
    border-top: 2px solid var(--primary-color);
    border-left: 2px solid var(--primary-color);
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: 0; right: 0; width: 10px; height: 10px;
    border-bottom: 2px solid var(--primary-color);
    border-right: 2px solid var(--primary-color);
    pointer-events: none;
  }

  &.collapsed {
    height: 40px !important;
  }

  .header {
    height: 40px;
    background: rgba(0, 246, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 15px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-light);

    .left {
      display: flex;
      align-items: center;
      gap: 8px;

      .status-dot {
        width: 6px; height: 6px;
        background: #00ff9d;
        border-radius: 50%;
        box-shadow: 0 0 5px #00ff9d;
        transition: all 0.3s;

        &.thinking {
          background: #ffbd2e;
          box-shadow: 0 0 8px #ffbd2e;
          animation: pulse 1s infinite;
        }
      }

      .title {
        font-size: 12px;
        font-weight: bold;
        color: var(--primary-color);
        letter-spacing: 1px;
      }
    }

    .toggle-icon {
      color: var(--primary-color);
      font-weight: bold;
    }
  }

  .body {
    height: 320px;
    background: rgba(0, 0, 0, 0.3);
    position: relative;
    display: flex;
    flex-direction: column;

    .quick-actions {
      display: flex;
      gap: 6px;
      padding: 10px;
      border-bottom: 1px solid var(--border-light);
      background: rgba(0, 0, 0, 0.2);

      .action-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 6px 4px;
        background: rgba(0, 246, 255, 0.05);
        border: 1px solid var(--border-light);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(0, 246, 255, 0.15);
          border-color: var(--border-color);
        }

        .icon {
          font-size: 14px;
        }

        .label {
          font-size: 10px;
          color: var(--text-secondary);
        }
      }
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
    }

    .msg-row {
      display: flex;
      gap: 8px;
      font-size: 12px;
      line-height: 1.4;

      .avatar {
        width: 24px; height: 24px;
        min-width: 24px;
        display: flex; justify-content: center; align-items: center;
        background: rgba(255,255,255,0.1);
        border-radius: 4px;
        font-size: 14px;
      }

      .bubble {
        padding: 8px 12px;
        border-radius: 4px;
        max-width: 85%;

        .msg-text {
          margin-bottom: 0;
        }

        &.typing {
          display: flex;
          gap: 4px;
          padding: 12px 16px;

          .dot {
            width: 6px;
            height: 6px;
            background: var(--primary-color);
            border-radius: 50%;
            animation: typingDot 1.4s infinite ease-in-out;

            &:nth-child(1) { animation-delay: 0s; }
            &:nth-child(2) { animation-delay: 0.2s; }
            &:nth-child(3) { animation-delay: 0.4s; }
          }
        }

        .data-card {
          margin-top: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          overflow: hidden;

          .card-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 10px;
            background: rgba(0, 246, 255, 0.1);
            border-bottom: 1px solid var(--border-light);

            .card-icon {
              font-size: 14px;
            }

            .card-title {
              font-size: 11px;
              font-weight: bold;
              color: var(--primary-color);
            }
          }

          .card-items {
            padding: 8px 10px;

            .card-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 4px 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);

              &:last-child {
                border-bottom: none;
              }

              .item-label {
                font-size: 10px;
                color: var(--text-muted);
              }

              .item-value {
                font-size: 11px;
                font-family: 'Courier New', monospace;
                color: var(--text-main);

                &.success { color: #4caf50; }
                &.warning { color: #ffbd2e; }
                &.danger { color: #f44336; }
                &.info { color: #2196f3; }
              }
            }
          }
        }
      }

      &.ai {
        .bubble {
          background: rgba(0, 246, 255, 0.1);
          color: #fff;
          border-left: 2px solid var(--primary-color);
        }
      }

      &.user {
        flex-direction: row-reverse;
        .bubble {
          background: rgba(67, 199, 248, 0.2);
          color: #fff;
          border-right: 2px solid var(--secondary-color);
          border-left: none;
          text-align: right;
        }
      }
    }
  }

  .footer {
    height: 40px;
    display: flex;
    border-top: 1px solid var(--border-light);
    background: rgba(5, 8, 21, 0.9);

    input {
      flex: 1;
      background: transparent;
      border: none;
      color: #fff;
      padding: 0 15px;
      outline: none;
      font-size: 12px;
      font-family: 'Courier New', monospace;

      &::placeholder { color: rgba(255,255,255,0.3); }

      &:disabled {
        opacity: 0.5;
      }
    }

    button {
      background: var(--primary-dim);
      border: none;
      border-left: 1px solid var(--border-light);
      color: var(--primary-color);
      padding: 0 15px;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;

      &:hover:not(:disabled) {
        background: rgba(0, 246, 255, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

@keyframes typingDot {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style>