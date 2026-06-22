import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';
import { removeDataTestId } from './tools/remove-data-testid.ts';

const pkg = JSON.parse( readFileSync( new URL( './package.json', import.meta.url ), 'utf8' ) ) as {
	exports: Record< string, string | Record< string, string > >;
};

// Tracks whether the @tsdown/css sourcemap suppression below actually fired.
let suppressedCssSourcemapWarning = false;

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
	inputOptions: {
		// Silence @tsdown/css's unfixable broken-sourcemap warnings (but no others).
		onLog( level, log, handler ) {
			if ( log.code === 'SOURCEMAP_BROKEN' && log.plugin?.startsWith( '@tsdown/css' ) ) {
				suppressedCssSourcemapWarning = true;
				return;
			}
			handler( level, log );
		},
	},
	// ESM `.js` + CJS `.cjs`, matching `exports`/`typesVersions`.
	fixedExtension: false,
	loader: {
		'.jpg': 'asset',
		'.gif': 'asset',
		'.svg': 'asset',
		'.png': 'asset',
	},
	deps: {
		alwaysBundle: [ '@wordpress/ui', /^fast-deep-equal/ ],
	},
	css: {
		fileName: 'index.css',
		modules: {
			generateScopedName: 'a8ccharts-[hash]-[local]',
		},
	},
	plugins: [ removeDataTestId() ],
	// Fail loudly once @tsdown/css stops emitting these, so the suppression can be dropped.
	onSuccess() {
		if ( ! suppressedCssSourcemapWarning ) {
			throw new Error(
				'@tsdown/css no longer emits SOURCEMAP_BROKEN — remove the onLog suppression in tsdown.config.ts.'
			);
		}
	},
} );
