import axios from 'axios';

const backendApi = axios.create({
  baseURL: '/api/backend', // Vite proxy will handle forwarding to FastAPI
  timeout: 10000,
});

export interface StationNode {
  label: string;
  type: 'directory' | 'file';
  path: string; // Relative path from data root
  extension?: string;
  children?: StationNode[];
}

export interface ExcelData {
  columns: string[];
  data: Record<string, any>[];
  meta: {
    filename: string;
    row_count: number;
  };
}

export interface WaterLevelReading {
  station_name: string;
  latest_level: number;
  unit: string;
  time: string;
  is_warning: boolean;
  file_path: string;
  guarantee_level?: number;
  data_source?: string;
}

export interface RainfallReading {
  station_name: string;
  latest_rainfall: number;
  unit: string;
  time: string;
  is_warning: boolean;
  file_path: string;
  data_source?: string;
}

export interface WarningItem {
  id: string;
  level: string;
  message: string;
  time: string;
  file_path?: string;
  data_source?: string;
}

export interface FloodEvent {
  id: string;
  name: string;
  severity: 'mild' | 'medium' | 'severe';
  level: 'red' | 'orange' | 'yellow' | 'blue';
  status: 'pending' | 'active' | 'resolved';
  start: string;
  end: string;
  region: string;
  basin: string;
  center: { lng: number; lat: number };
  affectedArea: number;
  description: string;
  products: {
    inundationGeoJson: string;
    waterSurfaceTileset: string;
    rainGrid: string;
    timeSteps: number;
  };
}

export interface RainGridFrame {
  id: string;
  time: string;
  grid: string;
  coverage: string;
}

export interface IoTDevice {
  id: string;
  name: string;
  protocol: string;
  stationId: string;
  metrics: string[];
  freqSec: number;
  status: 'online' | 'offline';
  note?: string;
}

export interface ThreeDResource {
  id: string;
  name: string;
  source: string;
  tilesetUrl: string;
  target: { lng: number; lat: number; height: number };
  note?: string;
}

export interface SensorItem {
  id: number;
  code: string;
  section_id: number;
  sensor_type_id?: number;
  is_simulated: boolean;
  lng?: number;
  lat?: number;
}

export interface SensorMetricItem {
  id: number;
  metric_key: string;
  name_cn?: string;
  unit?: string;
  warn_low?: number;
  warn_high?: number;
  is_simulated: boolean;
}

export interface ReadingItem {
  id: number;
  sensor_id: number;
  metric_id: number;
  reading_time?: string;
  value_num?: number;
  unit?: string;
  is_simulated: boolean;
}

/**
 * 获取监测站点的目录结构
 */
export async function fetchStationsTree(): Promise<StationNode[]> {
  try {
    const response = await backendApi.get<StationNode[]>('/stations');
    return response.data;
  } catch (error) {
    console.error('Error fetching station tree:', error);
    return [];
  }
}

export async function fetchFloodEvents(): Promise<FloodEvent[]> {
  try {
    const response = await backendApi.get<FloodEvent[]>('/events');
    return response.data;
  } catch (error) {
    console.error('Error fetching flood events:', error);
    return [];
  }
}

export async function fetchRainGridFrames(): Promise<RainGridFrame[]> {
  try {
    const response = await backendApi.get<RainGridFrame[]>('/rain_frames');
    return response.data;
  } catch (error) {
    console.error('Error fetching rain grid frames:', error);
    return [];
  }
}

export async function fetchIoTDevices(): Promise<IoTDevice[]> {
  try {
    const response = await backendApi.get<IoTDevice[]>('/iot_devices');
    return response.data;
  } catch (error) {
    console.error('Error fetching IoT devices:', error);
    return [];
  }
}

export async function fetchThreeDResources(): Promise<ThreeDResource[]> {
  try {
    const response = await backendApi.get<ThreeDResource[]>('/models');
    return response.data;
  } catch (error) {
    console.error('Error fetching 3D resources:', error);
    return [];
  }
}

/**
 * 获取指定文件的数据
 */
export async function fetchStationData(relativePath: string): Promise<ExcelData | null> {
  try {
    const response = await backendApi.get<ExcelData>('/data', {
      params: { path: relativePath },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for ${relativePath}:`, error);
    return null;
  }
}

/**
 * 获取项目总览页所需的统计数据
 */
export async function fetchProjectOverviewStats(): Promise<any> {
    try {
        const response = await backendApi.get('/stats');
        return response.data;
    } catch (error) {
        console.error('Error fetching project overview stats:', error);
        return null;
    }
}

/**
 * 获取所有水位监测点的最新数据
 */
export async function fetchWaterLevels(): Promise<WaterLevelReading[]> {
    try {
        const response = await backendApi.get<WaterLevelReading[]>('/water_levels');
        return response.data;
    } catch (error) {
        console.error('Error fetching water levels:', error);
        return [];
    }
}

/**
 * 获取所有雨量监测点的最新数据
 */
export async function fetchRainfallData(): Promise<RainfallReading[]> {
    try {
        const response = await backendApi.get<RainfallReading[]>('/rainfall_data');
        return response.data;
    } catch (error) {
        console.error('Error fetching rainfall data:', error);
        return [];
    }
}

/**
 * 获取所有告警信息
 */
export async function fetchWarnings(): Promise<WarningItem[]> {
    try {
        const response = await backendApi.get<WarningItem[]>('/warnings', { params: { is_simulated: false } });
        return response.data;
    } catch (error) {
        console.error('Error fetching warnings:', error);
        return [];
    }
}

export async function fetchSensors(): Promise<SensorItem[]> {
  try {
    const res = await backendApi.get<SensorItem[]>('/v1/sensors');
    return res.data;
  } catch (error) {
    console.error('Error fetching sensors:', error);
    return [];
  }
}

export async function fetchSensorMetrics(sensorId: number): Promise<SensorMetricItem[]> {
  try {
    const res = await backendApi.get<SensorMetricItem[]>(`/v1/sensors/${sensorId}/metrics`);
    return res.data;
  } catch (error) {
    console.error('Error fetching sensor metrics:', error);
    return [];
  }
}

export async function fetchReadings(params: { sensor_id: number; metric_key?: string; limit?: number; start?: string; end?: string }): Promise<ReadingItem[]> {
  try {
    const res = await backendApi.get<ReadingItem[]>('/v1/readings', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching readings:', error);
    return [];
  }
}
