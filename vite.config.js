import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    // ВАЖНО: Этот плагин эмулирует Node.js API (Buffer, process) внутри окна рендера
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  base: './', // Относительные пути для Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext', // Поддержка Top-level await для Web3
    commonjsOptions: {
      transformMixedEsModules: true,
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
    'global': 'window', // Жесткая привязка global к window
  },
})
