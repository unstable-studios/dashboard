import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import svgr from 'vite-plugin-svgr';

// Get version from package.json - use dynamic import
let appVersion: string;
try {
	const packageModule = await import('./package.json', {
		with: { type: 'json' },
	});
	appVersion = packageModule.default.version;
} catch {
	// Fallback version
	appVersion = '0.0.0';
}

// https://vite.dev/config/
export default defineConfig({
	// Expose both VITE_ and FEATURE_ prefixed env vars to the client
	envPrefix: ['VITE_', 'FEATURE_'],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion),
	},
	plugins: [react(), cloudflare(), tailwindcss(), svgr()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
