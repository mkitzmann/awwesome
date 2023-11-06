import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	build: {
		emptyOutDir: false
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			$assets: path.resolve(__dirname, './src/assets'),
			$components: path.resolve(__dirname, './src/components'),
			$stores: path.resolve(__dirname, './src/stores'),
			$lib: path.resolve(__dirname, './src/lib')
		}
	}
});
