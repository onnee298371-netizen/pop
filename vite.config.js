import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    // ЭТОТ ПЛАГИН ОБЯЗАТЕЛЕН ДЛЯ WALLETCONNECT В ELECTRON
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext', // Важно для поддержки Top-level await
    commonjsOptions: {
      transformMixedEsModules: true, // Помогает с wagmi/viem
    },
  },
  resolve: {
    alias: {
      process: "process/browser",
      buffer: "buffer",
      util: "util",
    },
  },
  define: {
    // Явно задаем global для библиотек, которые этого требуют
    'global': 'window',
  },
})
