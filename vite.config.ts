import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    // Optimize for game performance  
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/core': resolve(__dirname, './src/core'),
      '@/entities': resolve(__dirname, './src/entities'),
      '@/systems': resolve(__dirname, './src/systems'),
      '@/ui': resolve(__dirname, './src/ui'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/config': resolve(__dirname, './src/config')
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true // Allow external connections for mobile testing
  },
  // PWA and game-specific optimizations
  assetsInclude: ['**/*.wav', '**/*.mp3', '**/*.ogg']
})