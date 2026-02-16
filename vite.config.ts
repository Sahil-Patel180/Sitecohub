import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_COUNT__: JSON.stringify(execSync('git rev-list --count HEAD').toString().trim()),
  },
  server: {
    host: true,
  }
})
