import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // pastikan selalu di port 5173 agar cocok dengan ALLOWED_ORIGIN di backend/config/config.php
  },
})
