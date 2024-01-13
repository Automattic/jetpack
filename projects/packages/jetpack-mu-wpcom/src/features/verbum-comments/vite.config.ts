import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { spawnSync } from 'child_process';

// https://vitejs.dev/config/
export default defineConfig( {
	plugins: [ preact() ],
	define: {
		// Store gzipped bundle size inside the bundle to help measure the connection speed.
		verbumBundleSize: spawnSync( 'gzip', [ '-c', 'dist/index.js' ] ).stdout.toString().trim()
			.length,
		VITE_CACHE_BUSTER: JSON.stringify( '?buster=' + Date.now() ),
	},
	build: {
		rollupOptions: {
			input: [ resolve( __dirname, 'src/index.tsx' ) ],
			output: {
				compact: true,
				entryFileNames: 'index.js',
				assetFileNames: '[name][extname]',
			},
		},
		emptyOutDir: false,
	},
} );
