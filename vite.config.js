// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // important pour que les chemins relatifs fonctionnent en production
  build: {
    outDir: 'dist', // dossier de sortie
  },
});
