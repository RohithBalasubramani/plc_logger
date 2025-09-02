import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ensure JSX in .js files is handled during Vite's dependency scan
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' }
    }
  }
})
