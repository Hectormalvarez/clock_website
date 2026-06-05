import { defineConfig } from 'vitest/config';

export default defineConfig({
	root: 'src',
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
	},
});
