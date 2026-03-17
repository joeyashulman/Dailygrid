import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: set this to your GitHub repo name so
  // the app works when served from /<repo>/
  base: '/Dailygrid/',
})
