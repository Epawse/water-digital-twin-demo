<template>
	<div class="test-container">
		<div id="cesiumContainer" class="cesium-container"></div>

		<div class="control-panel">
			<h3>后处理滤镜测试</h3>
			<el-form label-width="100px">
				<el-form-item label="开启滤镜">
					<el-switch v-model="filterState.enabled" @change="updateUniforms" />
				</el-form-item>
				<el-form-item label="滤镜颜色">
					<el-color-picker v-model="filterState.color" show-alpha @change="updateUniforms" />
				</el-form-item>
				<el-form-item label="预设主题">
					<div class="preset-colors">
						<span v-for="color in presetColors" :key="color" class="color-block" :style="{ background: color }"
							@click="applyPreset(color)"></span>
					</div>
				</el-form-item>
				<el-form-item label="底图样式">
					<el-radio-group v-model="mapState.type" @change="toggleBaseMap">
						<el-radio label="ink">水墨</el-radio>
						<el-radio label="tdt_vec">天地图矢量</el-radio>
						<el-radio label="tdt_ter">天地图地形</el-radio>
						<el-radio label="tdt_img">天地图影像</el-radio>
					</el-radio-group>
				</el-form-item>
			</el-form>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive } from 'vue'
import { GController } from '@/utils/ctrlCesium/Controller'
import { getBaseMapConfig, getBaseMapImageryList } from '@/utils/getFormatData/BaseMap'
import { colorRgb1 } from '@/utils/color'

declare const Cesium: any

const filterState = reactive({
	enabled: false,
	color: '#409EFF'
})

const mapState = reactive({
	type: 'ink'
})

let postProcessStage: any = null
const tdtKey = '23cffd438607efdc57c79b679ac2bae9'
let tdtLayers: any[] = [] // 存储当前添加的天地图图层
let originalLayers: any[] = [] // 存储初始化的图层(水墨)

const presetColors = [
	'#4E70A6', // 默认蓝 (rgb(78, 112, 166))
	'#409EFF', // 亮蓝
	'#00FFFF', // 赛博青
	'#001529', // 深空蓝
	'#1A237E', // 科技深蓝
	'#26C6DA', // 亮青 (替代原墨绿)
]

const applyPreset = (color: string) => {
	filterState.color = color
	updateUniforms()
}

// 片元着色器代码
const fragmentShaderSource = `
  uniform sampler2D colorTexture;
  uniform bool u_enabled;
  uniform vec3 u_filterColor;
  uniform float u_exposure;
  uniform float u_contrast; // 新增：对比度控制
  varying vec2 v_textureCoordinates;

  void main() {
      vec4 color = texture2D(colorTexture, v_textureCoordinates);
      if (u_enabled) {
          // 1. 去色 (Grayscale)
          float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = vec3(gray);

          // 2. 反色 (Invert)
          color.r = 1.0 - color.r;
          color.g = 1.0 - color.g;
          color.b = 1.0 - color.b;
          
          // 3. 对比度增强 (Contrast)
          color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;

          // 4. 曝光增强 (Exposure)
          color.rgb *= u_exposure;

          // 5. 染色 (Tint)
          color.r = color.r * u_filterColor.r;
          color.g = color.g * u_filterColor.g;
          color.b = color.b * u_filterColor.b;
      }
      gl_FragColor = color;
  }
`

const updateUniforms = () => {
	if (postProcessStage) {
		postProcessStage.uniforms.u_enabled = filterState.enabled
		const rgb = Cesium.Color.fromCssColorString(filterState.color)
		postProcessStage.uniforms.u_filterColor = rgb

		// 根据底图类型动态调整参数
		if (mapState.type === 'tdt_vec' || mapState.type === 'tdt_ter') {
			postProcessStage.uniforms.u_exposure = 3.0
			postProcessStage.uniforms.u_contrast = 1.1
		} else if (mapState.type === 'ink') {
			// 水墨底图：增加曝光和对比度，使线条更鲜艳
			postProcessStage.uniforms.u_exposure = 1.0
			postProcessStage.uniforms.u_contrast = 1.2
		} else {
			postProcessStage.uniforms.u_exposure = 1.0
			postProcessStage.uniforms.u_contrast = 1.0
		}
	}
}

const toggleBaseMap = (val: string) => {
	const viewer = window.Gviewer
	if (!viewer) return

	// 1. 清除之前添加的天地图图层
	tdtLayers.forEach((layer: any) => {
		viewer.imageryLayers.remove(layer, true)
	})
	tdtLayers = []

	if (val === 'ink') {
		// 2. 显示原始图层
		originalLayers.forEach((layer: any) => {
			layer.show = true
		})
	} else {
		// 3. 隐藏原始图层
		originalLayers.forEach((layer: any) => {
			layer.show = false
		})

		// 4. 添加天地图图层
		let layersToAdd: string[] = []
		if (val === 'tdt_vec') layersToAdd = ['vec_w', 'cva_w'] // 矢量底图 + 矢量注记
		if (val === 'tdt_ter') layersToAdd = ['ter_w', 'cta_w'] // 地形晕渲 + 地形注记
		if (val === 'tdt_img') layersToAdd = ['img_w', 'cia_w'] // 影像底图 + 影像注记

		layersToAdd.forEach((layerName) => {
			// 使用 UrlTemplateImageryProvider 加载天地图 (XYZ 方式更稳定)
			const provider = new Cesium.UrlTemplateImageryProvider({
				url: `https://t{s}.tianditu.gov.cn/DataServer?T=${layerName}&x={x}&y={y}&l={z}&tk=${tdtKey}`,
				subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
				maximumLevel: 18
			})
			const layer = viewer.imageryLayers.addImageryProvider(provider)
			tdtLayers.push(layer)
		})
	}

	// 切换底图后，必须更新 Uniforms 以应用正确的曝光度
	updateUniforms()
}

onMounted(async () => {
	// 1. 获取配置
	const BaseMapConfig: any = await getBaseMapConfig()
	const MapImageryList: any = await getBaseMapImageryList()

	// 2. 提取原有的滤镜配置，并从列表中移除，防止 GController 自动应用旧的 Shader 注入
	if (MapImageryList.length > 0) {
		// 假设取第一个图层的配置作为默认值
		const layerConfig = MapImageryList.find((item: any) => item.invertswitch) || MapImageryList[0]

		if (layerConfig) {
			// 强制转换为布尔值，解决 "true" 字符串导致 Switch 显示异常的问题
			filterState.enabled = layerConfig.invertswitch === true || layerConfig.invertswitch === 'true'
			filterState.color = layerConfig.filterRGB || '#ffffff'

			// 禁用原有配置，防止 Controller.ts 进行 Shader 注入
			MapImageryList.forEach((item: any) => {
				item.invertswitch = false
			})
		}
	}

	// 3. 初始化地图 (使用原有的 Controller)
	const viewer = GController.init(BaseMapConfig, MapImageryList)
	window.Gviewer = viewer

	// 确保相机视角在合适的位置 (飞向中国)
	viewer.camera.flyTo({
		destination: Cesium.Cartesian3.fromDegrees(108.0, 32.0, 10000000.0),
		duration: 0
	})

	// 保存原始图层引用
	const len = viewer.imageryLayers.length
	for (let i = 0; i < len; i++) {
		originalLayers.push(viewer.imageryLayers.get(i))
	}

	// 4. 创建并添加后处理阶段
	postProcessStage = new Cesium.PostProcessStage({
		fragmentShader: fragmentShaderSource,
		uniforms: {
			u_enabled: filterState.enabled,
			u_filterColor: Cesium.Color.fromCssColorString(filterState.color),
			u_exposure: 1.0, // 默认曝光度
			u_contrast: 1.0  // 默认对比度
		}
	})

	viewer.scene.postProcessStages.add(postProcessStage)

	// 初始化时更新一次 Uniforms，确保曝光度正确
	updateUniforms()
})
</script>

<style lang="scss" scoped>
.test-container {
	position: relative;
	width: 100%;
	height: 100vh;

	.cesium-container {
		width: 100%;
		height: 100%;
	}

	.control-panel {
		position: absolute;
		top: 20px;
		left: 20px;
		width: 300px;
		background: rgba(0, 0, 0, 0.7);
		padding: 20px;
		border-radius: 8px;
		color: white;
		z-index: 100;

		h3 {
			margin-top: 0;
			margin-bottom: 20px;
			color: #fff;
		}

		:deep(.el-form-item__label) {
			color: #fff;
		}

		.preset-colors {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;

			.color-block {
				width: 24px;
				height: 24px;
				border-radius: 4px;
				cursor: pointer;
				border: 1px solid rgba(255, 255, 255, 0.3);
				transition: transform 0.2s;

				&:hover {
					transform: scale(1.1);
					border-color: #fff;
				}
			}
		}
	}
}
</style>
