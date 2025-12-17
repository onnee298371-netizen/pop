import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    // REQUIRED: Polyfills for WalletConnect/Web3 in Electron
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  base: './', // REQUIRED for Electron relative paths
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext', // Support top-level await
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
    'global': 'window',
  },
})
