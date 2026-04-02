const { existsSync, writeFileSync, mkdirSync, rmSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const {
	validateBootAsset,
	parseHandles,
	CORE_SCRIPT_HANDLES,
	POLYFILL_HANDLES,
} = require( '../../bin/validate-boot-asset-lib.js' );

describe( 'validate-boot-asset', () => {
	describe( 'parseHandles', () => {
		it( 'should parse handles from a PHP asset file', () => {
			const content =
				"<?php return array('dependencies' => array('react', 'wp-data', 'wp-element'), 'version' => 'abc');";
			const handles = parseHandles( content );
			assert.deepEqual( handles, [ 'react', 'wp-data', 'wp-element' ] );
		} );

		it( 'should return empty array for unparseable content', () => {
			assert.deepEqual( parseHandles( 'not a php file' ), [] );
		} );

		it( 'should return empty array for empty dependencies', () => {
			const content = "<?php return array('dependencies' => array(), 'version' => 'abc');";
			assert.deepEqual( parseHandles( content ), [] );
		} );
	} );

	describe( 'validateBootAsset', () => {
		it( 'should return error for missing file', () => {
			const result = validateBootAsset( '/nonexistent/path/asset.php' );
			assert.equal( result.ok, false );
			assert.match( result.error, /not found/ );
		} );

		it( 'should pass for a file with only known handles', () => {
			const tmpDir = path.join( __dirname, '.tmp-test-valid' );
			const tmpFile = path.join( tmpDir, 'index.asset.php' );
			try {
				mkdirSync( tmpDir, { recursive: true } );
				writeFileSync(
					tmpFile,
					"<?php return array('dependencies' => array('react', 'wp-data', 'wp-element', 'wp-theme'), 'version' => 'abc');\n"
				);
				const result = validateBootAsset( tmpFile );
				assert.equal( result.ok, true );
			} finally {
				rmSync( tmpDir, { recursive: true, force: true } );
			}
		} );

		it( 'should fail for a file with unknown handles', () => {
			const tmpDir = path.join( __dirname, '.tmp-test-unknown' );
			const tmpFile = path.join( tmpDir, 'index.asset.php' );
			try {
				mkdirSync( tmpDir, { recursive: true } );
				writeFileSync(
					tmpFile,
					"<?php return array('dependencies' => array('react', 'wp-data', 'wp-ui', 'wp-nonexistent'), 'version' => 'abc');\n"
				);
				const result = validateBootAsset( tmpFile );
				assert.equal( result.ok, false );
				assert.deepEqual( result.unknownHandles, [ 'wp-ui', 'wp-nonexistent' ] );
				assert.match( result.error, /wp-ui/ );
				assert.match( result.error, /wp-nonexistent/ );
			} finally {
				rmSync( tmpDir, { recursive: true, force: true } );
			}
		} );

		it( 'should validate the actual built asset file has no unknown handles', () => {
			const assetFile = path.join(
				__dirname,
				'..',
				'..',
				'build',
				'modules',
				'boot',
				'index.asset.php'
			);

			if ( ! existsSync( assetFile ) ) {
				// Skip if not built — the PHP test and build step cover this too.
				return;
			}

			const result = validateBootAsset( assetFile );
			assert.equal(
				result.ok,
				true,
				result.error || 'Built asset file should not contain unknown handles'
			);
		} );
	} );

	describe( 'known handles lists', () => {
		it( 'CORE_SCRIPT_HANDLES should include common WordPress handles', () => {
			assert.ok( CORE_SCRIPT_HANDLES.has( 'wp-data' ) );
			assert.ok( CORE_SCRIPT_HANDLES.has( 'wp-element' ) );
			assert.ok( CORE_SCRIPT_HANDLES.has( 'wp-components' ) );
			assert.ok( CORE_SCRIPT_HANDLES.has( 'react' ) );
		} );

		it( 'POLYFILL_HANDLES should match the PHP class constants', () => {
			assert.ok( POLYFILL_HANDLES.has( 'wp-notices' ) );
			assert.ok( POLYFILL_HANDLES.has( 'wp-private-apis' ) );
			assert.ok( POLYFILL_HANDLES.has( 'wp-theme' ) );
			assert.equal( POLYFILL_HANDLES.size, 3 );
		} );
	} );
} );
