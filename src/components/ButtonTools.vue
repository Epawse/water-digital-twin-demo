<template>
  <div class="ButtonToolsContainer">
    <el-tooltip content="保存视角" placement="left" effect="dark">
      <div class="tool-btn" @click="save()" v-if="IsShow">
        <span class="icon">📷</span>
      </div>
    </el-tooltip>
    <!-- Add more mock tools for visual balance -->
    <el-tooltip content="图层管理" placement="left" effect="dark">
      <div class="tool-btn">
        <span class="icon">Layers</span>
      </div>
    </el-tooltip>
    <el-tooltip content="全屏" placement="left" effect="dark">
      <div class="tool-btn">
        <span class="icon">⛶</span>
      </div>
    </el-tooltip>
  </div>
</template>

<script lang="ts">
declare const Cesium: any
/* eslint-disable no-debugger */
import { defineComponent, onBeforeMount, ref } from 'vue'
import { getMapView, setMapView } from '@/api/base'
import { zipObject, map} from 'lodash'
import { ElMessageBox, ElMessage, ElTooltip } from 'element-plus'

export default defineComponent({
  name: 'ButtonTools',
  components: { ElTooltip },
  setup() {
    const IsShow = ref<boolean>(false)
    const FirstMapView = ref<any>()
    const save = () => {
      const camera:any = window.Gviewer.scene.camera
      const direction:any = camera.direction
      const up:any = camera.up
      const position:any = camera.position

      const ellipsoid = window.Gviewer.scene.globe.ellipsoid
      const cartesian3 = new Cesium.Cartesian3(position.x, position.y, position.z)
      const cartographic = ellipsoid.cartesianToCartographic(cartesian3)
      const lat = Cesium.Math.toDegrees(cartographic.latitude)
      const lng = Cesium.Math.toDegrees(cartographic.longitude)
      const height = cartographic.height

      ElMessageBox.confirm('提交保存此摄像头视图, 是否继续?', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(async () => {
          const { reData } = await setMapView({
            lat: lat,
            lng: lng,
            height: height,
            direction: direction,
            up: up
          })
          console.log(reData)
          ElMessage({
            type: 'success',
            message: '保存成功!',
          })
        })
        .catch((e:any ) => {
          console.log(e)
        })
    }
    const flyTo = async () => {
      FirstMapView.value = (await getMapView()).data
      FirstMapView.value = zipObject(
        map(FirstMapView.value, 'name'), map(FirstMapView.value, 'value')
      )
      IsShow.value = FirstMapView.value.showSaveButton === '1'

      if (FirstMapView.value.flytoView === '0') {
        return
      }

      const ellipsoidz = window.Gviewer.scene.globe.ellipsoid
      const cartographicz = Cesium.Cartographic.fromDegrees(
        parseFloat(FirstMapView.value.lng), parseFloat(FirstMapView.value.lat), parseFloat(FirstMapView.value.height))
      const cartesianXYZ = ellipsoidz.cartographicToCartesian(cartographicz)

      window.Gviewer.scene.camera.flyTo({
        destination: {
          x: cartesianXYZ.x,
          y: cartesianXYZ.y,
          z: cartesianXYZ.z,
        },
        orientation: {
          direction: new Cesium.Cartesian3(
            parseFloat(FirstMapView.value.direction_x),
            parseFloat(FirstMapView.value.direction_y),
            parseFloat(FirstMapView.value.direction_z)
          ),
          up: new Cesium.Cartesian3(
            parseFloat(FirstMapView.value.up_x),
            parseFloat(FirstMapView.value.up_y),
            parseFloat(FirstMapView.value.up_z)
          ),
        },
        duration: FirstMapView.value.duration, 
      })
    }
    onBeforeMount(() => {
    })
    return {
      IsShow, FirstMapView, save, flyTo
    }
  }
})
</script>

<style lang="scss" scoped>
.ButtonToolsContainer {
  position: absolute;
  top: 120px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 80;

  .tool-btn {
    width: 40px;
    height: 40px;
    background: rgba(5, 8, 21, 0.6);
    backdrop-filter: blur(5px);
    border: 1px solid var(--border-color);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    clip-path: polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%);

    &:hover {
      background: rgba(0, 246, 255, 0.2);
      box-shadow: 0 0 10px rgba(0, 246, 255, 0.3);
      transform: scale(1.1);
    }

    .icon {
      color: var(--primary-color);
      font-size: 18px;
    }
  }
}
</style>
