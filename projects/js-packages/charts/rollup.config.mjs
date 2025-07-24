import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

const inputConfig = {
	index: 'src/index.ts',
	// Include component index files to support "./components/*" exports
	'components/bar-chart/index': 'src/components/bar-chart/index.tsx',
	'components/line-chart/index': 'src/components/line-chart/index.tsx',
	'components/pie-chart/index': 'src/components/pie-chart/index.tsx',
	'components/pie-semi-circle-chart/index': 'src/components/pie-semi-circle-chart/index.tsx',
	'components/bar-list-chart/index': 'src/components/bar-list-chart/index.tsx',
	'components/leaderboard-chart/index': 'src/components/leaderboard-chart/index.tsx',
	'components/tooltip/index': 'src/components/tooltip/index.ts',
	'components/legend/index': 'src/components/legend/index.ts',
	// Include visx module index files
	'visx/text/index': 'src/visx/text/index.ts',
	'visx/group/index': 'src/visx/group/index.ts',
	'visx/legend/index': 'src/visx/legend/index.ts',
	// Include provider index files
	'providers/chart-context/index': 'src/providers/chart-context/index.ts',
	'providers/theme/index': 'src/providers/theme/index.ts',
};

const mainConfig = {
	input: inputConfig,
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
			extract: false, // Don't extract CSS, inject into JS instead
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
			exclude: [ 'node_modules', 'dist', '**/stories/**', '**/*.test.{ts,tsx}' ],
		} ),
		terser(),
	],
	onwarn( warning, warn ) {
		if ( warning.code === 'CIRCULAR_DEPENDENCY' ) {
			return;
		}
		// Suppress "use client" directive warnings from node_modules
		if (
			warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
			warning.message.includes( '"use client"' ) &&
			warning.id?.includes( 'node_modules' )
		) {
			return;
		}
		warn( warning );
	},
};

// Configuration for generating TypeScript declaration files
const dtsConfig = {
	input: inputConfig,
	output: [ { dir: 'dist/types', format: 'es' } ],
	plugins: [
		dts( {
			respectExternal: true,
		} ),
	],
	// Don't include style imports in type definitions
	external: [ /\.scss$/, /\.css$/, 'react', /@types\/.*/, /^@visx\/.*/, 'react/jsx-runtime' ],
};

export default defineConfig( [ mainConfig, dtsConfig ] );
