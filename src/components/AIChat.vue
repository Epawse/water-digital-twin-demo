<template>
  <div class="ai-panel" :class="{ collapsed: isCollapsed }">
    <div class="header" @click="toggleCollapse">
      <div class="left">
        <div class="status-dot"></div>
        <span class="title">AI ASSISTANT</span>
      </div>
      <div class="toggle-icon">{{ isCollapsed ? '+' : '−' }}</div>
    </div>

    <div class="body" v-show="!isCollapsed" ref="chatBodyRef">
      <div class="messages-container">
        <div v-for="(msg, idx) in messages" :key="idx" class="msg-row" :class="msg.role">
          <div class="avatar" v-if="msg.role === 'ai'">🤖</div>
          <div class="bubble">
            {{ msg.text }}
          </div>
          <div class="avatar user" v-if="msg.role === 'user'">👤</div>
        </div>
      </div>
    </div>

    <div class="footer" v-show="!isCollapsed">
      <input 
        v-model="inputText" 
        @keyup.enter="sendMessage" 
        placeholder="指令输入 / Ask AI..." 
      />
      <button @click="sendMessage">SEND</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick } from 'vue';

interface Message { role: 'user' | 'ai'; text: string; }

export default defineComponent({
  name: 'AIChat',
  setup() {
    const isCollapsed = ref(false);
    const inputText = ref('');
    const chatBodyRef = ref<HTMLElement | null>(null);
    const messages = ref<Message[]>([
      { role: 'ai', text: 'System initialized. DeepSeek-R1 engine ready.' }
    ]);

    const toggleCollapse = () => isCollapsed.value = !isCollapsed.value;

    const scrollToBottom = () => {
      nextTick(() => {
        if (chatBodyRef.value) {
          const container = chatBodyRef.value.querySelector('.messages-container');
          if(container) container.scrollTop = container.scrollHeight;
        }
      });
    };

    const sendMessage = () => {
      if (!inputText.value.trim()) return;
      messages.value.push({ role: 'user', text: inputText.value });
      
      // Mock response
      const query = inputText.value;
      setTimeout(() => {
        let response = '正在计算...';
        if (query.includes('水位')) response = '监测到长江流域水位平稳 (23.5m).';
        else if (query.includes('告警')) response = '当前有 3 个活动告警，请检查概览面板.';
        else response = `收到指令: "${query}". 执行分析中...`;
        
        messages.value.push({ role: 'ai', text: response });
        scrollToBottom();
      }, 800);

      inputText.value = '';
      scrollToBottom();
    };

    return { isCollapsed, inputText, messages, toggleCollapse, sendMessage, chatBodyRef };
  }
});
</script>

<style lang="scss" scoped>
.ai-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 320px;
  background: var(--bg-panel);
  backdrop-filter: blur(15px);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: height 0.3s ease; /* Animate height instead of all */
  z-index: 200; /* High z-index */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  pointer-events: auto; /* Ensure clickable */

  /* Tech corner accents via simplified CSS (border-image or pseudo) */
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
    height: 40px !important; /* Header only */
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
    height: 250px;
    background: rgba(0, 0, 0, 0.3);
    position: relative;

    .messages-container {
      height: 100%;
      overflow-y: auto;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 15px;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
    }

    .msg-row {
      display: flex;
      gap: 10px;
      font-size: 12px;
      line-height: 1.4;

      .avatar {
        width: 24px; height: 24px;
        display: flex; justify-content: center; align-items: center;
        background: rgba(255,255,255,0.1);
        border-radius: 4px;
      }

      .bubble {
        padding: 8px 12px;
        border-radius: 4px;
        max-width: 80%;
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

      &:hover {
        background: rgba(0, 246, 255, 0.3);
      }
    }
  }
}
</style>