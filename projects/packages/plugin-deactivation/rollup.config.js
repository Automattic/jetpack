import path from 'path';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import tsconfig from './rollup-tsconfig.json';

const production = ! process.env.ROLLUP_WATCH;

export default {
	input: 'src/assets/js/deactivation.ts',
	output: {
		sourcemap: ! production,
		format: 'iife',
		name: 'JetpackPluginDeactivation',
		dir: 'dist',
	},
	plugins: [
		// we'll extract any component CSS out into
		// a separate file - better for performance
		postcss( {
			extensions: [ '.scss' ],
			extract: path.resolve( 'dist/deactivation.css' ),
			minimize: production,
		} ),

		typescript( {
			sourceMap: ! production,
			inlineSources: ! production,
			// In order to let @rollup/plugin-typescript hanlde TS files from js-packages
			// we need to include those here and pass the custom tsconfig as well
			include: tsconfig.include,
			tsconfig: 'rollup-tsconfig.json',
		} ),
	],
};
