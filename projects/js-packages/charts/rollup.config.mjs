// Import necessary plugins for building the library
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

// Common plugins used across all build configurations
const commonPlugins = [
	// Automatically externalize peer dependencies
	peerDepsExternal( {
		includeDependencies: true,
	} ),
	// Locate and bundle third-party dependencies from node_modules
	resolve( {
		preferBuiltins: true,
		extensions: [ '.tsx', '.ts', '.js', '.jsx' ],
	} ),
	// Convert CommonJS modules to ES6
	commonjs(),
	// Allow importing JSON files
	json(),
	// Process SCSS/CSS modules
	postcss( {
		// Configure CSS modules with scoped names
		modules: {
			generateScopedName: '[name]__[local]__[hash:base64:5]',
		},
		extract: 'style.css',
		autoModules: false,
		use: [ 'sass' ],
	} ),
];

// Main bundle configuration for the entire library
const mainConfig = {
	// Entry point for the bundle
	input: 'src/index.ts',
	// Output configuration for different module formats
	output: [
		{
			file: './dist/index.js',
			format: 'cjs', // CommonJS format for Node.js
			sourcemap: true,
			sourcemapPathTransform: relativeSourcePath => {
				return `/@automattic/charts/${ relativeSourcePath }`;
			},
		},
		{
			file: './dist/index.mjs',
			format: 'esm', // ES modules for modern bundlers
			sourcemap: true,
		},
	],
	// Mark all dependencies as external to avoid bundling them
	external: [ 'react', 'react-dom', /^@visx\/.*/, '@react-spring/web', 'clsx', 'tslib' ],
	plugins: [
		...commonPlugins,
		// TypeScript compilation
		typescript( {
			tsconfig: './tsconfig.json',
			declaration: false, // Declarations handled by dts plugin
			sourceMap: true,
			compilerOptions: {
				verbatimModuleSyntax: true,
			},
		} ),
		terser(),
	],
	// Handle circular dependencies warning
	onwarn( warning, warn ) {
		if ( warning.code === 'CIRCULAR_DEPENDENCY' ) {
			return;
		}
		warn( warning );
	},
};

// List of components to build individually
const components = [
	'components/bar-chart',
	'components/line-chart',
	'components/pie-chart',
	'components/pie-semi-circle-chart',
	'components/tooltip',
	'components/legend',
	'components/grid-control',
	'providers/theme',
];

// Generate individual bundles for each component
const componentConfigs = components.map( component => ( {
	// Component entry point - try both .tsx and .ts extensions
	input: `src/${ component }/index`,
	// Output both ESM and CJS formats
	output: [
		{
			file: `dist/${ component }/index.js`,
			format: 'esm',
			sourcemap: true,
		},
		{
			file: `dist/${ component }/index.cjs.js`,
			format: 'cjs',
			sourcemap: true,
		},
	],
	// Same external config as main bundle
	external: [ 'react', 'react-dom', /^@visx\/.*/, '@react-spring/web', 'clsx', 'tslib' ],
	plugins: [
		...commonPlugins,
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
} ) );

// Configuration for generating TypeScript declaration files
const typesConfig = {
	input: 'src/index.ts',
	output: [ { file: 'dist/index.d.ts', format: 'es' } ],
	plugins: [
		dts( {
			respectExternal: true,
		} ),
	],
	// Don't include style imports in type definitions
	external: [ /\.scss$/, /\.css$/, 'react', '@types/react' ],
};

// Export all configurations to be built in parallel
export default defineConfig( [ mainConfig, ...componentConfigs, typesConfig ] );
