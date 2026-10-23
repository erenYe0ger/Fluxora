import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const src = path.resolve(import.meta.dirname, 'src')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.join(src, 'app'),
      '@features': path.join(src, 'features'),
      '@shared': path.join(src, 'shared'),
      '@styles': path.join(src, 'styles')
    }
  },
  worker: {
    format: 'es'
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // pdf.js is large and only needed inside the reader; keep it in its own chunk
        // so the library screen stays light.
        manualChunks(id: string) {
          if (id.includes('pdfjs-dist')) return 'pdfjs'
          return undefined
        }
      }
    }
  }
})
