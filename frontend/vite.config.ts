import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
    allowedHosts: [
      '3000-mohammedfir-serverlessa-kezvw5s90ib.ws-eu121.gitpod.io',
      '.gitpod.io',
      'localhost',
    ],
    hmr: {
      clientPort: 3000,
      host: '3000-mohammedfir-serverlessa-kezvw5s90ib.ws-eu121.gitpod.io',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
