const { execFileSync } = require( 'child_process' );
const assert = require( 'node:assert/strict' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const {
	handleToPackage,
	parsePhpConstArray,
	getShippedPackages,
	parseNamedImports,
	parsePublicExports,
	checkContract,
	validateExportContracts,
} = require( '../../bin/validate-export-contract-lib.js' );

const packageRoot = path.join( __dirname, '..', '..' );

describe( 'validate-export-contract', () => {
	it( 'parseNamedImports extracts imported names, honouring `as` aliases', () => {
		const src =
			"import { ThemeProvider } from '@wordpress/theme';\nimport { privateApis as p } from '@wordpress/route';";
		assert.deepEqual( parseNamedImports( src, '@wordpress/theme' ), [ 'ThemeProvider' ] );
		assert.deepEqual( parseNamedImports( src, '@wordpress/route' ), [ 'privateApis' ] );
	} );

	it( 'parsePublicExports reads export names, honouring `as` aliases and `export *`', () => {
		assert.deepEqual(
			parsePublicExports( 'export { default2 as SnackbarNotices, store };' ).names,
			[ 'SnackbarNotices', 'store' ]
		);
		assert.equal( parsePublicExports( "export * from './x';" ).opaque, true );
	} );

	// The Jetpack 16.0 regression: boot imports ThemeProvider, but theme 0.15.1 only
	// exported it privately, so at runtime `wp.theme.ThemeProvider` was undefined.
	it( 'checkContract fails when an imported symbol is not exported (the 16.0 shape)', () => {
		const bad = checkContract( {
			consumer: '@wordpress/boot',
			provider: '@wordpress/theme',
			imported: [ 'ThemeProvider' ],
			exported: [ 'privateApis' ],
		} );
		assert.equal( bad.ok, false );
		assert.deepEqual( bad.missing, [ 'ThemeProvider' ] );

		const good = checkContract( {
			consumer: '@wordpress/boot',
			provider: '@wordpress/theme',
			imported: [ 'ThemeProvider' ],
			exported: [ 'ThemeProvider' ],
		} );
		assert.equal( good.ok, true );
	} );

	it( 'derives providers/consumers from the PHP source of truth, matching webpack', () => {
		assert.equal( handleToPackage( 'wp-private-apis' ), '@wordpress/private-apis' );
		assert.deepEqual( parsePhpConstArray( "const X = array( 'wp-theme' );", 'X' ), [ 'wp-theme' ] );

		const { providers, consumers } = getShippedPackages( packageRoot );
		const webpack = require( '../../webpack.config.js' );
		const built = prefix =>
			webpack
				.filter( c => c.name && c.name.startsWith( prefix ) )
				.map( c => '@wordpress/' + c.name.replace( prefix, '' ) )
				.sort();
		assert.deepEqual( [ ...providers ].sort(), built( 'script-' ) );
		assert.deepEqual( [ ...consumers ].sort(), built( 'module-' ) );
	} );

	describe( 'against the installed tree', () => {
		it( 'passes for the actually-shipped @wordpress/* versions', () => {
			const result = validateExportContracts( { packageRoot } );
			assert.equal( result.ok, true, result.error || 'unexpected contract failure' );
		} );

		it( 'fails on a simulated skew (theme missing ThemeProvider)', () => {
			const result = validateExportContracts( {
				packageRoot,
				simulateMissing: { '@wordpress/theme': [ 'ThemeProvider' ] },
			} );
			assert.equal( result.ok, false );
			assert.match( result.error, /ThemeProvider/ );
		} );
	} );

	it( 'the CLI exits 0 when contracts hold', () => {
		execFileSync(
			process.execPath,
			[ path.join( packageRoot, 'bin', 'validate-export-contract.js' ) ],
			{
				cwd: packageRoot,
				stdio: 'pipe',
			}
		);
	} );
} );
