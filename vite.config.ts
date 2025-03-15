import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {

  interface Env {
    VITE_API_BASE_URL: string;
    OCR_API_BASE_URL: string;
  }
  const env = loadEnv(mode, process.cwd(), '') as unknown as Env;
  return {
    plugins: [react()],
    server: {
      // port: 3000,
      host: '0.0.0.0', // 允许外部访问
      allowedHosts: [
        'www.makangbo.cn', // 允许的域名
        '1.95.55.33',     // 允许 IP 访问
      ],
    },
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'process.env.OCR_API_BASE_URL': JSON.stringify(env.OCR_API_BASE_URL),
    },
  }
})