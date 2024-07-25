import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const sharedPlugins = [
	resolve( {
		browser: true,
		preferBuiltins: false,
		modulesOnly: false,
	} ),
	typescript( {
		sourceMap: true,
		inlineSources: false,
		declaration: false,
	} ),
	commonjs(),
	nodePolyfills(),
	json(),
];

export default {
	input: 'src/front-end.ts',
	output: [
		{
			sourcemap: true,
			format: 'iife',
			name: 'CriticalCSSGenerator',
			file: 'dist/bundle.full.js',
			globals: {
				'node-fetch': 'fetch',
			},
		},
		{
			sourcemap: true,
			format: 'iife',
			name: 'CriticalCSSGenerator',
			file: 'dist/bundle.js',
			plugins: [ terser() ],
			globals: {
				'node-fetch': 'fetch',
			},
		},
	],
	external: [ 'node-fetch' ],
	plugins: sharedPlugins,
	preserveSymlinks: true,
	watch: {
		clearScreen: false,
	},
};
