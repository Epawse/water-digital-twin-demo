import { getMapConfig, getMapImageryList } from '@/api/base'
import { zipObject, map, forIn } from 'lodash'

export async function getBaseMapConfig(): Promise<any> {
  let res: any = await getMapConfig()
  res = res.data
  res = zipObject(map(res, 'name'), map(res, 'value'))
  forIn(res, (value: any, index: any) => {
    res[index] = value === '1'
  })
  return res
}
export async function getBaseMapImageryList(): Promise<any> {
  let res: any = await getMapImageryList()
  res = res.data
  res.some((elem: any, index: any) => {
    // Handle both stringified JSON (from legacy API) and direct Objects (from Mock)
    if (typeof elem.classConfig === 'string') {
      res[index].classConfig = JSON.parse(elem.classConfig)
    }
    
    if (typeof elem.interfaceConfig === 'string' && elem.interfaceConfig !== '') {
      res[index].interfaceConfig = JSON.parse(elem.interfaceConfig)
    } else if (!elem.interfaceConfig) {
      res[index].interfaceConfig = []
    }

    forIn(res[index].interfaceConfig, (v: any, i: any) => {
      if (isNaN(parseFloat(v))) {
        res[index].interfaceConfig[i] = v === 'true'
      }
      else {
        res[index].interfaceConfig[i] = parseFloat(v)
      }
    })
  })
  return res
}
