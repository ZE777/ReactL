import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = env.VITE_UI_URL ? Number(new URL(env.VITE_UI_URL).port) || 5173 : 5173
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
    },
  }
})
