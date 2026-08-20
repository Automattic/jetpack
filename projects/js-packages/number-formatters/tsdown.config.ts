import { defineConfig } from 'tsdown';

export default defineConfig( {
	entry: [ 'src/index.ts' ],
	clean: true,
	dts: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	platform: 'neutral',
	target: 'es2024',
} );
