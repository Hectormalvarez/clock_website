import { fileURLToPath } from 'node:url';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Absolute origin used when `VITE_SITE_URL` is not set. Matches the host port
 * the dev stack publishes, so a local production build points at something
 * real rather than at a placeholder.
 */
const DEFAULT_SITE_URL = 'http://localhost:8100';

/**
 * Injects the absolute site origin into the HTML shell and generates the SEO
 * files that depend on it.
 *
 * Doing this in a plugin (rather than with Vite's `%VITE_*%` HTML replacement)
 * keeps one deterministic source of truth for the origin and lets the sitemap
 * and robots file be generated from the same value instead of hand-maintained
 * duplicates.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
	return {
		name: 'clock:site-url',

		transformIndexHtml(html) {
			return html.replaceAll('%SITE_URL%', siteUrl);
		},

		generateBundle() {
			this.emitFile({
				type: 'asset',
				fileName: 'sitemap.xml',
				source: [
					'<?xml version="1.0" encoding="UTF-8"?>',
					'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
					'\t<url>',
					`\t\t<loc>${siteUrl}/</loc>`,
					'\t\t<changefreq>monthly</changefreq>',
					'\t\t<priority>1.0</priority>',
					'\t</url>',
					'</urlset>',
					'',
				].join('\n'),
			});

			this.emitFile({
				type: 'asset',
				fileName: 'robots.txt',
				source: [
					'# https://www.robotstxt.org/robotstxt.html',
					'# The app is a single public page with no private areas.',
					'User-agent: *',
					'Allow: /',
					'',
					`Sitemap: ${siteUrl}/sitemap.xml`,
					'',
				].join('\n'),
			});
		},
	};
}

export default defineConfig(({ mode }) => {
	// `loadEnv` reads web/.env* files and any matching process.env entry, so the
	// same config serves local development and the production image build.
	const env = loadEnv(mode, process.cwd(), 'VITE_');
	// Trailing slashes are stripped so the templates below can always append `/`.
	const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

	return {
		root: 'src',
		// Keep Vite/Vitest caches out of src/ so they never pollute the source tree.
		cacheDir: '../node_modules/.vite',
		plugins: [siteUrlPlugin(siteUrl)],
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
			// Vite's root is src/, so keep generated reports out of the source tree.
			coverage: {
				reportsDirectory: '../coverage',
			},
		},
	};
});
