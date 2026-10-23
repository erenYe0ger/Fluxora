import { defineConfig } from 'vitest/config'
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true
  }
})
