<template>
  <div class="overview-panel tech-panel">
    <div class="panel-header">
      <span class="deco-line"></span>
      <span class="title">项目总览</span>
      <span class="deco-line"></span>
    </div>

    <div class="content" v-if="!isLoading && !errorMessage">
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-box" v-for="(stat, index) in stats" :key="index">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value tech-font" :class="{ warning: stat.isWarning }">
            {{ stat.value }}<small>{{ stat.unit }}</small>
          </div>
          <div class="stat-bar">
            <div class="fill" :style="{ width: stat.percent + '%', background: stat.isWarning ? '#ffbd2e' : '#00f6ff' }"></div>
          </div>
        </div>
      </div>

      <!-- Chart Area -->
      <div class="chart-area">
        <div class="chart-header">
          <span>水位趋势 (24H)</span>
          <span class="trend up">↑ 2.4%</span>
        </div>
        <div class="chart-viz">
          <!-- Mock SVG Line Chart -->
          <svg width="100%" height="60" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(0, 246, 255, 0.5);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(0, 246, 255, 0);stop-opacity:0" />
              </linearGradient>
            </defs>
            <path d="M0,50 Q20,40 40,45 T80,30 T120,20 T160,35 T200,10 L200,60 L0,60 Z" fill="url(#grad)" />
            <path d="M0,50 Q20,40 40,45 T80,30 T120,20 T160,35 T200,10" fill="none" stroke="#00f6ff" stroke-width="2" />
            
            <!-- Points -->
            <circle cx="40" cy="45" r="2" fill="#fff" />
            <circle cx="80" cy="30" r="2" fill="#fff" />
            <circle cx="120" cy="20" r="2" fill="#fff" />
            <circle cx="160" cy="35" r="2" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <span>数据加载中...</span>
    </div>

    <div v-else class="error-state">
        <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { fetchProjectOverviewStats } from '@/api/backend';

export default defineComponent({
  name: 'ProjectOverview',
  setup() {
    const isLoading = ref(true);
    const errorMessage = ref('');
    
    // Initialize with empty or default values
    const stats = ref([
      { label: '在线设备', value: 0, unit: '', percent: 0, isWarning: false },
      { label: '今日告警', value: 0, unit: '次', percent: 0, isWarning: false },
      { label: '库容占比', value: 0, unit: '%', percent: 0, isWarning: false },
      { label: '平均降雨', value: 0, unit: 'mm', percent: 0, isWarning: false },
    ]);

    onMounted(async () => {
      try {
        const fetchedStats = await fetchProjectOverviewStats();
        if (fetchedStats) {
          stats.value = [
            { label: '在线设备', value: fetchedStats.online_devices, unit: `/${fetchedStats.total_devices}`, percent: Math.round((fetchedStats.online_devices / fetchedStats.total_devices) * 100) || 0, isWarning: fetchedStats.online_devices < fetchedStats.total_devices * 0.8 },
            { label: '今日告警', value: fetchedStats.today_alerts, unit: '次', percent: Math.min(100, (fetchedStats.today_alerts / 5) * 100), isWarning: fetchedStats.today_alerts > 0 }, // Assuming 5 is max reasonable alerts for bar
            { label: '库容占比', value: fetchedStats.reservoir_capacity_percent, unit: '%', percent: fetchedStats.reservoir_capacity_percent, isWarning: fetchedStats.reservoir_capacity_percent > 90 },
            { label: '平均降雨', value: fetchedStats.average_rainfall_mm, unit: 'mm', percent: Math.min(100, (fetchedStats.average_rainfall_mm / 50) * 100), isWarning: fetchedStats.average_rainfall_mm > 30 }, // Assuming 50mm is max for bar
          ];
        } else {
            errorMessage.value = "无法获取数据";
        }
      } catch (e) {
          errorMessage.value = "网络请求失败";
      } finally {
          isLoading.value = false;
      }
    });

    return { stats, isLoading, errorMessage };
  }
});
</script>

<style lang="scss" scoped>
.overview-panel {
  /* Removed absolute positioning to let it flow in parent */
  width: 100%;
  box-sizing: border-box;
  padding: 15px;
  animation: fadeIn 0.8s ease forwards;

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
    }

    .deco-line {
      height: 1px;
      background: var(--primary-dim);
      flex: 1;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;

    .stat-box {
      background: rgba(255, 255, 255, 0.03);
      padding: 10px;
      border-radius: 4px;
      
      .stat-label {
        font-size: 11px;
        color: var(--text-secondary);
        margin-bottom: 5px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 5px;
        
        small {
          font-size: 10px;
          margin-left: 2px;
          color: var(--text-muted);
        }

        &.warning { color: #ffbd2e; }
      }

      .stat-bar {
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1.5px;
        overflow: hidden;
        
        .fill {
          height: 100%;
          border-radius: 1.5px;
        }
      }
    }
  }

  .chart-area {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 10px;
    border: 1px solid var(--border-light);

    .chart-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-secondary);
      margin-bottom: 5px;

      .trend.up { color: #00ff9d; }
    }

    .chart-viz {
      height: 60px;
      width: 100%;
      position: relative;
    }
  }

  .loading-state, .error-state {
      height: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 12px;
  }

  .error-state {
      color: #ff4d4f;
  }

  .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-color);
      border-top-color: var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
  }

  @keyframes spin {
      to { transform: rotate(360deg); }
  }
}
</style>