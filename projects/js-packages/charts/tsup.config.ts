import { defineConfig } from 'tsup';
import pkg from './package.json';

// Extract entries from package exports
const entry = Object.values( pkg.exports ).map( ( { 'jetpack:src': src } ) => src );

export default defineConfig( {
	entry,
	clean: true,
	splitting: true,
	sourcemap: true,
	dts: true,
	minify: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	loader: {
		'.jpg': 'file',
		'.gif': 'file',
		'.scss': 'file',
		'.svg': 'file',
		'.png': 'file',
	},
} );
