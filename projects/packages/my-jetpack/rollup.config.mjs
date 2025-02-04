import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import svgr from '@svgr/rollup';
import { defineConfig } from 'rollup';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

const mainConfig = {
	input: '_inc/admin.jsx',
	output: {
		dir: 'build',
		format: 'iife',
		sourcemap: true,
		globals: {
			'@wordpress/element': 'wp.element',
			'@wordpress/components': 'wp.components',
			'@wordpress/i18n': 'wp.i18n',
			'@wordpress/icons': 'wp.icons',
			react: 'React',
			'react-dom': 'ReactDOM',
		},
	},
	external: [
		'react',
		'react-dom',
		/@wordpress\/.*/,
		'@automattic/jetpack-components',
		'@automattic/jetpack-connection',
		/@automattic\/jetpack-[^/]+/,
	],
	plugins: [
		peerDepsExternal(),
		resolve( {
			browser: true,
			extensions: [ '.tsx', '.ts', '.jsx', '.js' ],
			mainFields: [ 'module', 'main' ],
			preserveSymlinks: true,
			resolveOnly: [ /@automattic\/.*/, /^(?!@wordpress).*/ ],
		} ),
		babel( {
			babelHelpers: 'runtime',
			exclude: 'node_modules/**',
			extensions: [ '.jsx', '.js', '.ts', '.tsx' ],
			presets: [
				'@babel/preset-react',
				'@babel/preset-typescript',
				[ '@babel/preset-env', { modules: false } ],
			],
			plugins: [ '@babel/plugin-transform-runtime' ],
		} ),
		commonjs( {
			include: [
				/node_modules/,
				/js-packages\/[^/]+\/(?:src|build|index)/,
				/js-packages\/boost-score-api/,
				/js-packages\/config/,
				/js-packages\/api/,
			],
			transformMixedEsModules: true,
			requireReturnsDefault: 'auto',
			esmExternals: true,
			ignoreDynamicRequires: true,
		} ),
		replace( {
			preventAssignment: true,
			'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV ),
		} ),
		json(),
		svgr(),
		image(),
		postcss( {
			extract: true,
			modules: {
				generateScopedName: '[name]__[local]___[hash:base64:5]',
			},
			use: [
				[
					'sass',
					{
						includePaths: [ 'node_modules/@automattic/', 'node_modules' ],
					},
				],
			],
			minimize: true,
			inject: false,
		} ),
		typescript( {
			tsconfig: './tsconfig.json',
			declaration: false,
			sourceMap: true,
			jsx: 'preserve',
			include: [ '_inc/**/*', '_inc/types/global.d.ts' ],
		} ),
		process.env.NODE_ENV === 'production' && terser(),
	],
	onwarn( warning, warn ) {
		if ( warning.code === 'CIRCULAR_DEPENDENCY' ) {
			return;
		}
		warn( warning );
	},
};

export default defineConfig( mainConfig );
