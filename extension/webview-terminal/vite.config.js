import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../media/terminal-webview-dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'terminal.js',
        assetFileNames: 'terminal.css',
      },
    },
    cssCodeSplit: false,
  },
});
