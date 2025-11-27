<template>
	<PannelBox title="降雨监测">
		<template v-slot:content>
			<div class="rain-panel">
				<div class="summary-row">
					<div class="summary-item">
						<span class="label">今日平均</span>
						<span class="value">{{ avgRainfall.toFixed(1) }} mm</span>
					</div>
					<div class="summary-item">
						<span class="label">累计降雨</span>
						<span class="value">{{ totalRainfall.toFixed(0) }} mm</span>
					</div>
				</div>
				<div class="station-list">
					<div class="station-item" v-for="station in rainStations" :key="station.id"
						@click="$emit('locate', station.id)">
						<span class="name">{{ station.name }}</span>
						<span class="value" :class="{ warning: station.rainfall > 20 }">
							{{ station.rainfall }} mm
						</span>
					</div>
				</div>
			</div>
		</template>
	</PannelBox>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import PannelBox from '@/components/PannelBox.vue'
import { RainStations } from '@/mock/simData'

defineEmits(['locate'])

const rainStations = RainStations

const avgRainfall = computed(() => {
	const total = RainStations.reduce((sum, s) => sum + (s.rainfall || 0), 0)
	return total / RainStations.length
})

const totalRainfall = computed(() => {
	return RainStations.reduce((sum, s) => sum + (s.rainfallTotal || 0), 0) / RainStations.length
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
</style>
