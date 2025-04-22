import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

const mainConfig = {
	input: 'src/index.ts',
	output: [
		{
			dir: './dist/cjs/',
			format: 'cjs',
			preserveModules: true,
			preserveModulesRoot: 'src',
			sourcemap: true,
			sourcemapPathTransform: relativeSourcePath => `/@automattic/charts/${ relativeSourcePath }`,
		},
		{
			dir: './dist/mjs/',
			format: 'esm',
			preserveModules: true,
			preserveModulesRoot: 'src',
			sourcemap: true,
		},
	],
	external: [ 'react', 'react-dom', /^@visx\/.*/, '@react-spring/web', 'clsx', 'tslib' ],
	plugins: [
		peerDepsExternal( { includeDependencies: true } ),
		resolve( {
			preferBuiltins: true,
			extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
		} ),
		commonjs(),
		json(),
		postcss( {
			extract: true, // Generate individual CSS files
			autoModules: true, // Automatically handle .module.scss as CSS modules
			modules: true, // Enable CSS modules
			use: [ 'sass' ], // Enable SCSS support
			minimize: true, // Minify the CSS
		} ),
		typescript( {
			tsconfig: './tsconfig.json',
			declaration: false,
			sourceMap: true,
			compilerOptions: {
				verbatimModuleSyntax: true,
			},
		} ),
		terser(),
	],
	onwarn( warning, warn ) {
		if ( warning.code === 'CIRCULAR_DEPENDENCY' ) {
			return;
		}
		warn( warning );
	},
};

// Configuration for generating TypeScript declaration files
const dtsConfig = {
	input: 'src/index.ts',
	output: [ { file: 'dist/index.d.ts' } ],
	plugins: [
		dts( {
			respectExternal: true,
		} ),
	],
	// Don't include style imports in type definitions
	external: [ /\.scss$/, /\.css$/, 'react', /@types\/.*/, /^@visx\/.*/, 'react/jsx-runtime' ],
};

export default defineConfig( [ mainConfig, dtsConfig ] );
