/**
 * 站点标注管理器
 * 负责在 Cesium 地图上创建和管理水利站点标注
 */

import { SimStations, Station, XinjiangCenter } from '@/mock/simData'

declare const Cesium: any

export class StationMarkerManager {
  private viewer: any
  private entities: any[] = []
  private selectedEntity: any = null

  constructor(viewer: any) {
    this.viewer = viewer
  }

  /**
   * 初始化：添加所有站点标注
   */
  init() {
    this.addAllStations()
    this.setupClickHandler()
    this.flyToXinjiang()
  }

  /**
   * 飞行到新疆区域
   */
  flyToXinjiang() {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        XinjiangCenter.lng,
        XinjiangCenter.lat,
        XinjiangCenter.height
      ),
      duration: 2.0
    })
  }

  /**
   * 添加所有站点
   */
  addAllStations() {
    SimStations.forEach(station => {
      this.addStation(station)
    })
  }

  /**
   * 添加单个站点
   */
  addStation(station: Station) {
    const color = this.getStatusColor(station.status)
    const icon = this.getTypeIcon(station.type)
    
    const entity = this.viewer.entities.add({
      id: station.id,
      name: station.name,
      position: Cesium.Cartesian3.fromDegrees(station.lng, station.lat, 0),
      point: {
        pixelSize: 12,
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: station.name,
        font: '14px Microsoft YaHei',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: new Cesium.Color(0, 0, 0, 0.6)
      },
      properties: station
    })

    this.entities.push(entity)
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'danger':
        return Cesium.Color.RED
      case 'warning':
        return Cesium.Color.YELLOW
      default:
        return Cesium.Color.fromCssColorString('#00FF00')
    }
  }

  getTypeIcon(type: string) {
    switch (type) {
      case 'reservoir':
        return '🏊'
      case 'hydrological':
        return '📊'
      case 'rain':
        return '🌧️'
      default:
        return '📍'
    }
  }

  setupClickHandler() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas)
    
    handler.setInputAction((click: any) => {
      const pickedObject = this.viewer.scene.pick(click.position)
      
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id
        const station = entity.properties as Station
        
        if (station) {
          this.showStationInfo(entity, station)
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction((movement: any) => {
      const pickedObject = this.viewer.scene.pick(movement.endPosition)
      
      if (this.selectedEntity && this.selectedEntity.point) {
        this.selectedEntity.point.pixelSize = 12
      }
      
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.point) {
        this.selectedEntity = pickedObject.id
        this.selectedEntity.point.pixelSize = 18
        this.viewer.canvas.style.cursor = 'pointer'
      } else {
        this.selectedEntity = null
        this.viewer.canvas.style.cursor = 'default'
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
  }

  showStationInfo(entity: any, station: Station) {
    this.viewer.selectedEntity = entity
    
    let description = `
      <div style="padding: 10px; font-family: Microsoft YaHei;">
        <h3 style="margin: 0 0 10px 0; color: #00f6ff;">${station.name}</h3>
        <p style="color: #aaa; margin: 5px 0;">${station.description || ''}</p>
        <hr style="border-color: #333;">
        <table style="width: 100%; color: #fff;">
    `

    if (station.type === 'reservoir') {
      const statusText = station.status === 'danger' ? '⚠️ 超保证' : 
                         station.status === 'warning' ? '⚡ 超警戒' : '✅ 正常'
      description += `
        <tr><td>当前水位:</td><td style="color: ${this.getStatusHtmlColor(station.status)}">${station.waterLevel} m</td></tr>
        <tr><td>警戒水位:</td><td>${station.warningLevel} m</td></tr>
        <tr><td>保证水位:</td><td>${station.guaranteeLevel} m</td></tr>
        <tr><td>总库容:</td><td>${station.capacity}</td></tr>
        <tr><td>入库流量:</td><td>${station.inflow} m³/s</td></tr>
        <tr><td>出库流量:</td><td>${station.outflow} m³/s</td></tr>
        <tr><td>运行状态:</td><td>${statusText}</td></tr>
      `
    } else if (station.type === 'hydrological') {
      description += `
        <tr><td>当前水位:</td><td style="color: ${this.getStatusHtmlColor(station.status)}">${station.waterLevel} m</td></tr>
        <tr><td>警戒水位:</td><td>${station.warningLevel} m</td></tr>
        <tr><td>状态:</td><td>${station.status === 'warning' ? '⚡ 偏高' : '✅ 正常'}</td></tr>
      `
    } else if (station.type === 'rain') {
      description += `
        <tr><td>今日降雨:</td><td style="color: ${station.rainfall! > 20 ? '#ffff00' : '#00ff00'}">${station.rainfall} mm</td></tr>
        <tr><td>累计降雨:</td><td>${station.rainfallTotal} mm</td></tr>
        <tr><td>状态:</td><td>${station.status === 'warning' ? '🌧️ 降雨偏多' : '✅ 正常'}</td></tr>
      `
    }

    description += `
        </table>
      </div>
    `

    entity.description = description
  }

  getStatusHtmlColor(status: string) {
    switch (status) {
      case 'danger':
        return '#ff0000'
      case 'warning':
        return '#ffff00'
      default:
        return '#00ff00'
    }
  }

  filterByType(type: string | null) {
    this.entities.forEach(entity => {
      if (type === null) {
        entity.show = true
      } else {
        const station = entity.properties as Station
        entity.show = station.type === type
      }
    })
  }

  filterByStatus(status: string | null) {
    this.entities.forEach(entity => {
      if (status === null) {
        entity.show = true
      } else {
        const station = entity.properties as Station
        entity.show = station.status === status
      }
    })
  }

  flyToStation(stationId: string) {
    const entity = this.entities.find(e => e.id === stationId)
    if (entity) {
      this.viewer.flyTo(entity, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, -45, 50000)
      })
    }
  }

  clear() {
    this.entities.forEach(entity => {
      this.viewer.entities.remove(entity)
    })
    this.entities = []
  }

  destroy() {
    this.clear()
  }
}
