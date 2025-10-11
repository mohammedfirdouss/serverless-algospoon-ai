export default {
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
    allowedHosts: ['3000-mohammedfir-serverlessa-hq18vjfwica.ws-eu121.gitpod.io']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          aws: ['@aws-amplify/ui-react', 'aws-amplify']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
};
