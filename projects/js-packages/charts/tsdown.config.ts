import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';
import { removeDataTestId } from './tools/remove-data-testid.ts';

const pkg = JSON.parse( readFileSync( new URL( './package.json', import.meta.url ), 'utf8' ) ) as {
	exports: Record< string, string | Record< string, string > >;
};

/*
 * Extract JS/TS entries from package exports. Non-JS source paths (e.g. the
 * `./style.css` placeholder) are skipped so tsdown doesn't try to bundle them.
 */
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
	/*
	 * `platform: 'browser'` otherwise treats `process` as undefined and folds
	 * `process.env.NODE_ENV` checks (e.g. emotion's dev labels/sourcemaps) to their
	 * dev branch. Define it to itself so the reference is preserved for the consumer's
	 * bundler to replace — keeping those dev-only artifacts out of production builds.
	 */
	define: { 'process.env.NODE_ENV': 'process.env.NODE_ENV' },
	/*
	 * Keep tsup's extension scheme: this package is ESM (`"type": "module"`), so
	 * ESM output is `.js` and CJS output is `.cjs`, matching `exports`, `main`,
	 * `module`, and the `.d.ts` paths in `typesVersions`.
	 */
	fixedExtension: false,
	loader: {
		'.jpg': 'asset',
		'.gif': 'asset',
		'.svg': 'asset',
		'.png': 'asset',
	},
	deps: {
		alwaysBundle: [ '@wordpress/ui' ],
	},
	css: {
		fileName: 'index.css',
		modules: {
			generateScopedName: 'a8ccharts-[hash]-[local]',
		},
	},
	plugins: [ removeDataTestId() ],
} );
