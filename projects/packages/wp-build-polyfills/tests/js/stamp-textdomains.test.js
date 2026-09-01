/**
 * Tests for the stamp-textdomains post-build tool. It runs
 * `@automattic/babel-plugin-replace-textdomain` over the esbuild output of a
 * wp-build dashboard so every gettext call in the built bundle carries the
 * package text domain — the domain that never survives esbuild's
 * externalization of `@wordpress/i18n`.
 *
 * Shapes exercised mirror real esbuild output: a `SequenceExpression`-wrapped
 * member call `(0, import_i18n.__)(…)` in the readable `.js` and the compact
 * `(0,e.__)(…)` in the `.min.js`.
 */

const crypto = require( 'crypto' );
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const {
	stampCode,
	stampDir,
	refreshAssetVersion,
	writeI18nManifest,
	I18N_MANIFEST,
} = require( '../../bin/stamp-textdomains-lib.js' );

const DOMAIN = 'jetpack-videopress-pkg';

/**
 * wp-build's content hash for an emitted bundle: sha256, first 20 hex chars.
 *
 * @param {string} file - Path to the emitted file.
 * @return {string} The expected `'version'` value.
 */
function contentHash( file ) {
	return crypto
		.createHash( 'sha256' )
		.update( readFileSync( file ) )
		.digest( 'hex' )
		.slice( 0, 20 );
}

describe( 'stamp-textdomains', () => {
	it( 'adds domain to a bare sequence-expression call (esbuild non-min shape)', () => {
		const input = 'x = (0, import_i18n3.__)("Loading");';
		assert.ok(
			stampCode( input, DOMAIN, false ).includes( '"Loading", "jetpack-videopress-pkg"' ),
			'domain should be appended to the bare __() call'
		);
	} );

	it( 'replaces a wrong domain', () => {
		const input = 'x = (0, import_i18n.__)("Err: %s", "jetpack-connection-js");';
		const out = stampCode( input, DOMAIN, false );
		assert.ok( out.includes( '"jetpack-videopress-pkg"' ), 'target domain present' );
		assert.ok( ! out.includes( 'jetpack-connection-js' ), 'wrong domain removed' );
	} );

	it( 'keeps an already-correct domain (idempotent)', () => {
		const input = 'x = (0, import_i18n.__)("Hi", "jetpack-videopress-pkg");';
		const once = stampCode( input, DOMAIN, false );
		assert.equal( stampCode( once, DOMAIN, false ), once, 'second pass is byte-identical' );
	} );

	it( 'handles the minified member-call shape and stays compact', () => {
		const input = 'var a=(0,e.__)("Jetpack Logo","jetpack-components"),b=(0,e._x)("Go","verb");';
		const out = stampCode( input, DOMAIN, true );
		assert.ok(
			out.includes( '"Jetpack Logo","jetpack-videopress-pkg"' ),
			'__ domain replaced compactly'
		);
		assert.ok(
			out.includes( '"Go","verb","jetpack-videopress-pkg"' ),
			'_x context kept, domain appended compactly'
		);
		assert.ok( ! /\n./.test( out ), 'output stays a single line' );
	} );

	it( 'appends the domain to _n at argument index 3', () => {
		const input = 'x = (0, i._n)("%d cat", "%d cats", n);';
		assert.ok(
			stampCode( input, DOMAIN, false ).includes( '"jetpack-videopress-pkg"' ),
			'_n gets a domain after the count argument'
		);
	} );

	it( 'leaves a gettext-shaped call on an unrelated object alone', () => {
		// What a bundled dependency's own cache/registry helper looks like once
		// esbuild has inlined it next to the real gettext calls.
		const input = 'var cache={__:k=>k};var v=cache.__("some-key");';
		assert.equal( stampCode( input, DOMAIN, true ), input, 'the call is untouched' );
	} );

	it( 'stamps a call whose callee traces back to @wordpress/i18n', () => {
		const input =
			'var require_i18n=__commonJS({"package-external:@wordpress/i18n"(exports,module){module.exports=window.wp.i18n;}});' +
			'var import_i18n=__toESM(require_i18n(),1);var v=(0,import_i18n.__)("Hi");';
		assert.ok(
			stampCode( input, DOMAIN, true ).includes( '"Hi","jetpack-videopress-pkg"' ),
			'the real gettext call is stamped'
		);
	} );

	it( 'stampDir walks routes, rewrites both .js and .min.js, and rehashes the paired .asset.php', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const routeDir = path.join( tmp, 'build', 'routes', 'dashboard' );
			mkdirSync( routeDir, { recursive: true } );

			const jsFile = path.join( routeDir, 'content.js' );
			const minFile = path.join( routeDir, 'content.min.js' );
			// wp-build emits the asset file next to the minified bundle only.
			const assetFile = path.join( routeDir, 'content.min.asset.php' );

			writeFileSync( jsFile, 'x = (0, import_i18n.__)("Hello");\n' );
			writeFileSync( minFile, 'var a=(0,e.__)("Hello");' );
			writeFileSync(
				assetFile,
				"<?php return array('dependencies' => array('wp-i18n'), 'version' => 'abc');\n"
			);

			const count = stampDir( path.join( tmp, 'build' ), DOMAIN );
			assert.equal( count, 2, 'both .js and .min.js stamped' );

			assert.ok(
				readFileSync( jsFile, 'utf8' ).includes( '"jetpack-videopress-pkg"' ),
				'unminified bundle stamped'
			);
			assert.ok(
				readFileSync( minFile, 'utf8' ).includes( '"jetpack-videopress-pkg"' ),
				'minified bundle stamped'
			);

			const asset = readFileSync( assetFile, 'utf8' );
			assert.equal(
				asset,
				`<?php return array('dependencies' => array('wp-i18n'), 'version' => '${ contentHash(
					minFile
				) }');\n`,
				'only the version changed, and it matches the stamped bytes'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'refreshAssetVersion leaves a bundle with no paired asset file alone', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const routeDir = path.join( tmp, 'build', 'routes', 'dashboard' );
			mkdirSync( routeDir, { recursive: true } );

			const jsFile = path.join( routeDir, 'content.js' );
			const minAssetFile = path.join( routeDir, 'content.min.asset.php' );
			writeFileSync( jsFile, 'x = 1;\n' );
			const minAssetSource = "<?php return array('version' => 'abc');\n";
			writeFileSync( minAssetFile, minAssetSource );

			assert.equal( refreshAssetVersion( jsFile ), false, 'content.js pairs with no asset file' );
			assert.equal(
				readFileSync( minAssetFile, 'utf8' ),
				minAssetSource,
				"the minified bundle's asset file is not the unminified bundle's"
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'refreshAssetVersion leaves an asset file with no version entry alone', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const file = path.join( tmp, 'index.min.js' );
			const assetFile = path.join( tmp, 'index.min.asset.php' );
			writeFileSync( file, 'var a=1;' );
			const assetSource = "<?php return array('dependencies' => array());\n";
			writeFileSync( assetFile, assetSource );

			assert.equal( refreshAssetVersion( file ), false );
			assert.equal( readFileSync( assetFile, 'utf8' ), assetSource );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'writeI18nManifest lists only string-bearing non-min bundles, sorted, across subdirs', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const buildDir = path.join( tmp, 'build' );
			const routeDir = path.join( buildDir, 'routes', 'dashboard' );
			const widgetDir = path.join( buildDir, 'widgets', 'latest-post' );
			const moduleDir = path.join( buildDir, 'modules', 'init' );
			mkdirSync( routeDir, { recursive: true } );
			mkdirSync( widgetDir, { recursive: true } );
			mkdirSync( moduleDir, { recursive: true } );

			// String-bearing bundles in three subdirs; the min variant must not be listed.
			writeFileSync(
				path.join( widgetDir, 'render.js' ),
				'x = (0, import_i18n.__)("Published %s");\n'
			);
			writeFileSync( path.join( routeDir, 'content.js' ), 'x = (0, i.__)("Hello");\n' );
			writeFileSync( path.join( routeDir, 'content.min.js' ), 'var a=(0,e.__)("Hello");' );
			// String-less bundle and non-JS files must not be listed.
			writeFileSync( path.join( moduleDir, 'index.js' ), 'export const answer = 42;\n' );
			writeFileSync( path.join( routeDir, 'content.asset.php' ), '<?php return array();\n' );

			const bundles = writeI18nManifest( buildDir );

			const expected = [
				'build/routes/dashboard/content.js',
				'build/widgets/latest-post/render.js',
			];
			assert.deepEqual( bundles, expected, 'returns the sorted string-bearing bundle list' );
			assert.deepEqual(
				JSON.parse( readFileSync( path.join( buildDir, I18N_MANIFEST ), 'utf8' ) ),
				{ bundles: expected },
				'manifest file holds the same list'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'writeI18nManifest keys entries off the build directory name', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-' ) );
		try {
			const buildDir = path.join( tmp, 'output' );
			const routeDir = path.join( buildDir, 'routes', 'a' );
			mkdirSync( routeDir, { recursive: true } );
			writeFileSync( path.join( routeDir, 'content.js' ), 'x = (0, i.__)("Hi");\n' );

			assert.deepEqual( writeI18nManifest( buildDir ), [ 'output/routes/a/content.js' ] );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );
} );
