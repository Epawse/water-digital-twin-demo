<template>
  <div class="CesiumMap" id="cesiumContainer"></div>
  <ShowLngLat ref="ShowLngLatRef" />
</template>

<script lang="ts">
import { GController } from '@/utils/ctrlCesium/Controller'
import { getBaseMapConfig, getBaseMapImageryList } from '@/utils/getFormatData/BaseMap'
import ShowLngLat from '@/components/ShowLngLat.vue'
import Titleset from '@/utils/ctrlCesium/Titleset'
import Manager from '@/utils/ctrlCesium/effects/Manager'
import Primitive from '@/utils/ctrlCesium/model/Primitive'
import RoadNetwork from '@/utils/ctrlCesium/lines/RoadNetwork'
import { defineComponent, onBeforeMount, nextTick, ref, onUnmounted } from 'vue'
declare const Cesium: any

export default defineComponent({
  name: 'CesiumMap',
  components: { ShowLngLat },
  props: {
    enableExtras: { type: Boolean, default: false } // 是否加载默认的 3D tiles/特效/道路
  },
  setup(props) {
    let viewer = null
    const ShowLngLatRef = ref()

    const initMap = (BaseMapConfig:any, MapImageryList:any) => {
      if (!document.getElementById('cesiumContainer')) return
      
      viewer = GController.init(BaseMapConfig, MapImageryList)
      window.Gviewer = viewer
      
      if (ShowLngLatRef.value) {
        ShowLngLatRef.value.initCesiumHandler(viewer)
      }

      // 可选加载重型资源（Tileset/特效/道路），默认关闭以避免性能占用
      if (props.enableExtras) {
        const GTitleset = new Titleset(viewer)
        GTitleset.init()

        const GPrimitive = new Primitive(viewer)
        GPrimitive.init()

        const GManager = new Manager(viewer)
        GManager.init()

        const GRoadNetwork = new RoadNetwork(viewer, 'road')
        GRoadNetwork.init()
      }
    }

    onBeforeMount(() => {
      nextTick(async () => {
        const BaseMapConfig:any = await getBaseMapConfig()
        const MapImageryList:any = await getBaseMapImageryList()
        initMap(BaseMapConfig, MapImageryList)
      })
    })
    
    onUnmounted(() => {
       // Cleanup if necessary, though Cesium is heavy and usually persists
    })

    return { ShowLngLatRef }
  },
})
</script>

<style scoped>
.CesiumMap {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}
</style>
