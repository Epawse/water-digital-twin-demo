<template>
  <div class="PannelBoxContainer">
    <div class="panel-title" v-if="title">
      <span class="title-icon">◆</span>
      <span class="title-text">{{ title }}</span>
    </div>
    <div class="content">
      <slot name="content" />
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'PannelBox',
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.PannelBoxContainer {
  min-width: 320px;
  background: rgba(8, 5, 32, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(67, 199, 248, 0.3);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(67, 199, 248, 0.5);
  }

  .panel-title {
    padding: 12px 15px;
    background: linear-gradient(90deg, rgba(0, 246, 255, 0.15), transparent);
    border-bottom: 1px solid rgba(67, 199, 248, 0.2);
    display: flex;
    align-items: center;

    .title-icon {
      color: #00f6ff;
      margin-right: 8px;
      font-size: 12px;
    }

    .title-text {
      color: #00f6ff;
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 1px;
    }
  }

  .content {
    padding: 15px;
    color: #fff;
  }
}
</style>

