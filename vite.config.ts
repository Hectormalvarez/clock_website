import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: 'src',
	// Keep Vite/Vitest caches out of src/ so they never pollute the source tree.
	cacheDir: '../node_modules/.vite',
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	build: {
		outDir: '../dist',
		emptyOutDir: true,
	},
	server: {
		open: true,
	},
	test: {
		globals: true,
		environment: 'jsdom',
		include: ['../tests/**/*.test.ts'],
	},
});
