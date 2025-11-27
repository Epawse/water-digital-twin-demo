import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import createExternal from 'vite-plugin-external'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    createExternal({
      externals: {
        cesium: 'Cesium'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://map.217dan.com/addons/cesiummapv',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/map_asset': {
        target: 'http://myhome.217dan.com:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/map_asset/, '')
      }
    }
  }
})
