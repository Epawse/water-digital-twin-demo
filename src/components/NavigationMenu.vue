<template>
  <div class="nav-container">
    <div 
      class="nav-item" 
      v-for="(item, index) in menuItems" 
      :key="index"
      :class="{ active: activeIndex === index }"
      @click="handleSelect(index, item.path)"
    >
      <div class="selection-bar"></div>
      <div class="icon">{{ item.icon }}</div>
      <div class="label">{{ item.label }}</div>
      <div class="glow-bg"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export default defineComponent({
  name: 'NavigationMenu',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const activeIndex = ref(0);
    const menuItems = [
      { label: '综合态势', icon: '📊', path: '/' },
      { label: '洪水演进', icon: '🌊', path: '/flood' },
      { label: '降雨分析', icon: '🌧️', path: '/rainfall' },
      { label: '三维可视化', icon: '🛠️', path: '/visualization' },
      { label: '数据管理', icon: '🗂️', path: '/data' },
      { label: '配置中心', icon: '⚙️', path: '/titleset' },
    ];

    const setActiveByPath = (path: string) => {
      const idx = menuItems.findIndex(item => item.path === path);
      if (idx >= 0) activeIndex.value = idx;
    };

    setActiveByPath(route.path);
    watch(() => route.path, (p) => setActiveByPath(p));

    const handleSelect = (index: number, path: string) => {
      activeIndex.value = index;
      if (path) {
        router.push(path);
      }
    };

    return {
      menuItems,
      activeIndex,
      handleSelect
    };
  }
});
</script>

<style lang="scss" scoped>
.nav-container {
  position: absolute;
  top: 120px; /* Below header */
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 90;
  perspective: 1000px;
}

.nav-item {
  position: relative;
  width: 70px;
  height: 70px;
  background: rgba(5, 8, 21, 0.6);
  backdrop-filter: blur(5px);
  border: 1px solid var(--border-light);
  clip-path: polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%); /* Chamfered corners */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  /* Entrance animation */
  animation: slideInLeft 0.5s ease forwards;
  opacity: 0;
  
  @for $i from 1 through 6 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }

  .selection-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--primary-color);
    transform: scaleY(0);
    transition: transform 0.3s ease;
    transform-origin: center;
  }

  .icon {
    font-size: 26px;
    margin-bottom: 5px;
    z-index: 2;
    filter: grayscale(100%);
    transition: all 0.3s;
  }

  .label {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: bold;
    z-index: 2;
    transition: all 0.3s;
  }

  .glow-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at center, var(--primary-dim), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1;
  }

  &:hover {
    border-color: var(--primary-color);
    transform: translateX(5px) scale(1.05);
    box-shadow: 0 0 15px rgba(0, 246, 255, 0.2);

    .icon {
      filter: grayscale(0);
      transform: scale(1.1);
    }
    
    .label {
      color: #fff;
    }

    .glow-bg {
      opacity: 0.5;
    }
  }

  &.active {
    background: rgba(0, 246, 255, 0.1);
    border-color: var(--primary-color);
    box-shadow: inset 0 0 15px rgba(0, 246, 255, 0.2);

    .selection-bar {
      transform: scaleY(1);
    }

    .icon {
      filter: grayscale(0);
      color: var(--primary-color);
      text-shadow: 0 0 10px var(--primary-color);
    }

    .label {
      color: var(--primary-color);
    }
  }
}

@keyframes slideInLeft {
  from { transform: translateX(-50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
