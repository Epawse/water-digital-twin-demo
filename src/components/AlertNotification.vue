<template>
  <div class="alert-container">
    <!-- Alert Stack -->
    <TransitionGroup name="alert" tag="div" class="alert-stack">
      <div
        v-for="alert in visibleAlerts"
        :key="alert.id"
        class="alert-item tech-panel"
        :class="alert.level"
      >
        <div class="alert-icon">
          {{ getLevelIcon(alert.level) }}
        </div>
        <div class="alert-content">
          <div class="alert-header">
            <span class="alert-title">{{ alert.title }}</span>
            <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
          </div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-meta" v-if="alert.location || alert.value">
            <span v-if="alert.location" class="meta-item">
              <span class="meta-icon">📍</span>{{ alert.location }}
            </span>
            <span v-if="alert.value" class="meta-item">
              <span class="meta-icon">📊</span>{{ alert.value }}
            </span>
          </div>
        </div>
        <button class="alert-close" @click="dismissAlert(alert.id)">×</button>
        <div class="alert-progress" :style="{ animationDuration: alert.duration + 'ms' }"></div>
      </div>
    </TransitionGroup>

    <!-- Alert History Panel (expandable) -->
    <div class="alert-history-toggle" v-if="alertHistory.length > 0" @click="showHistory = !showHistory">
      <span class="badge">{{ alertHistory.length }}</span>
      <span class="label">历史告警</span>
      <span class="arrow">{{ showHistory ? '▼' : '▲' }}</span>
    </div>

    <Transition name="slide">
      <div class="alert-history tech-panel" v-if="showHistory">
        <div class="history-header">
          <span class="title">告警历史</span>
          <button class="clear-btn" @click="clearHistory">清空</button>
        </div>
        <div class="history-list">
          <div
            v-for="alert in alertHistory"
            :key="alert.id"
            class="history-item"
            :class="alert.level"
          >
            <span class="history-icon">{{ getLevelIcon(alert.level) }}</span>
            <div class="history-content">
              <span class="history-title">{{ alert.title }}</span>
              <span class="history-time">{{ formatTime(alert.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { FloodEvents } from '../mock/simData'

export type AlertLevel = 'red' | 'orange' | 'yellow' | 'blue' | 'info'

export interface AlertItem {
  id: string
  level: AlertLevel
  title: string
  message: string
  timestamp: Date
  duration: number
  location?: string
  value?: string
  eventId?: string
}

export default defineComponent({
  name: 'AlertNotification',
  props: {
    maxVisible: {
      type: Number,
      default: 3
    },
    defaultDuration: {
      type: Number,
      default: 8000
    }
  },
  emits: ['alertClick', 'dismiss'],
  setup(props, { emit, expose }) {
    const alerts = ref<AlertItem[]>([])
    const alertHistory = ref<AlertItem[]>([])
    const showHistory = ref(false)

    let alertIdCounter = 0
    let dismissTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

    const visibleAlerts = computed(() => {
      return alerts.value.slice(0, props.maxVisible)
    })

    const getLevelIcon = (level: AlertLevel): string => {
      const icons: Record<AlertLevel, string> = {
        red: '🚨',
        orange: '⚠️',
        yellow: '⚡',
        blue: '📢',
        info: 'ℹ️'
      }
      return icons[level] || '📢'
    }

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const addAlert = (alertData: Partial<AlertItem> & { title: string; message: string }) => {
      const id = `alert_${++alertIdCounter}_${Date.now()}`
      const alert: AlertItem = {
        id,
        level: alertData.level || 'info',
        title: alertData.title,
        message: alertData.message,
        timestamp: alertData.timestamp || new Date(),
        duration: alertData.duration || props.defaultDuration,
        location: alertData.location,
        value: alertData.value,
        eventId: alertData.eventId
      }

      alerts.value.unshift(alert)

      // Auto dismiss
      const timer = setTimeout(() => {
        dismissAlert(id)
      }, alert.duration)
      dismissTimers.set(id, timer)

      return id
    }

    const dismissAlert = (id: string) => {
      const index = alerts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        const [dismissed] = alerts.value.splice(index, 1)
        alertHistory.value.unshift(dismissed)

        // Keep history limited
        if (alertHistory.value.length > 50) {
          alertHistory.value = alertHistory.value.slice(0, 50)
        }

        emit('dismiss', dismissed)
      }

      // Clear timer
      const timer = dismissTimers.get(id)
      if (timer) {
        clearTimeout(timer)
        dismissTimers.delete(id)
      }
    }

    const clearHistory = () => {
      alertHistory.value = []
      showHistory.value = false
    }

    // Generate mock alerts from FloodEvents
    const generateMockAlerts = () => {
      const activeEvents = FloodEvents.filter(e => e.status === 'active')

      activeEvents.forEach((event, index) => {
        setTimeout(() => {
          addAlert({
            level: event.level as AlertLevel,
            title: `${event.level.toUpperCase()}级预警`,
            message: event.name,
            location: event.basin,
            value: `影响范围: ${event.affectedArea.toFixed(0)} km²`,
            eventId: event.id,
            duration: 10000 + index * 2000
          })
        }, 1000 + index * 3000)
      })
    }

    // Simulate periodic alerts
    let mockInterval: ReturnType<typeof setInterval> | null = null

    const startMockAlerts = () => {
      // Initial alerts
      generateMockAlerts()

      // Periodic random alerts
      mockInterval = setInterval(() => {
        const types = ['水位', '流量', '降雨', '设备']
        const levels: AlertLevel[] = ['blue', 'yellow', 'orange']

        const type = types[Math.floor(Math.random() * types.length)]
        const level = levels[Math.floor(Math.random() * levels.length)]

        const messages: Record<string, string[]> = {
          '水位': ['水位超过警戒值', '水位快速上涨', '水位接近汛限'],
          '流量': ['洪峰即将到达', '流量超过设计值', '流量变化异常'],
          '降雨': ['暴雨预警', '持续强降雨', '短时强降水'],
          '设备': ['传感器离线', '数据传输异常', '设备需要维护']
        }

        addAlert({
          level,
          title: `${type}${level === 'blue' ? '提示' : level === 'yellow' ? '注意' : '警告'}`,
          message: messages[type][Math.floor(Math.random() * messages[type].length)],
          location: ['塔里木河', '伊犁河', '额尔齐斯河', '玛纳斯河'][Math.floor(Math.random() * 4)],
          duration: 8000
        })
      }, 15000 + Math.random() * 10000)
    }

    onMounted(() => {
      startMockAlerts()
    })

    onBeforeUnmount(() => {
      if (mockInterval) {
        clearInterval(mockInterval)
      }
      dismissTimers.forEach(timer => clearTimeout(timer))
      dismissTimers.clear()
    })

    // Expose methods for external use
    expose({
      addAlert,
      dismissAlert,
      clearHistory
    })

    return {
      alerts,
      alertHistory,
      visibleAlerts,
      showHistory,
      getLevelIcon,
      formatTime,
      addAlert,
      dismissAlert,
      clearHistory
    }
  }
})
</script>

<style lang="scss" scoped>
.alert-container {
  position: fixed;
  top: var(--layout-panel-top);
  right: var(--layout-panel-right);
  width: 360px;
  z-index: 60; /* above panels (30–40) but below modals */
  pointer-events: none;

  * {
    pointer-events: auto;
  }
}

.alert-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  animation: slideIn 0.3s ease;

  &.red {
    border-left: 3px solid #f44336;
    background: linear-gradient(90deg, rgba(244, 67, 54, 0.15), var(--bg-panel));

    .alert-icon { color: #f44336; }
    .alert-title { color: #f44336; }
    .alert-progress { background: #f44336; }
  }

  &.orange {
    border-left: 3px solid #ff9800;
    background: linear-gradient(90deg, rgba(255, 152, 0, 0.15), var(--bg-panel));

    .alert-icon { color: #ff9800; }
    .alert-title { color: #ff9800; }
    .alert-progress { background: #ff9800; }
  }

  &.yellow {
    border-left: 3px solid #ffeb3b;
    background: linear-gradient(90deg, rgba(255, 235, 59, 0.1), var(--bg-panel));

    .alert-icon { color: #ffeb3b; }
    .alert-title { color: #ffeb3b; }
    .alert-progress { background: #ffeb3b; }
  }

  &.blue {
    border-left: 3px solid #2196f3;
    background: linear-gradient(90deg, rgba(33, 150, 243, 0.1), var(--bg-panel));

    .alert-icon { color: #2196f3; }
    .alert-title { color: #2196f3; }
    .alert-progress { background: #2196f3; }
  }

  &.info {
    border-left: 3px solid var(--primary-color);
    background: linear-gradient(90deg, rgba(0, 246, 255, 0.1), var(--bg-panel));

    .alert-icon { color: var(--primary-color); }
    .alert-title { color: var(--primary-color); }
    .alert-progress { background: var(--primary-color); }
  }

  .alert-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .alert-content {
    flex: 1;
    min-width: 0;

    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .alert-title {
        font-size: 13px;
        font-weight: bold;
        letter-spacing: 0.5px;
      }

      .alert-time {
        font-size: 10px;
        color: var(--text-muted);
        font-family: 'Courier New', monospace;
      }
    }

    .alert-message {
      font-size: 12px;
      color: var(--text-main);
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .alert-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: var(--text-secondary);

        .meta-icon {
          font-size: 11px;
        }
      }
    }
  }

  .alert-close {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 16px;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
      color: var(--text-main);
    }
  }

  .alert-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 100%;
    transform-origin: left;
    animation: progress linear forwards;
  }
}

.alert-history-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 15px;
  margin-top: 10px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-panel-hover);
  }

  .badge {
    background: var(--primary-color);
    color: #000;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: bold;
  }

  .label {
    font-size: 11px;
    color: var(--text-secondary);
  }

  .arrow {
    font-size: 10px;
    color: var(--text-muted);
  }
}

.alert-history {
  margin-top: 8px;
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border-light);

    .title {
      font-size: 12px;
      font-weight: bold;
      color: var(--primary-color);
    }

    .clear-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 4px 10px;
      font-size: 10px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s;

      &:hover {
        border-color: #f44336;
        color: #f44336;
      }
    }
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;

    .history-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      margin-bottom: 6px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      border-left: 2px solid transparent;

      &.red { border-left-color: #f44336; }
      &.orange { border-left-color: #ff9800; }
      &.yellow { border-left-color: #ffeb3b; }
      &.blue { border-left-color: #2196f3; }
      &.info { border-left-color: var(--primary-color); }

      .history-icon {
        font-size: 14px;
      }

      .history-content {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .history-title {
          font-size: 11px;
          color: var(--text-main);
        }

        .history-time {
          font-size: 9px;
          color: var(--text-muted);
          font-family: 'Courier New', monospace;
        }
      }
    }
  }
}

/* Transitions */
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.alert-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

.alert-move {
  transition: transform 0.3s ease;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
