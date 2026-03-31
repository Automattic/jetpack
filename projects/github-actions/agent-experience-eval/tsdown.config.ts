import { defineConfig } from 'tsdown';

export default defineConfig( {
	entry: [ 'src/index.ts' ],
	format: 'esm',
	outDir: 'dist',
	sourcemap: true,
	// Bundle all deps — GitHub Actions need a self-contained file
	deps: {
		onlyBundle: false,
	},
} );
