import path from 'path';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import svelte from 'rollup-plugin-svelte';
import svelteSVG from 'rollup-plugin-svelte-svg';
import sveltePreprocess from 'svelte-preprocess';
import tsconfig from './tsconfig.json';

const production = process.env.NODE_ENV === 'production';

const exportConditions = process.env.npm_config_jetpack_webpack_config_resolve_conditions
	? process.env.npm_config_jetpack_webpack_config_resolve_conditions.split( ',' )
	: [];

/**
 *
 *
 * Jetpack Boost Image Guide
 *
 *
 */
export default {
	input: `./src/index.ts`,
	output: {
		sourcemap: ! production,
		format: 'esm',
		name: 'app',
		file: `./build/index.js`,
	},
	plugins: [
		replace( {
			preventAssignment: true,
			delimiters: [ '', '' ],
			values: {
				"@import '@automattic": "@import '~@automattic",
				'process.env.NODE_ENV': '"production"',
			},
		} ),

		resolve( {
			browser: true,
			preferBuiltins: false,
			dedupe: [ 'svelte' ],
			exportConditions,
		} ),

		commonjs(),
		json(),

		babel( {
			presets: [ '@babel/preset-react' ],
			babelHelpers: 'bundled',
			compact: true,
		} ),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		postcss( {
			extensions: [ '.css', '.sss', '.pcss', '.sass', '.scss' ],
			extract: path.resolve( `./build/guide.css` ),
			minimize: production,
		} ),

		svelteSVG(),
		svelte( {
			preprocess: sveltePreprocess( {
				sourceMap: ! production,
				typescript: {
					compilerOptions: {
						module: 'esnext',
						moduleResolution: 'bundler',
					},
				},
			} ),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: ! production,
			},
		} ),

		typescript( {
			sourceMap: ! production,
			inlineSources: ! production,
			// In order to let @rollup/plugin-typescript hanlde TS files from js-packages
			// we need to include those here and pass the custom tsconfig as well
			include: tsconfig.include,
			tsconfig: 'tsconfig.json',
			declaration: true,
		} ),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser(),
	],

	watch: {
		clearScreen: false,
	},

	onwarn: ( warning, defaultHandler ) => {
		// Ignore unused external imports for known problem React / ReactDOM imports.
		if ( warning.code === 'UNUSED_EXTERNAL_IMPORT' ) {
			const ignoredImports = [
				'createPortal',
				'findDOMNode',
				'render',
				'unmountComponentAtNode',
				'createRef',
				'memo',
				'useImperativeHandle',
				'useDebugValue',
				'lazy',
				'Suspense',
			];

			const unignoredWarnings = warning.names.filter( name => ! ignoredImports.includes( name ) );
			if ( unignoredWarnings.length === 0 ) {
				return;
			}
		}

		defaultHandler( warning );
	},
};
