import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
// export default defineConfig({

//   base: '/',
//   plugins: [react()],
//   optimizeDeps: {
//     include: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion',"@chakra-ui/icons"],
//   },

// })


export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});