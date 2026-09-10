import lightningcssDsTokenFallbacks from '@wordpress/theme/lightningcss-plugins/lightningcss-ds-token-fallbacks';
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
		// Lightning CSS injects official `--wpds-*` fallbacks into SCSS/CSS.
		lightningcss: {
			visitor: lightningcssDsTokenFallbacks,
		},
	},
} );
