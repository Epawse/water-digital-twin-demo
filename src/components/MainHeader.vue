<template>
  <div class="main-header">
    <div class="header-bg">
      <svg width="100%" height="100%" viewBox="0 0 1920 80" preserveAspectRatio="none">
        <path d="M0,0 L1920,0 L1920,50 L1300,50 L1280,80 L640,80 L620,50 L0,50 Z" fill="rgba(5, 8, 21, 0.9)" stroke="rgba(0, 246, 255, 0.3)" stroke-width="1" />
        <path d="M0,52 L618,52 L638,82 L1282,82 L1302,52 L1920,52" fill="none" stroke="rgba(0, 246, 255, 0.5)" stroke-width="2" opacity="0.6" />
      </svg>
    </div>

    <div class="content-layer">
      <div class="left-section">
         <!-- Decorative center metrics or status moved to left -->
        <div class="status-indicator">
          <span class="dot pulsing"></span>
          <span>SYSTEM ONLINE</span>
        </div>
      </div>

      <div class="center-section">
         <div class="project-title">
          <span class="logo-icon">💠</span>
          <div class="text-wrapper">
            <div class="main-title">水利数字孪生基础框架平台</div>
            <div class="sub-title">WATER DIGITAL TWIN PLATFORM</div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <div class="weather-box">
          <span class="icon">🌤</span>
          <span class="temp">24°C</span>
          <span class="location">武汉</span>
        </div>
        <div class="time-box tech-font">
          {{ currentDate }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'MainHeader',
  setup() {
    const currentDate = ref('');
    let timer: any = null;

    const updateTime = () => {
      const now = new Date();
      // Format: 2023-10-27 14:30:59
      const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
      currentDate.value = `${dateStr} ${timeStr}`;
    };

    onMounted(() => {
      updateTime();
      timer = setInterval(updateTime, 1000);
    });

    onUnmounted(() => {
      if (timer) clearInterval(timer);
    });

    return { currentDate };
  }
});
</script>

<style lang="scss" scoped>
.main-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  z-index: 100;
  pointer-events: none;
  user-select: none;

  .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    filter: drop-shadow(0 0 10px rgba(0, 246, 255, 0.2));
  }

  .content-layer {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start; /* Top align mainly */
    padding: 0 40px;
    
    .left-section, .right-section {
      width: 25%; /* Fixed width for balance */
      display: flex;
      align-items: center;
    }

    .center-section {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 60px; /* Slight adj */

      .project-title {
        display: flex;
        align-items: center;
        gap: 15px;
        
        .logo-icon {
          font-size: 32px;
          color: var(--primary-color);
          animation: rotate 10s linear infinite;
        }

        .text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center; /* Center text too */
          
          .main-title {
            font-size: 24px;
            font-weight: bold;
            color: #fff;
            letter-spacing: 4px;
            text-shadow: 0 0 10px rgba(0, 246, 255, 0.5);
          }

          .sub-title {
            font-size: 10px;
            color: var(--primary-color);
            letter-spacing: 6px;
            opacity: 0.8;
            margin-top: 2px;
          }
        }
      }
    }
    
    .left-section {
      justify-content: flex-start;
      
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--primary-color);
        letter-spacing: 2px;
        margin-left: 20px;

        .dot {
          width: 8px;
          height: 8px;
          background-color: #00ff9d;
          border-radius: 50%;
          box-shadow: 0 0 5px #00ff9d;
          
          &.pulsing {
            animation: pulse 2s infinite;
          }
        }
      }
    }

    .right-section {
      justify-content: flex-end;
      gap: 30px;

      .weather-box {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 14px;

        .icon { font-size: 18px; }
        .temp { color: #fff; font-weight: bold; }
      }

      .time-box {
        font-size: 18px;
        font-weight: bold;
        color: var(--primary-color);
        text-shadow: 0 0 5px rgba(0, 246, 255, 0.5);
      }
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}
</style>