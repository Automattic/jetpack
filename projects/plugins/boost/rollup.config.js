/**
 * External dependencies
 */
import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import svelteSVG from 'rollup-plugin-svelte-svg';
import copy from 'rollup-plugin-copy';
import path from 'path';
import { babel } from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import tsconfig from './tsconfig.json';

const cssGenPath = path.dirname( require.resolve( 'jetpack-boost-critical-css-gen' ) );

const production = ! process.env.ROLLUP_WATCH;
const runServer = !! process.env.SERVE;

// eslint-disable-next-line jsdoc/require-jsdoc
function serve() {
	let server;

	// eslint-disable-next-line jsdoc/require-jsdoc
	function toExit() {
		if ( server ) {
			server.kill( 0 );
		}
	}

	return {
		writeBundle() {
			if ( server ) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			server = require( 'child_process' ).spawn( 'npm', [ 'run', 'start', '--', '--dev' ], {
				stdio: [ 'ignore', 'inherit', 'inherit' ],
				shell: true,
			} );

			process.on( 'SIGTERM', toExit );
			process.on( 'exit', toExit );
		},
	};
}

const copyTargets = [
	{
		src: path.join( cssGenPath, 'dist/bundle.js' ),
		dest: 'app/assets/dist/',
		rename: 'critical-css-gen.js',
	},
];

if ( ! production ) {
	copyTargets.push( {
		src: path.join( cssGenPath, 'dist/bundle.js.map' ),
		dest: 'app/assets/dist/',
		rename: 'critical-css-gen.js.map',
	} );
}

export default {
	input: 'app/assets/src/js/index.ts',
	output: {
		sourcemap: ! production,
		format: 'iife',
		name: 'app',
		file: 'app/assets/dist/jetpack-boost.js',
		globals: {
			'@wordpress/components': 'wp.components',
			'@wordpress/i18n': 'wp.i18n',
			react: 'window.React',
			'react-dom': 'window.ReactDOM',
		},
	},
	external: [ '@wordpress/components', '@wordpress/i18n', 'react', 'react-dom' ],
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
		} ),

		commonjs(),
		globals(),
		builtins(),
		json(),

		babel( {
			exclude: 'node_modules/**',
			presets: [ '@babel/preset-react' ],
			babelHelpers: 'bundled',
			compact: true,
		} ),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		postcss( {
			extensions: [ '.css', '.sss', '.pcss', '.sass', '.scss' ],
			extract: path.resolve( 'app/assets/dist/jetpack-boost.css' ),
			minimize: production,
		} ),

		svelteSVG(),
		svelte( {
			preprocess: sveltePreprocess( { sourceMap: ! production } ),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: ! production,
			},
		} ),

		typescript( {
			sourceMap: ! production,
			inlineSources: ! production,
			include: tsconfig.include,
			jsx: 'react-jsx', // to correctly parse JSX inside tsx filess
		} ),

		copy( {
			targets: copyTargets,
		} ),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		runServer && serve(),

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
