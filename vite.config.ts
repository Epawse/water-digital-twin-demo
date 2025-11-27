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
      '/api/backend': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backend/, '/api')
      },
      '/map_asset': {
        target: 'http://myhome.217dan.com:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/map_asset/, '')
      }
    }
  }
})
