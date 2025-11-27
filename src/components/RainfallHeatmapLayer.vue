<template>
  <div class="rainfall-control-panel tech-panel" v-if="showControls">
    <!-- Header -->
    <div class="panel-header">
      <span class="icon">◆</span>
      <span class="title">降雨热力图</span>
      <button class="toggle-btn" @click="enabled = !enabled" :class="{ active: enabled }">
        {{ enabled ? 'ON' : 'OFF' }}
      </button>
    </div>

    <div class="panel-content" v-show="enabled">
      <!-- Region Selector -->
      <div class="control-row">
        <label>流域区域</label>
        <select v-model="selectedRegion" class="tech-select">
          <option value="yili">伊犁河流域</option>
          <option value="tarim">塔里木河流域</option>
          <option value="irtysh">额尔齐斯河流域</option>
        </select>
      </div>

      <!-- Time Slider -->
      <div class="time-control">
        <div class="time-header">
          <span class="label">时间</span>
          <span class="current-time tech-font">{{ currentTimeDisplay }}</span>
        </div>
        <div class="slider-container">
          <input
            type="range"
            v-model.number="currentFrameIndex"
            :min="0"
            :max="maxFrameIndex"
            class="time-slider"
          />
        </div>
        <div class="play-controls">
          <button class="control-btn" @click="skipBackward">
            ⏮
          </button>
          <button class="control-btn play" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
          </button>
          <button class="control-btn" @click="skipForward">
            ⏭
          </button>
          <select v-model.number="playSpeed" class="speed-select">
            <option :value="500">2x</option>
            <option :value="1000">1x</option>
            <option :value="2000">0.5x</option>
          </select>
        </div>
      </div>

      <!-- Stats Display -->
      <div class="stats-display" v-if="currentFrame">
        <div class="stat-item">
          <span class="label">最大雨强</span>
          <span class="value tech-font" :class="getIntensityClass(currentFrame.stats.maxRainfall)">
            {{ currentFrame.stats.maxRainfall }}<small>mm/h</small>
          </span>
        </div>
        <div class="stat-item">
          <span class="label">平均雨强</span>
          <span class="value tech-font">
            {{ currentFrame.stats.avgRainfall }}<small>mm/h</small>
          </span>
        </div>
        <div class="stat-item">
          <span class="label">降雨覆盖</span>
          <span class="value tech-font">
            {{ coveragePercent }}<small>%</small>
          </span>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend">
        <div class="legend-title">降雨强度 (mm/h)</div>
        <div class="legend-bar">
          <div
            v-for="(item, index) in colorScale.slice(1)"
            :key="index"
            class="legend-segment"
            :style="{ background: item.color.replace(/[\d.]+\)$/, '1)') }"
          >
            <span class="legend-label">{{ item.threshold }}</span>
          </div>
        </div>
        <div class="legend-labels">
          <span>小雨</span>
          <span>中雨</span>
          <span>大雨</span>
          <span>暴雨</span>
        </div>
      </div>

      <!-- Opacity Control -->
      <div class="opacity-control">
        <label>透明度</label>
        <input type="range" v-model.number="opacity" min="0.1" max="1" step="0.1" class="opacity-slider" />
        <span class="opacity-value">{{ Math.round(opacity * 100) }}%</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, PropType } from 'vue'
import {
  AllRainfallFrames,
  RainfallColorScale,
  getRainfallColor,
  type RainfallFrame
} from '../mock/rainfallGrid'

export default defineComponent({
  name: 'RainfallHeatmapLayer',
  props: {
    viewer: {
      type: Object as PropType<any>,
      default: null
    },
    showControls: {
      type: Boolean,
      default: true
    },
    initialRegion: {
      type: String as PropType<'yili' | 'tarim' | 'irtysh'>,
      default: 'yili'
    }
  },
  emits: ['update:enabled', 'frameChange'],
  setup(props, { emit }) {
    const enabled = ref(false)
    const selectedRegion = ref(props.initialRegion)
    const currentFrameIndex = ref(0)
    const isPlaying = ref(false)
    const playSpeed = ref(1000)
    const opacity = ref(0.7)

    let playInterval: ReturnType<typeof setInterval> | null = null
    let heatmapEntities: any[] = []

    const colorScale = RainfallColorScale

    const frames = computed<RainfallFrame[]>(() => {
      return AllRainfallFrames[selectedRegion.value] || []
    })

    const maxFrameIndex = computed(() => {
      return Math.max(0, frames.value.length - 1)
    })

    const currentFrame = computed<RainfallFrame | null>(() => {
      return frames.value[currentFrameIndex.value] || null
    })

    const currentTimeDisplay = computed(() => {
      if (!currentFrame.value) return '--:--'
      const date = new Date(currentFrame.value.timestamp)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    const coveragePercent = computed(() => {
      if (!currentFrame.value) return 0
      const { rainyPoints, totalPoints } = currentFrame.value.stats
      return Math.round((rainyPoints / totalPoints) * 100)
    })

    const getIntensityClass = (value: number): string => {
      if (value >= 32) return 'storm'
      if (value >= 16) return 'heavy'
      if (value >= 8) return 'moderate'
      return 'light'
    }

    const clearHeatmap = () => {
      if (!props.viewer) return
      heatmapEntities.forEach(entity => {
        try {
          props.viewer.entities.remove(entity)
        } catch (e) {
          // Entity may already be removed
        }
      })
      heatmapEntities = []
    }

    const renderHeatmap = () => {
      if (!props.viewer || !enabled.value || !currentFrame.value) {
        clearHeatmap()
        return
      }

      clearHeatmap()

      const Cesium = (window as any).Cesium
      if (!Cesium) return

      const frame = currentFrame.value
      const gridSize = 0.15 // Half of the grid resolution

      frame.points.forEach(point => {
        if (point.value < 0.5) return // Skip very light rainfall

        const color = getRainfallColor(point.value)
        // Parse rgba color
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
        if (!match) return

        const r = parseInt(match[1]) / 255
        const g = parseInt(match[2]) / 255
        const b = parseInt(match[3]) / 255
        const a = parseFloat(match[4] || '1') * opacity.value

        const entity = props.viewer.entities.add({
          rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(
              point.lng - gridSize,
              point.lat - gridSize,
              point.lng + gridSize,
              point.lat + gridSize
            ),
            material: new Cesium.Color(r, g, b, a),
            height: 0,
            outline: false
          }
        })
        heatmapEntities.push(entity)
      })
    }

    const togglePlay = () => {
      if (isPlaying.value) {
        stopPlay()
      } else {
        startPlay()
      }
    }

    const startPlay = () => {
      if (playInterval) clearInterval(playInterval)
      isPlaying.value = true

      playInterval = setInterval(() => {
        if (currentFrameIndex.value >= maxFrameIndex.value) {
          currentFrameIndex.value = 0
        } else {
          currentFrameIndex.value++
        }
      }, playSpeed.value)
    }

    const stopPlay = () => {
      isPlaying.value = false
      if (playInterval) {
        clearInterval(playInterval)
        playInterval = null
      }
    }

    const skipBackward = () => {
      currentFrameIndex.value = Math.max(0, currentFrameIndex.value - 1)
    }

    const skipForward = () => {
      currentFrameIndex.value = Math.min(maxFrameIndex.value, currentFrameIndex.value + 1)
    }

    // Watch enabled state
    watch(enabled, (newVal) => {
      emit('update:enabled', newVal)
      if (newVal) {
        renderHeatmap()
      } else {
        clearHeatmap()
        stopPlay()
      }
    })

    // Watch region change
    watch(selectedRegion, () => {
      currentFrameIndex.value = 0
      if (enabled.value) {
        renderHeatmap()
      }
    })

    // Watch frame index change
    watch(currentFrameIndex, () => {
      if (enabled.value) {
        renderHeatmap()
        emit('frameChange', currentFrame.value)
      }
    })

    // Watch opacity change
    watch(opacity, () => {
      if (enabled.value) {
        renderHeatmap()
      }
    })

    // Watch play speed change
    watch(playSpeed, () => {
      if (isPlaying.value) {
        stopPlay()
        startPlay()
      }
    })

    onMounted(() => {
      if (enabled.value && props.viewer) {
        renderHeatmap()
      }
    })

    onBeforeUnmount(() => {
      stopPlay()
      clearHeatmap()
    })

    return {
      enabled,
      selectedRegion,
      currentFrameIndex,
      maxFrameIndex,
      currentFrame,
      currentTimeDisplay,
      coveragePercent,
      isPlaying,
      playSpeed,
      opacity,
      colorScale,
      getIntensityClass,
      togglePlay,
      skipBackward,
      skipForward
    }
  }
})
</script>

<style lang="scss" scoped>
.rainfall-control-panel {
  position: absolute;
  bottom: 100px;
  left: 20px;
  width: 280px;
  padding: 12px;
  z-index: 80;
  animation: slideInLeft 0.4s ease forwards;

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border-color);

    .icon {
      color: var(--primary-color);
      font-size: 10px;
    }

    .title {
      font-size: 12px;
      font-weight: bold;
      color: var(--primary-color);
      letter-spacing: 1px;
      flex: 1;
    }

    .toggle-btn {
      padding: 4px 10px;
      font-size: 10px;
      border: 1px solid var(--border-color);
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s;

      &.active {
        background: rgba(0, 246, 255, 0.2);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
    }
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: 10px;

    label {
      font-size: 11px;
      color: var(--text-secondary);
      min-width: 60px;
    }

    .tech-select {
      flex: 1;
      padding: 5px 8px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 11px;
      border-radius: 3px;
      cursor: pointer;
      outline: none;

      option {
        background: #0a0d1a;
      }
    }
  }

  .time-control {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 10px;

    .time-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .label {
        font-size: 10px;
        color: var(--text-muted);
      }

      .current-time {
        font-size: 12px;
        color: var(--primary-color);
      }
    }

    .slider-container {
      margin-bottom: 8px;

      .time-slider {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        outline: none;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: var(--primary-color);
          border-radius: 50%;
          cursor: pointer;
        }
      }
    }

    .play-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .control-btn {
        width: 28px;
        height: 28px;
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        cursor: pointer;
        border-radius: 3px;
        font-size: 12px;
        transition: all 0.2s;

        &:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }

        &.play {
          width: 36px;
          background: rgba(0, 246, 255, 0.1);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
      }

      .speed-select {
        padding: 4px 6px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-light);
        color: var(--text-secondary);
        font-size: 10px;
        border-radius: 3px;
        cursor: pointer;

        option {
          background: #0a0d1a;
        }
      }
    }
  }

  .stats-display {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;

    .stat-item {
      text-align: center;

      .label {
        font-size: 9px;
        color: var(--text-muted);
        display: block;
        margin-bottom: 3px;
      }

      .value {
        font-size: 14px;
        color: var(--text-main);

        small {
          font-size: 9px;
          color: var(--text-muted);
        }

        &.light { color: #a6f2cc; }
        &.moderate { color: #0096c8; }
        &.heavy { color: #0000ff; }
        &.storm { color: #ff00ff; }
      }
    }
  }

  .legend {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 8px;

    .legend-title {
      font-size: 10px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .legend-bar {
      display: flex;
      height: 12px;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;

      .legend-segment {
        flex: 1;
        position: relative;

        .legend-label {
          position: absolute;
          bottom: -14px;
          left: 0;
          font-size: 8px;
          color: var(--text-muted);
        }
      }
    }

    .legend-labels {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
  }

  .opacity-control {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      font-size: 10px;
      color: var(--text-muted);
      min-width: 40px;
    }

    .opacity-slider {
      flex: 1;
      height: 3px;
      -webkit-appearance: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1.5px;
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 10px;
        height: 10px;
        background: var(--primary-color);
        border-radius: 50%;
        cursor: pointer;
      }
    }

    .opacity-value {
      font-size: 10px;
      color: var(--text-secondary);
      min-width: 30px;
      text-align: right;
    }
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
