const assert = require( 'node:assert/strict' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const {
	parseNamedImports,
	parsePublicExports,
	checkContract,
	parseSimulateEnv,
	validateExportContracts,
	PROVIDER_PACKAGES,
	CONSUMER_PACKAGES,
} = require( '../../bin/validate-export-contract-lib.js' );

describe( 'validate-export-contract', () => {
	describe( 'parseNamedImports', () => {
		it( 'extracts a single named import', () => {
			const src = "import { ThemeProvider } from '@wordpress/theme';";
			assert.deepEqual( parseNamedImports( src, '@wordpress/theme' ), [ 'ThemeProvider' ] );
		} );

		it( 'uses the ORIGINAL name for aliased imports (`x as y`)', () => {
			const src = "import { privateApis as routePrivateApis } from '@wordpress/route';";
			assert.deepEqual( parseNamedImports( src, '@wordpress/route' ), [ 'privateApis' ] );
		} );

		it( 'handles multiple, multi-line, double-quoted imports', () => {
			const src = `
				import {
					privateApis as routePrivateApis,
					useNavigate
				} from "@wordpress/route";
			`;
			assert.deepEqual( parseNamedImports( src, '@wordpress/route' ), [
				'privateApis',
				'useNavigate',
			] );
		} );

		it( 'only matches the requested provider, not lookalikes', () => {
			const src =
				"import { A } from '@wordpress/theme';\nimport { B } from '@wordpress/theme-extra';";
			assert.deepEqual( parseNamedImports( src, '@wordpress/theme' ), [ 'A' ] );
		} );

		it( 'ignores namespace and default imports (cannot be a missing named export)', () => {
			const src = "import * as ns from '@wordpress/theme';\nimport def from '@wordpress/theme';";
			assert.deepEqual( parseNamedImports( src, '@wordpress/theme' ), [] );
		} );

		it( 'returns empty when the provider is not imported', () => {
			assert.deepEqual( parseNamedImports( "import { x } from 'clsx';", '@wordpress/theme' ), [] );
		} );
	} );

	describe( 'parsePublicExports', () => {
		it( 'parses a consolidated export block', () => {
			const { names, opaque } = parsePublicExports(
				'export {\n  ThemeProvider,\n  privateApis\n};'
			);
			assert.deepEqual( names, [ 'ThemeProvider', 'privateApis' ] );
			assert.equal( opaque, false );
		} );

		it( 'uses the PUBLIC name for aliased exports (`x as y`)', () => {
			// This is the real shape of @wordpress/notices' built index.
			const { names } = parsePublicExports(
				'export { default2 as InlineNotices, default3 as SnackbarNotices, store };'
			);
			assert.deepEqual( names, [ 'InlineNotices', 'SnackbarNotices', 'store' ] );
		} );

		it( 'flags wildcard re-exports as opaque', () => {
			const { opaque } = parsePublicExports( "export * from './lib';\nexport { a };" );
			assert.equal( opaque, true );
		} );
	} );

	describe( 'checkContract', () => {
		it( 'passes when every imported symbol is exported', () => {
			const r = checkContract( {
				consumer: '@wordpress/boot',
				provider: '@wordpress/theme',
				imported: [ 'ThemeProvider' ],
				exported: [ 'ThemeProvider', 'privateApis' ],
			} );
			assert.equal( r.ok, true );
			assert.deepEqual( r.missing, [] );
		} );

		// ── THE JETPACK 16.0 REGRESSION ──────────────────────────────────────
		// boot imports `ThemeProvider`, but the shipped @wordpress/theme (0.15.1)
		// only exposed it privately → public exports were `[ privateApis ]`.
		// At runtime `wp.theme.ThemeProvider` was `undefined` → React #130 →
		// blank dashboard. This check must catch it at build time.
		it( 'FAILS on the 16.0 shape: boot imports ThemeProvider, theme 0.15.1 does not export it', () => {
			const r = checkContract( {
				consumer: '@wordpress/boot',
				provider: '@wordpress/theme',
				imported: [ 'ThemeProvider' ],
				exported: [ 'privateApis' ], // theme 0.15.1 public surface
			} );
			assert.equal( r.ok, false );
			assert.deepEqual( r.missing, [ 'ThemeProvider' ] );
		} );

		it( 'skips (passes) when the provider exports are opaque', () => {
			const r = checkContract( {
				consumer: '@wordpress/boot',
				provider: '@wordpress/theme',
				imported: [ 'ThemeProvider' ],
				exported: [],
				opaque: true,
			} );
			assert.equal( r.ok, true );
			assert.equal( r.skipped, true );
		} );
	} );

	describe( 'parseSimulateEnv', () => {
		it( 'parses pkg:symbol pairs', () => {
			assert.deepEqual( parseSimulateEnv( '@wordpress/theme:ThemeProvider' ), {
				'@wordpress/theme': [ 'ThemeProvider' ],
			} );
		} );

		it( 'parses multiple comma-separated pairs (scoped names keep their colon)', () => {
			assert.deepEqual(
				parseSimulateEnv( '@wordpress/theme:ThemeProvider,@wordpress/notices:SnackbarNotices' ),
				{
					'@wordpress/theme': [ 'ThemeProvider' ],
					'@wordpress/notices': [ 'SnackbarNotices' ],
				}
			);
		} );

		it( 'returns empty for undefined/blank', () => {
			assert.deepEqual( parseSimulateEnv( undefined ), {} );
			assert.deepEqual( parseSimulateEnv( '' ), {} );
		} );
	} );

	describe( 'package lists stay in sync with the build config', () => {
		it( 'PROVIDER_PACKAGES matches webpack classicPolyfills', () => {
			const webpack = require( '../../webpack.config.js' );
			const scriptNames = webpack
				.filter( c => c.name && c.name.startsWith( 'script-' ) )
				.map( c => '@wordpress/' + c.name.replace( 'script-', '' ) )
				.sort();
			assert.deepEqual( [ ...PROVIDER_PACKAGES ].sort(), scriptNames );
		} );

		it( 'CONSUMER_PACKAGES matches webpack modulePolyfills', () => {
			const webpack = require( '../../webpack.config.js' );
			const moduleNames = webpack
				.filter( c => c.name && c.name.startsWith( 'module-' ) )
				.map( c => '@wordpress/' + c.name.replace( 'module-', '' ) )
				.sort();
			assert.deepEqual( [ ...CONSUMER_PACKAGES ].sort(), moduleNames );
		} );
	} );

	describe( 'validateExportContracts (real installed tree)', () => {
		const packageRoot = path.join( __dirname, '..', '..' );

		it( 'passes against the actually-shipped @wordpress/* versions', () => {
			const result = validateExportContracts( { packageRoot } );
			// If a provider isn't installed the check simply skips it, so a
			// clean tree should always be ok. A failure here means a real skew.
			assert.equal( result.ok, true, result.error || 'unexpected contract failure' );
		} );

		it( 'detects a simulated skew (drops ThemeProvider from @wordpress/theme)', () => {
			const result = validateExportContracts( {
				packageRoot,
				simulateMissing: { '@wordpress/theme': [ 'ThemeProvider' ] },
			} );
			assert.equal( result.ok, false );
			const themeFailure = result.results.find( r => r.provider === '@wordpress/theme' && ! r.ok );
			assert.ok( themeFailure, 'expected a @wordpress/theme contract failure' );
			assert.ok( themeFailure.missing.includes( 'ThemeProvider' ) );
			assert.match( result.error, /16\.0 failure mode|ThemeProvider/ );
		} );
	} );
} );
