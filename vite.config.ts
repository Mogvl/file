import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      // 自动读取 tsconfig.json 中的 paths
      tsconfigPaths: true,
    },
    server: {
      port: 10050,
      host: true,
      open: true,
      proxy: {
        '/apis': {
          target: env.VITE_API_BASE_URL || 'http://localhost:10051',
          changeOrigin: true,
        },
      },
    },
  }
})
