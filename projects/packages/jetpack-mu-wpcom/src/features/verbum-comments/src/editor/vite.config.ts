import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig( {
	plugins: [
		react( {
			jsxRuntime: 'automatic',
		} ),
	],
	define: {
		'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV ),
	},
	build: {
		outDir: path.resolve( __dirname, '..', '..', 'dist' ),
		lib: {
			name: 'addGutenberg',
			entry: path.resolve( __dirname, 'index.tsx' ),
			fileName: 'editor.min',
			formats: [ 'es' ],
		},
		rollupOptions: {
			output: {
				compact: true,
				assetFileNames: 'editor[extname]',
			},
		},
		emptyOutDir: false,
	},
} );
