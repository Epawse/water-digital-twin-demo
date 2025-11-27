<template>
	<PannelBox title="降雨监测">
		<template v-slot:content>
			<div class="rain-panel">
				<div v-if="isLoading" class="loading-state">
					<div class="spinner"></div>
					<span>加载中...</span>
				</div>
				<div v-else-if="errorMessage" class="error-state">
					<span>{{ errorMessage }}</span>
				</div>
				<div v-else>
					<div class="summary-row">
						<div class="summary-item">
							<span class="label">今日平均</span>
							<span class="value">{{ avgRainfall.toFixed(1) }} mm</span>
						</div>
						<div class="summary-item">
							<span class="label">当前总计</span> <!-- Changed from 累计降雨 as it sums latest readings -->
							<span class="value">{{ totalCurrentRainfall.toFixed(1) }} mm</span>
						</div>
					</div>
					<div class="station-list">
						<div class="station-item" v-for="station in rainfallData" :key="station.station_name"
							@click="$emit('locate', station.station_name)">
							<span class="name">
								{{ station.station_name }}
								<span v-if="station.data_source" class="source-tag" :class="station.data_source">
									{{ station.data_source === 'real' ? '实' : '模' }}
								</span>
							</span>
							<span class="value" :class="{ warning: station.is_warning }">
								{{ station.latest_rainfall }} {{ station.unit }}
							</span>
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
import { fetchRainfallData, RainfallReading } from '@/api/backend'

defineEmits(['locate'])

const rainfallData = ref<RainfallReading[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  try {
    const data = await fetchRainfallData();
    rainfallData.value = data;
  } catch (e) {
    errorMessage.value = "加载失败";
  } finally {
    isLoading.value = false;
  }
});

const avgRainfall = computed(() => {
	if (rainfallData.value.length === 0) return 0;
	const total = rainfallData.value.reduce((sum, s) => sum + (s.latest_rainfall || 0), 0)
	return total / rainfallData.value.length
})

const totalCurrentRainfall = computed(() => {
	if (rainfallData.value.length === 0) return 0;
	// Summing latest readings for "current total" as cumulative is not directly available
	return rainfallData.value.reduce((sum, s) => sum + (s.latest_rainfall || 0), 0)
})
</script>

<style lang="scss" scoped>
.rain-panel {
	.summary-row {
		display: flex;
		justify-content: space-around;
		margin-bottom: 15px;
		padding-bottom: 10px;
		border-bottom: 1px solid rgba(0, 246, 255, 0.2);

		.summary-item {
			text-align: center;

			.label {
				display: block;
				font-size: 12px;
				color: #888;
				margin-bottom: 5px;
			}

			.value {
				display: block;
				font-size: 20px;
				font-weight: bold;
				color: #00f6ff;
			}
		}
	}

	.station-list {
		max-height: 150px;
		overflow-y: auto;

		.station-item {
			display: flex;
			justify-content: space-between;
			padding: 8px 5px;
			cursor: pointer;
			border-radius: 4px;
			transition: background 0.2s;

			&:hover {
				background: rgba(0, 246, 255, 0.1);
			}

			.name {
				color: #ccc;
				font-size: 13px;
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

			.value {
				color: #00ff00;
				font-weight: bold;

				&.warning {
					color: #ffff00;
				}
			}
		}
	}
}

.loading-state, .error-state {
    height: 150px;
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
