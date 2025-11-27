<template>
  <div class="model-result-panel tech-panel">
    <!-- Panel Header -->
    <div class="panel-header">
      <span class="deco-line"></span>
      <span class="title">MODEL RESULTS</span>
      <span class="deco-line"></span>
      <button class="collapse-btn" @click="collapsed = !collapsed">
        {{ collapsed ? '+' : '-' }}
      </button>
    </div>

    <div class="panel-content" v-show="!collapsed">
      <!-- Model Selector -->
      <div class="model-selector">
        <label>选择模型</label>
        <select v-model="selectedModelId" class="tech-select">
          <option v-for="model in HydroModels" :key="model.id" :value="model.id">
            {{ model.name }}
          </option>
        </select>
      </div>

      <!-- Model Info Card -->
      <div class="model-info" v-if="selectedModel">
        <div class="info-row">
          <span class="label">模型类型</span>
          <span class="value model-type" :class="selectedModel.type.toLowerCase()">
            {{ selectedModel.type }}
          </span>
        </div>
        <div class="info-row">
          <span class="label">流域</span>
          <span class="value">{{ selectedModel.basin }}</span>
        </div>
        <div class="info-row">
          <span class="label">河长</span>
          <span class="value tech-font">{{ selectedModel.riverLength }}<small>km</small></span>
        </div>
        <div class="info-row">
          <span class="label">断面数</span>
          <span class="value tech-font">{{ selectedModel.crossSections }}</span>
        </div>
        <div class="info-row">
          <span class="label">状态</span>
          <span class="value status" :class="selectedModel.status">
            {{ statusText[selectedModel.status] }}
          </span>
        </div>
      </div>

      <!-- Scenarios List -->
      <div class="scenarios-section" v-if="modelScenarios.length">
        <div class="section-title">
          <span class="icon">◆</span>
          计算方案 ({{ modelScenarios.length }})
        </div>
        <div class="scenario-list">
          <div
            v-for="scenario in modelScenarios"
            :key="scenario.id"
            class="scenario-item"
            :class="{ active: selectedScenarioId === scenario.id }"
            @click="selectScenario(scenario)"
          >
            <div class="scenario-header">
              <span class="scenario-name">{{ scenario.name }}</span>
              <span class="scenario-type" :class="scenario.type">{{ scenarioTypeText[scenario.type] }}</span>
            </div>
            <div class="scenario-meta">
              <span v-if="scenario.returnPeriod">{{ scenario.returnPeriod }}年一遇</span>
              <span>{{ scenario.simulationType }}</span>
            </div>
            <div class="scenario-status">
              <span class="status-badge" :class="scenario.status">
                {{ scenarioStatusText[scenario.status] }}
              </span>
              <div class="progress-bar" v-if="scenario.status === 'running'">
                <div class="progress-fill" :style="{ width: (scenario.progress || 0) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Scenario Details -->
      <div class="scenario-details" v-if="selectedScenario">
        <div class="section-title">
          <span class="icon">◆</span>
          方案详情
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">开始时间</span>
            <span class="value tech-font">{{ formatTime(selectedScenario.startTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">结束时间</span>
            <span class="value tech-font">{{ formatTime(selectedScenario.endTime) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">计算步长</span>
            <span class="value tech-font">{{ selectedScenario.timeStep }}<small>s</small></span>
          </div>
          <div class="detail-item">
            <span class="label">输出间隔</span>
            <span class="value tech-font">{{ selectedScenario.outputInterval }}<small>min</small></span>
          </div>
          <div class="detail-item full-width">
            <span class="label">上游边界</span>
            <span class="value tech-font">
              {{ selectedScenario.boundaryConditions.upstream.type === 'flow' ? '流量' : '水位' }}:
              {{ selectedScenario.boundaryConditions.upstream.value }}
              {{ selectedScenario.boundaryConditions.upstream.type === 'flow' ? 'm³/s' : 'm' }}
            </span>
          </div>
        </div>

        <!-- Flood Peaks Summary -->
        <div class="flood-peaks" v-if="scenarioFloodPeaks.length">
          <div class="peaks-title">洪峰传播</div>
          <div class="peaks-list">
            <div v-for="peak in scenarioFloodPeaks" :key="peak.id" class="peak-item">
              <div class="peak-station">{{ peak.stationName }}</div>
              <div class="peak-data">
                <span class="peak-value">
                  <span class="label">Q</span>
                  <span class="tech-font">{{ peak.peakDischarge.toLocaleString() }}</span>
                  <small>m³/s</small>
                </span>
                <span class="peak-value">
                  <span class="label">H</span>
                  <span class="tech-font">{{ peak.peakWaterLevel.toFixed(1) }}</span>
                  <small>m</small>
                </span>
              </div>
              <div class="peak-time">
                <span class="label">传播时间</span>
                <span class="tech-font">{{ peak.travelTime }}h</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Inundation Summary -->
        <div class="inundation-summary" v-if="scenarioInundation.length">
          <div class="inundation-title">淹没统计</div>
          <div class="inundation-stats">
            <div class="stat-item">
              <span class="stat-label">最大水深</span>
              <span class="stat-value tech-font">{{ maxInundationDepth.toFixed(1) }}<small>m</small></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">淹没面积</span>
              <span class="stat-value tech-font">{{ maxInundationArea.toFixed(1) }}<small>km²</small></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">影响区域</span>
              <span class="stat-value tech-font">{{ maxAffectedArea.toFixed(1) }}<small>km²</small></span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="tech-btn" @click="$emit('viewChart', selectedScenario)">
            <span class="btn-icon">📈</span>
            查看过程线
          </button>
          <button class="tech-btn primary" @click="$emit('viewInundation', selectedScenario)">
            <span class="btn-icon">🗺️</span>
            查看淹没图
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import {
  HydroModels,
  ModelScenarios,
  FloodPeaks,
  InundationResults,
  getScenariosByModel,
  getInundationByScenario,
  type HydroModel,
  type ModelScenario
} from '../mock/modelResults'

export default defineComponent({
  name: 'ModelResultPanel',
  emits: ['viewChart', 'viewInundation', 'scenarioChange'],
  setup(_, { emit }) {
    const collapsed = ref(false)
    const selectedModelId = ref(HydroModels[0]?.id || '')
    const selectedScenarioId = ref('')

    const statusText: Record<string, string> = {
      ready: '就绪',
      running: '运行中',
      completed: '已完成',
      error: '错误'
    }

    const scenarioStatusText: Record<string, string> = {
      pending: '待计算',
      running: '计算中',
      completed: '已完成',
      failed: '失败'
    }

    const scenarioTypeText: Record<string, string> = {
      historical: '历史',
      design: '设计',
      forecast: '预报',
      emergency: '应急'
    }

    const selectedModel = computed<HydroModel | undefined>(() => {
      return HydroModels.find(m => m.id === selectedModelId.value)
    })

    const modelScenarios = computed(() => {
      return getScenariosByModel(selectedModelId.value)
    })

    const selectedScenario = computed<ModelScenario | undefined>(() => {
      return ModelScenarios.find(s => s.id === selectedScenarioId.value)
    })

    const scenarioFloodPeaks = computed(() => {
      if (!selectedScenarioId.value) return []
      return FloodPeaks.filter(p => p.scenarioId === selectedScenarioId.value)
    })

    const scenarioInundation = computed(() => {
      return getInundationByScenario(selectedScenarioId.value)
    })

    const maxInundationDepth = computed(() => {
      const depths = scenarioInundation.value.map(i => i.maxDepth)
      return Math.max(...depths, 0)
    })

    const maxInundationArea = computed(() => {
      const areas = scenarioInundation.value.map(i => i.totalArea)
      return Math.max(...areas, 0)
    })

    const maxAffectedArea = computed(() => {
      const areas = scenarioInundation.value.map(i => i.affectedArea)
      return Math.max(...areas, 0)
    })

    const formatTime = (isoString: string): string => {
      const date = new Date(isoString)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const selectScenario = (scenario: ModelScenario) => {
      selectedScenarioId.value = scenario.id
      emit('scenarioChange', scenario)
    }

    // Auto-select first scenario when model changes
    watch(selectedModelId, () => {
      const scenarios = getScenariosByModel(selectedModelId.value)
      if (scenarios.length > 0) {
        selectedScenarioId.value = scenarios[0].id
        emit('scenarioChange', scenarios[0])
      } else {
        selectedScenarioId.value = ''
      }
    }, { immediate: true })

    return {
      collapsed,
      selectedModelId,
      selectedScenarioId,
      selectedModel,
      modelScenarios,
      selectedScenario,
      scenarioFloodPeaks,
      scenarioInundation,
      maxInundationDepth,
      maxInundationArea,
      maxAffectedArea,
      statusText,
      scenarioStatusText,
      scenarioTypeText,
      formatTime,
      selectScenario,
      HydroModels
    }
  }
})
</script>

<style lang="scss" scoped>
.model-result-panel {
  position: absolute;
  top: 120px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  padding: 15px;
  z-index: 80;
  animation: slideInRight 0.5s ease forwards;

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;

    .title {
      font-size: 14px;
      font-weight: bold;
      color: var(--primary-color);
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .deco-line {
      height: 1px;
      background: var(--primary-dim);
      flex: 1;
    }

    .collapse-btn {
      width: 24px;
      height: 24px;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--primary-color);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: var(--primary-dim);
      }
    }
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .model-selector {
    label {
      font-size: 11px;
      color: var(--text-secondary);
      display: block;
      margin-bottom: 5px;
    }

    .tech-select {
      width: 100%;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 13px;
      border-radius: 4px;
      cursor: pointer;
      outline: none;

      &:focus {
        border-color: var(--primary-color);
      }

      option {
        background: #0a0d1a;
        color: #fff;
      }
    }
  }

  .model-info {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 10px;
    border: 1px solid var(--border-light);

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid var(--border-light);

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 11px;
        color: var(--text-secondary);
      }

      .value {
        font-size: 13px;
        color: var(--text-main);

        small {
          font-size: 10px;
          color: var(--text-muted);
          margin-left: 2px;
        }

        &.model-type {
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: bold;

          &.hec-ras { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
          &.mike11 { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
          &.mike21 { background: rgba(156, 39, 176, 0.2); color: #9c27b0; }
          &.mike-flood { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
          &.swmm { background: rgba(0, 188, 212, 0.2); color: #00bcd4; }
          &.ifms { background: rgba(233, 30, 99, 0.2); color: #e91e63; }
        }

        &.status {
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 11px;

          &.ready { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
          &.running { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
          &.completed { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
          &.error { background: rgba(244, 67, 54, 0.2); color: #f44336; }
        }
      }
    }
  }

  .section-title {
    font-size: 12px;
    color: var(--primary-color);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;

    .icon {
      font-size: 10px;
    }
  }

  .scenario-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .scenario-item {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-light);
    border-radius: 4px;
    padding: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--border-color);
      background: rgba(0, 246, 255, 0.05);
    }

    &.active {
      border-color: var(--primary-color);
      background: rgba(0, 246, 255, 0.1);
    }

    .scenario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .scenario-name {
        font-size: 12px;
        color: var(--text-main);
        font-weight: 500;
      }

      .scenario-type {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 2px;

        &.historical { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }
        &.design { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
        &.forecast { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
        &.emergency { background: rgba(244, 67, 54, 0.2); color: #f44336; }
      }
    }

    .scenario-meta {
      font-size: 10px;
      color: var(--text-muted);
      display: flex;
      gap: 10px;
      margin-bottom: 6px;
    }

    .scenario-status {
      display: flex;
      align-items: center;
      gap: 8px;

      .status-badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 2px;

        &.pending { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }
        &.running { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
        &.completed { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
        &.failed { background: rgba(244, 67, 54, 0.2); color: #f44336; }
      }

      .progress-bar {
        flex: 1;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff9800, #ffeb3b);
          border-radius: 2px;
          transition: width 0.3s;
        }
      }
    }
  }

  .scenario-details {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    padding: 12px;
    border: 1px solid var(--border-light);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;

      &.full-width {
        grid-column: span 2;
      }

      .label {
        font-size: 10px;
        color: var(--text-muted);
      }

      .value {
        font-size: 12px;
        color: var(--text-main);

        small {
          font-size: 10px;
          color: var(--text-muted);
        }
      }
    }
  }

  .flood-peaks, .inundation-summary {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .peaks-title, .inundation-title {
    font-size: 11px;
    color: var(--secondary-color);
    margin-bottom: 8px;
  }

  .peaks-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .peak-item {
    display: grid;
    grid-template-columns: 60px 1fr 70px;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-light);

    &:last-child {
      border-bottom: none;
    }

    .peak-station {
      font-size: 11px;
      color: var(--text-main);
    }

    .peak-data {
      display: flex;
      gap: 12px;

      .peak-value {
        display: flex;
        align-items: baseline;
        gap: 2px;

        .label {
          font-size: 10px;
          color: var(--text-muted);
        }

        .tech-font {
          font-size: 12px;
          color: var(--primary-color);
        }

        small {
          font-size: 9px;
          color: var(--text-muted);
        }
      }
    }

    .peak-time {
      text-align: right;
      font-size: 10px;
      color: var(--text-secondary);

      .label {
        display: none;
      }

      .tech-font {
        color: var(--text-main);
      }
    }
  }

  .inundation-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;

    .stat-item {
      text-align: center;

      .stat-label {
        font-size: 10px;
        color: var(--text-muted);
        display: block;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 16px;
        color: var(--primary-color);

        small {
          font-size: 10px;
          color: var(--text-muted);
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;

    .tech-btn {
      flex: 1;
      padding: 8px 12px;
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 12px;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;

      &:hover {
        background: var(--primary-dim);
        border-color: var(--primary-color);
      }

      &.primary {
        background: rgba(0, 246, 255, 0.15);
        border-color: var(--primary-color);
        color: var(--primary-color);

        &:hover {
          background: rgba(0, 246, 255, 0.25);
        }
      }

      .btn-icon {
        font-size: 14px;
      }
    }
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
