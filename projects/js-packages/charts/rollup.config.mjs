import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

// Define input entry points for multi-entry build
// This supports package.json exports like "import { BarChart } from '@automattic/charts/bar-chart';" for consumers.
// This is useful especially to import components specific types and/or helpers easily.
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

// Helper function to create consistent output configurations
// Reduces duplication between CJS, ESM, and TypeScript declaration outputs
const createOutputConfig = ( dir, format ) => ( {
	dir,
	format,
	preserveModules: true, // Keep individual module files instead of bundling
	preserveModulesRoot: 'src', // Remove 'src' from output paths
	exports: 'named', // Ensure named exports are preserved for tree-shaking
} );

// Main configuration for building JavaScript modules (CJS and ESM)
const mainConfig = {
	input: inputConfig,
	output: [
		createOutputConfig( './dist/cjs/', 'cjs' ), // CommonJS for Node.js compatibility
		createOutputConfig( './dist/mjs/', 'esm' ), // ES modules for modern bundlers
	],
	// Dependencies are externalized automatically by peerDepsExternal plugin and resolveOnly option
	plugins: [
		peerDepsExternal( { includeDependencies: true } ), // Automatically externalize all dependencies from package.json
		resolve( {
			preferBuiltins: true,
			extensions: [ '.tsx', '.ts', '.js', '.jsx' ], // Resolve these file extensions
			// Only resolve relative imports and src/ files - this prevents bundling node_modules
			resolveOnly: [ /^\.\.?\//, /^src\// ],
		} ),
		commonjs(), // Convert CommonJS modules to ES modules
		json(), // Import JSON files as modules
		postcss( {
			extract: 'style.css', // Extract CSS to a separate file
			autoModules: true, // Automatically handle .module.scss as CSS modules
			modules: true, // Enable CSS modules
			use: [ 'sass' ], // Enable SCSS support
			minimize: true, // Minify the CSS
		} ),
		typescript( {
			tsconfig: './tsconfig.json',
			declaration: false, // Don't generate .d.ts files here (handled by dtsConfig)
			compilerOptions: {
				verbatimModuleSyntax: true, // Preserve import/export syntax exactly
			},
			exclude: [ 'node_modules', 'dist', '**/stories/**', '**/*.test.{ts,tsx}' ],
		} ),
	],
	onwarn( warning, warn ) {
		// Suppress circular dependency warnings (common in React component libraries)
		if ( warning.code === 'CIRCULAR_DEPENDENCY' ) {
			return;
		}
		// Suppress "use client" directive warnings from node_modules (Next.js related)
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

// Configuration for generating TypeScript declaration files (.d.ts)
// Separate from main build to ensure clean type definitions
const dtsConfig = {
	input: inputConfig,
	output: createOutputConfig( 'dist/types/', 'es' ), // Use 'es' format for TypeScript declarations
	plugins: [
		dts( {
			respectExternal: true, // Don't bundle external types
		} ),
	],
	// Don't include style imports or React types in type definitions
	external: [ /\.scss$/, /\.css$/, 'react', /@types\/.*/, /^@visx\/.*/, /react\/.*/ ],
};

// Export both configurations - Rollup will build them in parallel
export default defineConfig( [ mainConfig, dtsConfig ] );
