import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import scss from 'rollup-plugin-scss';
import svelteSVG from 'rollup-plugin-svelte-svg';
import copy from 'rollup-plugin-copy';
import path from 'path';

const cssGenPath = path.dirname( require.resolve( 'jetpack-boost-critical-css-gen' ) );

const production = ! process.env.ROLLUP_WATCH;
const runServer = !! process.env.SERVE;

function serve() {
	let server;

	function toExit() {
		if ( server ) server.kill( 0 );
	}

	return {
		writeBundle() {
			if ( server ) return;
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
			'@wordpress/i18n': 'wp.i18n',
		},
	},
	external: [ '@wordpress/i18n' ],
	plugins: [
		svelteSVG(),
		svelte( {
			preprocess: sveltePreprocess( { sourceMap: ! production } ),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: ! production,
			},
		} ),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		scss( { output: 'app/assets/dist/jetpack-boost.css' } ),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve( {
			browser: true,
			dedupe: [ 'svelte' ],
		} ),
		commonjs(),
		typescript( {
			sourceMap: ! production,
			inlineSources: ! production,
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
};
