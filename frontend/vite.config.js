import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Preserva nombre original solo para archivos SVG
          if (assetInfo.name && assetInfo.name.endsWith('.svg')) {
            return 'assets/[name][extname]'
          }
          // Para otros assets, mantén el hash para cache busting
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
