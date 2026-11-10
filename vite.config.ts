import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      // Archive files can be locked by the OS and crash the watcher on Windows.
      ignored: ['**/*.rar', '**/*.zip', '**/*.7z'],
    },
  },
})
