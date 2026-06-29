import license from 'rollup-plugin-license';
import { defineConfig } from 'tsdown';

export default defineConfig( {
	entry: [ 'src/index.js' ],
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
	plugins: [ license( { thirdParty: { output: 'dist/licenses.txt' } } ) ],
} );
