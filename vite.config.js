import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      // If you're using preprocessors
    },
    postcss: './postcss.config.js',
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/assembly/ysb': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => {
          // Check if file exists in frontend/src/pages/YSB first
          const itemCode = path.split('/').pop().replace('.html', '');
          if (path.endsWith('.html')) {
            return path.replace('/assembly/ysb/', '/src/pages/YSB/');
          }
          return path;
        }
      }
    }
  }
});