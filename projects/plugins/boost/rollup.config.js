import path from 'path';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import svgr from '@svgr/rollup';
import copy from 'rollup-plugin-copy';
import postcss from 'rollup-plugin-postcss';
import svelte from 'rollup-plugin-svelte';
import svelteSVG from 'rollup-plugin-svelte-svg';
import sveltePreprocess from 'svelte-preprocess';
import tsconfig from './rollup-tsconfig.json';

const cssGenPath = path.dirname(
	path.dirname( require.resolve( 'jetpack-boost-critical-css-gen' ) )
);

const production = process.env.NODE_ENV === 'production';
const runServer = !! process.env.SERVE;

const exportConditions = process.env.npm_config_jetpack_webpack_config_resolve_conditions
	? process.env.npm_config_jetpack_webpack_config_resolve_conditions.split( ',' )
	: [];

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

const GUIDE_PATH = `app/modules/image-guide`;

/**
 *
 *
 * Jetpack Boost Dashboard UI
 *
 *
 */
const dashboard_ui = {
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
		alias( {
			entries: [
				{
					find: '$lib',
					replacement: path.join( __dirname, '/app/assets/src/js/lib' ),
				},
				{
					find: '$features',
					replacement: path.join( __dirname, '/app/assets/src/js/features' ),
				},
				{
					find: '$layout',
					replacement: path.join( __dirname, '/app/assets/src/js/layout' ),
				},
				{
					find: '$svg',
					replacement: path.join( __dirname, '/app/assets/src/js/svg' ),
				},
			],
		} ),

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
			extract: path.resolve( 'app/assets/dist/jetpack-boost.css' ),
			minimize: production,
		} ),

		svgr( {
			include: '**/react-components/svg/*.svg',
		} ),
		svelteSVG( {
			exclude: '**/react-components/svg/*.svg',
		} ),
		svelte( {
			preprocess: sveltePreprocess( { sourceMap: ! production } ),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: ! production,
			},
			exclude: '**/react-components/svg/*.svg',
		} ),

		typescript( {
			sourceMap: ! production,
			inlineSources: ! production,
			// In order to let @rollup/plugin-typescript hanlde TS files from js-packages
			// we need to include those here and pass the custom tsconfig as well
			include: tsconfig.include,
			tsconfig: 'rollup-tsconfig.json',
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

/**
 * Admin banner styles for use outside Jetpack Boost Dashboard UI
 */
const dashboard_styles = {
	input: 'app/assets/src/css/admin-banner.scss',
	output: {
		file: 'app/assets/dist/admin-banner.css',
		format: 'es',
	},
	plugins: [
		postcss( {
			extract: true,
			minimize: production,
			sourceMap: ! production,
		} ),
	],
};

/**
 *
 *
 * Jetpack Boost Image Guide
 *
 *
 */
const image_guide = {
	input: `${ GUIDE_PATH }/src/index.ts`,
	output: {
		sourcemap: ! production,
		format: 'iife',
		name: 'app',
		file: `${ GUIDE_PATH }/dist/guide.js`,
		globals: {
			'@wordpress/components': 'wp.components',
		},
	},
	external: [ '@wordpress/components' ],
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
			extract: path.resolve( `${ GUIDE_PATH }/dist/guide.css` ),
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
			// In order to let @rollup/plugin-typescript hanlde TS files from js-packages
			// we need to include those here and pass the custom tsconfig as well
			include: tsconfig.include,
			tsconfig: 'rollup-tsconfig.json',
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

const compile_steps = [ dashboard_ui, dashboard_styles ];

if ( ! ( 'SKIP_GUIDE' in process.env ) || ! process.env.SKIP_GUIDE ) {
	compile_steps.push( image_guide );
}

export default compile_steps;
