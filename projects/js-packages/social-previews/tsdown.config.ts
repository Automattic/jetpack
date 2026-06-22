import { defineConfig } from 'tsdown';

export default defineConfig( {
	entry: [ 'src/index.ts' ],
	clean: true,
	sourcemap: true,
	dts: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	css: {
		fileName: 'style.css',
	},
} );
