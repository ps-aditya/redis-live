import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: '../media/webview-dist',
		rollupOptions: {
			// Single bundle output (Phase 1.3: ES module chunks don't work in webview context)
			output: {
				entryFileNames: 'webview.js',
				dir: '../media/webview-dist',
			},
			// Disable code splitting
			manualChunks: undefined,
		},
	},
	base: '',
});
