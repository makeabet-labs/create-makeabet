import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    // Enable source maps for production debugging (can be disabled for smaller builds)
    sourcemap: false,

    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'wallet-evm': ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
          'ui-vendor': ['@mantine/core', '@mantine/notifications', '@tabler/icons-react'],
          'query-vendor': ['@tanstack/react-query', '@tanstack/react-router'],
        },
      },
    },

    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,

    // Minification options
    minify: 'esbuild',

    // Target modern browsers for smaller output
    target: 'es2020',
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mantine/core',
      '@mantine/notifications',
      '@tanstack/react-query',
      'eventemitter3',
    ],
    exclude: [],
    esbuildOptions: {
      target: 'es2020',
    },
  },

  // Resolve configuration for better ESM compatibility
  resolve: {
    conditions: ['import', 'module', 'browser', 'default'],
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
