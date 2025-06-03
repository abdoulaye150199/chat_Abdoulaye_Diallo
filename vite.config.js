export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  // Éviter les rechargements automatiques en production
  server: {
    hmr: false
  }
});