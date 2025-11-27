<template>
  <Teleport to="body">
    <div class="flow-chart-overlay" v-if="visible" @click.self="handleClose">
      <div class="flow-chart-dialog tech-panel">
        <!-- Header -->
        <div class="dialog-header">
          <div class="header-left">
            <span class="icon">◆</span>
            <span class="title">{{ title || '流量/水位过程线' }}</span>
          </div>
          <div class="header-right">
            <select v-model="selectedCrossSection" class="section-select">
              <option v-for="xs in crossSections" :key="xs.id" :value="xs.id">
                {{ xs.stationId }} - {{ xs.riverName }}
              </option>
            </select>
            <button class="close-btn" @click="handleClose">×</button>
          </div>
        </div>

        <!-- Chart Container -->
        <div class="chart-container">
          <div ref="chartRef" class="echarts-chart"></div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-summary" v-if="chartStats">
          <div class="stat-item">
            <span class="label">最大流量</span>
            <span class="value tech-font">{{ chartStats.maxDischarge.toFixed(0) }}<small>m³/s</small></span>
          </div>
          <div class="stat-item">
            <span class="label">最高水位</span>
            <span class="value tech-font">{{ chartStats.maxWaterLevel.toFixed(2) }}<small>m</small></span>
          </div>
          <div class="stat-item">
            <span class="label">平均流速</span>
            <span class="value tech-font">{{ chartStats.avgVelocity.toFixed(2) }}<small>m/s</small></span>
          </div>
          <div class="stat-item">
            <span class="label">峰现时间</span>
            <span class="value tech-font">{{ chartStats.peakTime }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color discharge"></span>
            <span class="legend-label">流量 (m³/s)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color water-level"></span>
            <span class="legend-label">水位 (m)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color velocity"></span>
            <span class="legend-label">流速 (m/s)</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount, nextTick, PropType } from 'vue'
import * as echarts from 'echarts'
import {
  CrossSections,
  FlowResults,
  getFlowResultsByScenario,
  type ModelScenario,
  type FlowResult,
  type CrossSection
} from '../mock/modelResults'

interface ChartStats {
  maxDischarge: number
  maxWaterLevel: number
  avgVelocity: number
  peakTime: string
}

export default defineComponent({
  name: 'FlowChartDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    scenario: {
      type: Object as PropType<ModelScenario | null>,
      default: null
    },
    title: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible', 'close'],
  setup(props, { emit }) {
    const chartRef = ref<HTMLElement | null>(null)
    let chartInstance: echarts.ECharts | null = null
    const selectedCrossSection = ref('')

    const crossSections = computed<CrossSection[]>(() => {
      if (!props.scenario) return []
      return CrossSections.filter(xs => xs.modelId === props.scenario?.modelId)
    })

    const flowResults = computed<FlowResult[]>(() => {
      if (!props.scenario || !selectedCrossSection.value) return []
      return FlowResults.filter(
        r => r.scenarioId === props.scenario?.id && r.crossSectionId === selectedCrossSection.value
      )
    })

    const chartStats = computed<ChartStats | null>(() => {
      if (flowResults.value.length === 0) return null

      const results = flowResults.value
      const maxDischargeResult = results.reduce((max, r) => r.discharge > max.discharge ? r : max, results[0])

      return {
        maxDischarge: Math.max(...results.map(r => r.discharge)),
        maxWaterLevel: Math.max(...results.map(r => r.waterLevel)),
        avgVelocity: results.reduce((sum, r) => sum + r.velocity, 0) / results.length,
        peakTime: new Date(maxDischargeResult.timestamp).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    })

    const initChart = () => {
      if (!chartRef.value) return

      chartInstance = echarts.init(chartRef.value, 'dark')
      updateChart()

      window.addEventListener('resize', handleResize)
    }

    const handleResize = () => {
      chartInstance?.resize()
    }

    const updateChart = () => {
      if (!chartInstance || flowResults.value.length === 0) return

      const results = flowResults.value
      const times = results.map(r => {
        const date = new Date(r.timestamp)
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`
      })
      const discharges = results.map(r => r.discharge)
      const waterLevels = results.map(r => r.waterLevel)
      const velocities = results.map(r => r.velocity)

      const option: echarts.EChartsOption = {
        backgroundColor: 'transparent',
        grid: {
          left: 60,
          right: 60,
          top: 30,
          bottom: 50
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(5, 8, 21, 0.9)',
          borderColor: '#00f6ff',
          borderWidth: 1,
          textStyle: {
            color: '#fff'
          },
          formatter: (params: any) => {
            const time = params[0].axisValue
            let html = `<div style="font-weight:bold;margin-bottom:8px">${time}</div>`
            params.forEach((item: any) => {
              const unit = item.seriesName === '流量' ? 'm³/s' : item.seriesName === '水位' ? 'm' : 'm/s'
              html += `<div style="display:flex;justify-content:space-between;gap:20px">
                <span>${item.marker}${item.seriesName}</span>
                <span style="font-weight:bold">${item.value.toFixed(2)} ${unit}</span>
              </div>`
            })
            return html
          }
        },
        xAxis: {
          type: 'category',
          data: times,
          axisLine: { lineStyle: { color: '#2a3f5f' } },
          axisLabel: { color: '#8893a7', fontSize: 10 },
          splitLine: { show: false }
        },
        yAxis: [
          {
            type: 'value',
            name: '流量 (m³/s)',
            nameTextStyle: { color: '#00f6ff', fontSize: 11 },
            position: 'left',
            axisLine: { lineStyle: { color: '#00f6ff' } },
            axisLabel: { color: '#00f6ff', fontSize: 10 },
            splitLine: { lineStyle: { color: 'rgba(0, 246, 255, 0.1)' } }
          },
          {
            type: 'value',
            name: '水位 (m)',
            nameTextStyle: { color: '#ff9800', fontSize: 11 },
            position: 'right',
            axisLine: { lineStyle: { color: '#ff9800' } },
            axisLabel: { color: '#ff9800', fontSize: 10 },
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '流量',
            type: 'line',
            yAxisIndex: 0,
            data: discharges,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#00f6ff', width: 2 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 246, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 246, 255, 0)' }
              ])
            }
          },
          {
            name: '水位',
            type: 'line',
            yAxisIndex: 1,
            data: waterLevels,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#ff9800', width: 2 }
          },
          {
            name: '流速',
            type: 'line',
            yAxisIndex: 0,
            data: velocities.map(v => v * 300), // Scale for visibility
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#4caf50', width: 1, type: 'dashed' },
            tooltip: {
              valueFormatter: (val: any) => (val / 300).toFixed(2) + ' m/s'
            }
          }
        ]
      }

      chartInstance.setOption(option)
    }

    const handleClose = () => {
      emit('update:visible', false)
      emit('close')
    }

    // Watch for scenario changes
    watch(() => props.scenario, (newScenario) => {
      if (newScenario) {
        const sections = CrossSections.filter(xs => xs.modelId === newScenario.modelId)
        if (sections.length > 0) {
          selectedCrossSection.value = sections[0].id
        }
      }
    }, { immediate: true })

    // Watch for cross section changes
    watch(selectedCrossSection, () => {
      nextTick(() => updateChart())
    })

    // Watch for visibility
    watch(() => props.visible, (visible) => {
      if (visible) {
        nextTick(() => {
          if (!chartInstance) {
            initChart()
          } else {
            chartInstance.resize()
            updateChart()
          }
        })
      }
    })

    onMounted(() => {
      if (props.visible) {
        nextTick(() => initChart())
      }
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize)
      chartInstance?.dispose()
    })

    return {
      chartRef,
      selectedCrossSection,
      crossSections,
      chartStats,
      handleClose
    }
  }
})
</script>

<style lang="scss" scoped>
.flow-chart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.flow-chart-dialog {
  width: 900px;
  max-width: 90vw;
  max-height: 90vh;
  padding: 20px;
  animation: slideUp 0.3s ease;

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border-color);

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .icon {
        color: var(--primary-color);
        font-size: 12px;
      }

      .title {
        font-size: 16px;
        font-weight: bold;
        color: var(--primary-color);
        letter-spacing: 1px;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 15px;

      .section-select {
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-color);
        color: var(--text-main);
        font-size: 12px;
        border-radius: 4px;
        cursor: pointer;
        outline: none;

        &:focus {
          border-color: var(--primary-color);
        }

        option {
          background: #0a0d1a;
        }
      }

      .close-btn {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
        font-size: 20px;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
          border-color: #f44336;
          color: #f44336;
          background: rgba(244, 67, 54, 0.1);
        }
      }
    }
  }

  .chart-container {
    height: 400px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    border: 1px solid var(--border-light);
    margin-bottom: 15px;

    .echarts-chart {
      width: 100%;
      height: 100%;
    }
  }

  .stats-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 15px;
    padding: 15px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    border: 1px solid var(--border-light);

    .stat-item {
      text-align: center;

      .label {
        font-size: 11px;
        color: var(--text-muted);
        display: block;
        margin-bottom: 5px;
      }

      .value {
        font-size: 18px;
        color: var(--primary-color);

        small {
          font-size: 11px;
          color: var(--text-muted);
          margin-left: 2px;
        }
      }
    }
  }

  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 30px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .legend-color {
        width: 20px;
        height: 3px;
        border-radius: 1.5px;

        &.discharge {
          background: #00f6ff;
        }

        &.water-level {
          background: #ff9800;
        }

        &.velocity {
          background: #4caf50;
          height: 2px;
          border-style: dashed;
        }
      }

      .legend-label {
        font-size: 11px;
        color: var(--text-secondary);
      }
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
