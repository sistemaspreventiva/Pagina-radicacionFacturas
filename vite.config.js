// vite.config.js (en la RAÍZ del proyecto)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',      // Render servirá ../dist desde el backend
    sourcemap: false
  },
  server: {
    host: true,
    port: 5173
  }
});
