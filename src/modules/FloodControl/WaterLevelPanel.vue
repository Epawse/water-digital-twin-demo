<template>
	<PannelBox title="水库水位监测">
		<template v-slot:content>
			<div class="water-level-panel">
				<div v-if="isLoading" class="loading-state">
					<div class="spinner"></div>
					<span>加载中...</span>
				</div>
				<div v-else-if="errorMessage" class="error-state">
					<span>{{ errorMessage }}</span>
				</div>
				<div v-else class="station-list">
					<div class="station-item" v-for="station in waterLevels" :key="station.station_name"
						@click="$emit('locate', station.station_name)">
						<div class="station-header">
							<span class="name">
								{{ station.station_name }}
								<span v-if="station.data_source" class="source-tag" :class="station.data_source">
									{{ station.data_source === 'real' ? '实测' : '模拟' }}
								</span>
							</span>
							<span class="status-dot" :class="station.is_warning ? 'warning' : 'normal'"></span>
						</div>
						<div class="station-data">
							<div class="data-row">
								<span class="label">水位</span>
								<span class="value" :class="station.is_warning ? 'warning' : 'normal'">{{ station.latest_level }} {{ station.unit }}</span>
							</div>
							<!-- Inflow/Outflow are not directly available from the current backend API, keeping for layout -->
							<div class="data-row">
								<span class="label">入库</span>
								<span class="value small">N/A</span> 
							</div>
							<div class="data-row">
								<span class="label">出库</span>
								<span class="value small">N/A</span>
							</div>
						</div>
						<div class="progress-bar">
							<div class="progress-fill" :style="{ width: getWaterPercent(station) + '%' }"
								:class="station.is_warning ? 'warning' : 'normal'"></div>
						</div>
					</div>
				</div>
			</div>
		</template>
	</PannelBox>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import PannelBox from '@/components/PannelBox.vue'
import { fetchWaterLevels, WaterLevelReading } from '@/api/backend'

defineEmits(['locate'])

const waterLevels = ref<WaterLevelReading[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  try {
    const data = await fetchWaterLevels();
    waterLevels.value = data;
  } catch (e) {
    errorMessage.value = "加载失败";
  } finally {
    isLoading.value = false;
  }
});

const getWaterPercent = (station: WaterLevelReading) => {
	if (!station.latest_level || !station.guarantee_level) return 0; // Default to 0 if data not available
    const percent = (station.latest_level / station.guarantee_level) * 100;
	return Math.min(percent, 100); // Cap at 100%
}
</script>

<style lang="scss" scoped>
.water-level-panel {
	.station-list {
		max-height: 400px;
		overflow-y: auto;

		.station-item {
			padding: 12px;
			margin-bottom: 10px;
			background: rgba(0, 30, 60, 0.5);
			border-radius: 6px;
			border: 1px solid rgba(0, 246, 255, 0.2);
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				border-color: rgba(0, 246, 255, 0.5);
				transform: translateY(-2px);
			}

			.station-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10px;

				.name {
					color: #fff;
					font-weight: bold;
					font-size: 14px;
					display: flex;
					align-items: center;
					gap: 6px;
				}

				.source-tag {
					font-size: 10px;
					padding: 1px 4px;
					border-radius: 3px;
					transform: scale(0.9);
					
					&.real {
						background: rgba(0, 255, 0, 0.2);
						color: #00ff00;
						border: 1px solid rgba(0, 255, 0, 0.4);
					}
					
					&.simulated {
						background: rgba(0, 246, 255, 0.2);
						color: #00f6ff;
						border: 1px solid rgba(0, 246, 255, 0.4);
					}
				}

				.status-dot {
					width: 10px;
					height: 10px;
					border-radius: 50%;

					&.normal {
						background: #00ff00;
						box-shadow: 0 0 6px #00ff00;
					}

					&.warning {
						background: #ffff00;
						box-shadow: 0 0 6px #ffff00;
						animation: pulse 1s infinite;
					}

					&.danger {
						background: #ff0000;
						box-shadow: 0 0 6px #ff0000;
						animation: pulse 0.5s infinite;
					}
				}
			}

			.station-data {
				display: flex;
				justify-content: space-between;
				margin-bottom: 8px;

				.data-row {
					text-align: center;

					.label {
						display: block;
						font-size: 11px;
						color: #666;
						margin-bottom: 3px;
					}

					.value {
						font-size: 16px;
						font-weight: bold;

						&.normal {
							color: #00f6ff;
						}

						&.warning {
							color: #ffff00;
						}

						&.danger {
							color: #ff0000;
						}

						&.small {
							font-size: 13px;
							color: #00f6ff;
						}
					}
				}
			}

			.progress-bar {
				height: 4px;
				background: rgba(255, 255, 255, 0.1);
				border-radius: 2px;
				overflow: hidden;

				.progress-fill {
					height: 100%;
					border-radius: 2px;
					transition: width 0.3s;

					&.normal {
						background: linear-gradient(90deg, #00ff00, #00cc00);
					}

					&.warning {
						background: linear-gradient(90deg, #ffff00, #ffcc00);
					}

					&.danger {
						background: linear-gradient(90deg, #ff0000, #cc0000);
					}
				}
			}
		}
	}
}

@keyframes pulse {
	0%,
	100% {
		opacity: 1;
	}

	50% {
		opacity: 0.5;
	}
}

.loading-state, .error-state {
    height: 200px;
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
