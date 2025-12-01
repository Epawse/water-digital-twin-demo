import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import TitleSet from '../views/SetConfigPages/TitleSet.vue'
import Lines from '../views/SetConfigPages/Lines.vue'
import Effect from '../views/SetConfigPages/Effect.vue'
import Imagery from '../views/SetConfigPages/Imagery.vue'
import Model from '../views/SetConfigPages/Model.vue'
import Dashboard from '../views/Dashboard.vue'
import FloodEvolution from '../views/DigitalTwin/index.vue'
import RainfallAnalysis from '../views/RainfallAnalysis.vue'
import TestPostProcess from '../views/TestPostProcess.vue'
import EngineeringDemo from '../views/EngineeringDemo.vue'
import DataManagement from '../views/DataManagement.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/flood',
    name: 'FloodEvolution',
    component: FloodEvolution,
  },
  {
    path: '/rainfall',
    name: 'RainfallAnalysis',
    component: RainfallAnalysis,
  },
  {
    path: '/visualization',
    name: 'Visualization3D',
    component: EngineeringDemo,
  },
  {
    path: '/bim-demo',
    redirect: '/visualization',
  },
  {
    path: '/data',
    name: 'DataManagement',
    component: DataManagement,
  },
  {
    path: '/test-post-process',
    name: 'TestPostProcess',
    component: TestPostProcess,
  },
  {
    path: '/model',
    name: 'Model',
    component: Model,
  },
  {
    path: '/effect',
    name: 'Effect',
    component: Effect,
  },
  {
    path: '/imagery',
    name: 'Imagery',
    component: Imagery,
  },
  {
    path: '/lines',
    name: 'Lines',
    component: Lines,
  },
  {
    path: '/titleset',
    name: 'TitleSet',
    component: TitleSet,
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
