import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';

const mainConfig = {
	input: 'src/index.ts',
	output: [
		{
			dir: './dist/cjs/',
			format: 'cjs',
			preserveModules: true,
			preserveModulesRoot: 'src',
			sourcemap: true,
			sourcemapPathTransform: relativeSourcePath =>
				`/@automattic/number-formatters/${ relativeSourcePath }`,
		},
		{
			dir: './dist/mjs/',
			format: 'esm',
			preserveModules: true,
			preserveModulesRoot: 'src',
			sourcemap: true,
		},
	],
	external: [ '@wordpress/date', 'debug' ],
	plugins: [
		typescript( {
			tsconfig: './tsconfig.json',
			declaration: false,
			sourceMap: true,
			compilerOptions: {
				verbatimModuleSyntax: true,
			},
		} ),
	],
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
