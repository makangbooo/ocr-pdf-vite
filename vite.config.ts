import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {

  interface Env {
    VITE_API_BASE_URL: string;
  }
  const env = loadEnv(mode, process.cwd(), '') as unknown as Env;
  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
    },
  }
})