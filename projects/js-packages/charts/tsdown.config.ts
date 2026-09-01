/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';
import { assertChartsScopeEmitted } from './tools/assert-charts-scope-emitted.ts';
import { assertNoDynamicRequire } from './tools/assert-no-dynamic-require.ts';
import { removeDataTestId } from './tools/remove-data-testid.ts';

const pkg = JSON.parse( readFileSync( new URL( './package.json', import.meta.url ), 'utf8' ) ) as {
	exports: Record< string, string | Record< string, string > >;
};

// JS/TS entries from package exports; skip non-JS paths like `./style.css`.
const entry = Object.values( pkg.exports )
	.map( $export => ( typeof $export === 'object' ? $export[ 'jetpack:src' ] : '' ) )
	.filter( ( path ): path is string => Boolean( path ) && /\.[cm]?[jt]sx?$/.test( path ) );

export default defineConfig( {
	entry,
	clean: true,
	sourcemap: true,
	dts: true,
	format: [ 'esm', 'cjs' ],
	outDir: 'dist',
	platform: 'browser',
	// Preserve the reference so 'browser' doesn't fold it to the dev branch.
	define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
	// ESM `.js` + CJS `.cjs`, matching `exports`/`typesVersions`.
	fixedExtension: false,
	loader: {
		'.jpg': 'asset',
		'.gif': 'asset',
		'.svg': 'asset',
		'.png': 'asset',
	},
	deps: {
		alwaysBundle: [ /^fast-deep-equal/ ],
	},
	css: {
		fileName: 'index.css',
		modules: {
			generateScopedName: 'a8ccharts-[hash]-[local]',
		},
	},
	plugins: [ removeDataTestId() ],
	onSuccess() {
		assertNoDynamicRequire( 'dist' );
		assertChartsScopeEmitted( 'dist' );
	},
} );
