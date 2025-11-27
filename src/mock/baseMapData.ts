export const MockMapConfig = {
  data: [
    { name: 'animation', value: '0' },
    { name: 'timeline', value: '0' },
    { name: 'baseLayerPicker', value: '0' },
    { name: 'fullscreenButton', value: '0' },
    { name: 'infoBox', value: '0' },
    { name: 'homeButton', value: '0' },
    { name: 'geocoder', value: '0' },
    { name: 'sceneModePicker', value: '0' },
    { name: 'selectionIndicator', value: '0' },
    { name: 'logo', value: '0' }
  ]
}

export const MockMapView = {
  data: [
    { name: 'lat', value: '30.55' },
    { name: 'lng', value: '114.30' },
    { name: 'height', value: '200000' }, // Wuhan area, higher view
    { name: 'direction_x', value: '0' },
    { name: 'direction_y', value: '-0.9' }, // Tilted down
    { name: 'direction_z', value: '-0.1' },
    { name: 'up_x', value: '0' },
    { name: 'up_y', value: '0.1' },
    { name: 'up_z', value: '-0.9' },
    { name: 'flytoView', value: '1' },
    { name: 'duration', value: '3' },
    { name: 'showSaveButton', value: '1' }
  ]
}

// 水墨底图配置 - 使用高德地图 + 反色滤镜
// 这是原 map.217dan.com 返回的实际配置，现在直接内置在本地
export const MockMapImageryList = {
  data: [
    {
      // 高德地图作为水墨底图基础
      // 通过 invertswitch + filterRGB 实现水墨效果
      type: 'UrlTemplateImageryProvider',
      classConfig: {
        url: 'https://webst0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&style=7',
        subdomains: ['1', '2', '3', '4'],
        maximumLevel: 18
      },
      interfaceConfig: {
        saturation: 0.0,      // 饱和度
        brightness: 0.6,      // 亮度
        contrast: 1.8,        // 对比度
        hue: 1.0,             // 色相
        gamma: 0.3            // 伽马
      },
      offset: '0,0',
      invertswitch: true,     // 反色开关 - 水墨效果关键
      filterRGB: '#4e70a6'    // 滤镜颜色 - 蓝色调
    }
  ]
}

// 天地图配置（用于底图切换）
export const TiandituConfig = {
  vec: {
    type: 'UrlTemplateImageryProvider',
    classConfig: {
      url: 'https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=23cffd438607efdc57c79b679ac2bae9',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18
    }
  },
  cva: {
    type: 'UrlTemplateImageryProvider', 
    classConfig: {
      url: 'https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=23cffd438607efdc57c79b679ac2bae9',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18
    }
  }
}
