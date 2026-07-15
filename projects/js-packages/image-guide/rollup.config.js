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
import sveltePreprocess from 'svelte-preprocess';

const production = process.env.NODE_ENV === 'production';

const exportConditions = [ 'jetpack:src' ];

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
			presets: [ [ '@babel/preset-react', { runtime: 'automatic' } ] ],
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
			include: [ './src/**/*' ],
			tsconfig: 'tsconfig.rollup.json',
			declaration: true,
		} ),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production &&
			terser( {
				mangle: {
					// Preserve WP i18n methods.
					reserved: [ '__', '_n', '_nx', '_x' ],
				},
			} ),
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
