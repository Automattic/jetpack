import { defineConfig } from 'tsdown';

export default defineConfig( {
	entry: [ 'src/index.ts' ],
	outDir: 'dist',
	format: [ 'esm' ],
	platform: 'node',
	target: 'node24',
	fixedExtension: false,
	clean: true,
	sourcemap: true,
	dts: false,
	deps: {
		alwaysBundle: [ /.*/ ],
	},
} );
