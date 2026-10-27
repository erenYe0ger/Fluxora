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
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Keep large PDF processing libraries in dedicated chunks so they stay light
        manualChunks(id: string) {
          if (id.includes('pdfjs-dist')) return 'pdfjs'
          if (id.includes('@pdf-lib/standard-fonts')) return 'pdf-fonts'
          if (id.includes('@pdf-lib/upng')) return 'pdf-upng'
          if (id.includes('pdf-lib')) return 'pdf-lib'
          return undefined
        }
      }
    }
  }
})
