import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // 0.0.0.0 — 다른 PC에서 접속 시 서버 IP:5173 사용
    proxy: {
      '/api': {
        target: 'http://localhost:5188',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
