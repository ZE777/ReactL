import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = env.VITE_UI_URL ? Number(new URL(env.VITE_UI_URL).port) || 5173 : 5173
  return {
    // 透過 ngrok 子路徑 /admin 發布：資源與路由都掛在 /admin 底下
    base: '/admin/',
    plugins: [react(), tailwindcss()],
    server: {
      port,
    },
  }
})
