import { sassPlugin } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';

export default defineConfig( {
	entry: [ 'src/index.ts' ],
	clean: true,
	splitting: true,
	sourcemap: true,
	dts: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	esbuildPlugins: [ sassPlugin( { embedded: true } ) ],
} );
