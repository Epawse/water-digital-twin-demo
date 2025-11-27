import { http } from '../utils/http'
import { MockMapConfig, MockMapView, MockMapImageryList } from '../mock/baseMapData'
// import qs from 'qs'

// 获取地图配置信息
export const getMapConfig = (): any => {
  // return http.request('get', '/base/getMapConfig')
  return Promise.resolve(MockMapConfig)
}

// 获取地图初始化视角
export const getMapView = (): any => {
  // return http.request('get', '/base/getMapView')
  return Promise.resolve(MockMapView)
}

// 获取底图层级list
export const getMapImageryList = (): any => {
  // return http.request('get', '/base/getMapImageryList')
  return Promise.resolve(MockMapImageryList)
}

// 设置地图初始化视角
export const setMapView = (data: any): any => {
  console.log('Mock setMapView', data)
  return Promise.resolve({ code: 200, msg: 'Mock success' })
  // return http.post('/base/setMapView', data)
}
