import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'charts'
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor'
            if (id.includes('react')) return 'vendor'
            if (id.includes('lucide') || id.includes('sonner')) return 'ui'
          }
        },
      },
    },
  },
})
