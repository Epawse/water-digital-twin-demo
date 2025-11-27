<template>
  <div class="global-layout">
    <!-- 1. The Map (Base Layer) -->
    <CesiumMap :enableExtras="false" />

    <!-- 2. Global UI Overlay -->
    <div class="ui-overlay">
      <MainHeader />
      <NavigationMenu />
      <AIChat />

      <!-- 全局告警通知 -->
      <AlertNotification ref="globalAlertRef" />

      <!-- Slot for Page Specific Content -->
      <div class="page-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import CesiumMap from '@/components/CesiumMap.vue'
import MainHeader from '@/components/MainHeader.vue'
import NavigationMenu from '@/components/NavigationMenu.vue'
import AIChat from '@/components/AIChat.vue'
import AlertNotification from '@/components/AlertNotification.vue'

export default defineComponent({
  name: 'GlobalLayout',
  components: {
    CesiumMap,
    MainHeader,
    NavigationMenu,
    AIChat,
    AlertNotification
  },
  setup() {
    const globalAlertRef = ref<InstanceType<typeof AlertNotification> | null>(null)
    return { globalAlertRef }
  }
})
</script>

<style lang="scss" scoped>
.global-layout {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #000;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allow clicks through to map */
  z-index: 10;

  /* Re-enable pointer events for interactive children */
  :deep(.main-header), 
  :deep(.nav-container), 
  :deep(.ai-panel) {
    pointer-events: auto;
  }
}

.page-content {
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let map be interactive */
}
</style>
