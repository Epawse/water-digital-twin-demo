<!--
 * @Description: 
 * @Version: 1.668
 * @Autor: Hawk
 * @Date: 2021-06-29 09:01:28
 * @LastEditors: Hawk
 * @LastEditTime: 2021-08-18 10:48:16
-->
<template>
  <div class="ShowLngLatContainer">
    <span>lng:{{ lng }}</span> <span>lat:{{ lat }}</span>
  </div>
</template>

<script lang="ts">
declare const Cesium: any
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ShowLngLat',
  components: {},
  setup() {
    const lng = ref<number>()
    const lat = ref<number>()
    // let height = ref<number>(3.001)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const initCesiumHandler = (Viewer) => {
      const canvas = Viewer.scene.canvas
      const ellipsoid = Viewer.scene.globe.ellipsoid
      const handler = new Cesium.ScreenSpaceEventHandler(canvas)
      handler.setInputAction(function(movement) {
        const cartesian = Viewer.camera.pickEllipsoid(
          movement.endPosition,
          ellipsoid
        )
        if (cartesian) {
          const cartographic = Viewer.scene.globe.ellipsoid.cartesianToCartographic(
            cartesian
          )
          lat.value = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)
          lng.value = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)
          // height.value = (
          //   Viewer.camera.positionCartographic.height / 1000
          // ).toFixed(2)
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    }
    return {
      lng, lat, initCesiumHandler /* height */
    }
  }
})
</script>
<style lang="scss">
.distance-legend{
  right: 28px;
}
</style>
<style lang="scss" scoped>
.ShowLngLatContainer {
  position: absolute;
  bottom: 10px;
  left: 100px; /* Make space for left nav if needed, or just center it */
  padding: 5px 15px;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(4px);
  display: flex;
  gap: 15px;
  pointer-events: none;
  z-index: 50;

  span {
    display: flex;
    align-items: center;
    
    &::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #00f6ff;
      border-radius: 50%;
      margin-right: 6px;
      opacity: 0.7;
    }
  }
}
</style>
