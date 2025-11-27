<template>
	<PannelBox title="水库水位监测">
		<template v-slot:content>
			<div class="water-level-panel">
				<div class="station-list">
					<div class="station-item" v-for="station in reservoirs" :key="station.id"
						@click="$emit('locate', station.id)">
						<div class="station-header">
							<span class="name">{{ station.name }}</span>
							<span class="status-dot" :class="station.status"></span>
						</div>
						<div class="station-data">
							<div class="data-row">
								<span class="label">水位</span>
								<span class="value" :class="station.status">{{ station.waterLevel }} m</span>
							</div>
							<div class="data-row">
								<span class="label">入库</span>
								<span class="value small">{{ station.inflow }} m³/s</span>
							</div>
							<div class="data-row">
								<span class="label">出库</span>
								<span class="value small">{{ station.outflow }} m³/s</span>
							</div>
						</div>
						<div class="progress-bar">
							<div class="progress-fill" :style="{ width: getWaterPercent(station) + '%' }"
								:class="station.status"></div>
						</div>
					</div>
				</div>
			</div>
		</template>
	</PannelBox>
</template>

<script lang="ts" setup>
import PannelBox from '@/components/PannelBox.vue'
import { ReservoirStations, Station } from '@/mock/simData'

defineEmits(['locate'])

const reservoirs = ReservoirStations

const getWaterPercent = (station: Station) => {
	if (!station.waterLevel || !station.guaranteeLevel) return 50
	const percent = (station.waterLevel / station.guaranteeLevel) * 100
	return Math.min(percent, 100)
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
							color: #00ff00;
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
</style>
