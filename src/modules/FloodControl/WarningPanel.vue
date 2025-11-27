<template>
	<PannelBox title="预警信息">
		<template v-slot:content>
			<div class="warning-panel">
				<div class="warning-count">
					<span class="count danger">{{ dangerCount }}</span>
					<span class="label">红色预警</span>
					<span class="count warning">{{ warningCount }}</span>
					<span class="label">黄色预警</span>
				</div>
				<div class="warning-list">
					<div class="warning-item" v-for="station in warningStations" :key="station.id"
						:class="station.status" @click="$emit('locate', station.id)">
						<span class="icon">{{ station.status === 'danger' ? '🔴' : '🟡' }}</span>
						<span class="name">{{ station.name }}</span>
						<span class="message">{{ getWarningMessage(station) }}</span>
					</div>
					<div class="no-warning" v-if="warningStations.length === 0">
						<span>✅ 暂无预警</span>
					</div>
				</div>
			</div>
		</template>
	</PannelBox>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import PannelBox from '@/components/PannelBox.vue'
import { SimStations, Station, WarningStations } from '@/mock/simData'

defineEmits(['locate'])

const warningStations = computed(() => {
	return WarningStations
})

const dangerCount = computed(() => {
	return SimStations.filter(s => s.status === 'danger').length
})

const warningCount = computed(() => {
	return SimStations.filter(s => s.status === 'warning').length
})

const getWarningMessage = (station: Station) => {
	if (station.type === 'reservoir' || station.type === 'hydrological') {
		if (station.status === 'danger') {
			return `水位 ${station.waterLevel}m 超保证`
		} else {
			return `水位 ${station.waterLevel}m 超警戒`
		}
	} else if (station.type === 'rain') {
		return `降雨量 ${station.rainfall}mm 偏多`
	}
	return ''
}
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

			&.danger {
				background: rgba(255, 0, 0, 0.15);
				border-left: 3px solid #ff0000;
			}

			&.warning {
				background: rgba(255, 255, 0, 0.1);
				border-left: 3px solid #ffff00;
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
</style>
