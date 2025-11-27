<template>
	<PannelBox title="预警信息">
		<template v-slot:content>
			<div class="warning-panel">
				<div v-if="isLoading" class="loading-state">
					<div class="spinner"></div>
					<span>加载中...</span>
				</div>
				<div v-else-if="errorMessage" class="error-state">
					<span>{{ errorMessage }}</span>
				</div>
				<div v-else>
					<div class="warning-count">
						<span class="count danger">{{ dangerCount }}</span>
						<span class="label">红色预警</span>
						<span class="count warning">{{ warningCount }}</span>
						<span class="label">黄色预警</span>
					</div>
					<div class="warning-list">
						<div class="warning-item" v-for="item in warnings" :key="item.id"
							:class="item.level.toLowerCase()" @click="$emit('locate', item.file_path || item.id)">
							<span class="icon">{{ item.level === 'Red' ? '🔴' : '🟡' }}</span>
							<span class="name">
								{{ item.message.split(':')[0] }}
								<span v-if="item.data_source" class="source-tag" :class="item.data_source">
									{{ item.data_source === 'real' ? '实' : '模' }}
								</span>
							</span> <!-- Extract name from message for display -->
							<span class="message">{{ item.message }}</span>
						</div>
						<div class="no-warning" v-if="warnings.length === 0">
							<span>✅ 暂无预警</span>
						</div>
					</div>
				</div>
			</div>
		</template>
	</PannelBox>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import PannelBox from '@/components/PannelBox.vue'
import { fetchWarnings, WarningItem } from '@/api/backend'

defineEmits(['locate'])

const warnings = ref<WarningItem[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  try {
    const data = await fetchWarnings();
    warnings.value = data;
  } catch (e) {
    errorMessage.value = "加载失败";
  } finally {
    isLoading.value = false;
  }
});

const dangerCount = computed(() => {
	return warnings.value.filter(w => w.level === 'Red').length
})

const warningCount = computed(() => {
	return warnings.value.filter(w => w.level === 'Yellow').length
})
</script>

<style lang="scss" scoped>
.warning-panel {
	.warning-count {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-bottom: 15px;
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(0, 246, 255, 0.2);

		.count {
			font-size: 24px;
			font-weight: bold;

			&.danger {
				color: #ff0000;
			}

			&.warning {
				color: #ffff00;
			}
		}

		.label {
			font-size: 12px;
			color: #888;
			margin-right: 15px;
		}
	}

	.warning-list {
		max-height: 180px;
		overflow-y: auto;

		.warning-item {
			display: flex;
			align-items: center;
			padding: 10px 8px;
			margin-bottom: 5px;
			border-radius: 4px;
			cursor: pointer;
			transition: all 0.2s;

			&.red {
				background: rgba(255, 0, 0, 0.15);
				border-left: 3px solid #ff0000;
			}

			&.yellow {
				background: rgba(255, 255, 0, 0.1);
				border-left: 3px solid #ffff00;
			}
            
            &.blue { /* Assuming blue warning level */
                background: rgba(0, 0, 255, 0.1);
                border-left: 3px solid #0000ff;
            }

			&:hover {
				transform: translateX(3px);
			}

			.icon {
				margin-right: 8px;
			}

			.name {
				color: #fff;
				font-weight: bold;
				margin-right: 10px;
				white-space: nowrap;
				display: flex;
				align-items: center;
				gap: 4px;
			}

			.source-tag {
				font-size: 9px;
				padding: 0 3px;
				border-radius: 2px;
				
				&.real {
					background: rgba(0, 255, 0, 0.2);
					color: #00ff00;
					border: 1px solid rgba(0, 255, 0, 0.3);
				}
				
				&.simulated {
					background: rgba(0, 246, 255, 0.2);
					color: #00f6ff;
					border: 1px solid rgba(0, 246, 255, 0.3);
				}
			}

			.message {
				color: #aaa;
				font-size: 12px;
				flex: 1;
				text-align: right;
			}
		}

		.no-warning {
			text-align: center;
			padding: 20px;
			color: #00ff00;
		}
	}
}

.loading-state, .error-state {
    height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
}

.error-state {
    color: #ff4d4f;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0, 246, 255, 0.3);
    border-top-color: #00f6ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
