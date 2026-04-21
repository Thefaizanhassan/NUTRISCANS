import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('motion') || id.includes('framer-motion')) return 'motion'
          if (id.includes('recharts') || id.includes('victory-vendor') || id.includes('d3-')) return 'charts'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@base-ui') || id.includes('lucide-react')) return 'ui-vendor'
          return 'vendor'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
