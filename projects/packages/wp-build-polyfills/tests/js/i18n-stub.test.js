/**
 * Tests for the i18n stub generator used by strip-unminified-prod.
 *
 * Production builds must not ship the unminified bundles, but GlotPress /
 * `wp i18n make-pot` ignore `*.min.js` — deleting `content.js` outright would
 * leave nothing to extract strings from, so no translation catalogs would be
 * generated at release. Instead of deleting a paired `.js`, the strip step
 * replaces it with a tiny stub containing only its gettext calls: same path
 * (so the md5-keyed catalog names stay correct), none of the code.
 */

const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );
const { makeI18nStub, isStub, STUB_HEADER } = require( '../../bin/i18n-stub-lib.js' );
const { strip } = require( '../../bin/strip-unminified-prod-lib.js' );

describe( 'makeI18nStub', () => {
	it( 'extracts a sequence-expression __ call (esbuild non-min shape) with its domain', () => {
		const code = 'var x = (0, import_i18n3.__)("Loading", "jetpack-videopress-pkg");';
		const stub = makeI18nStub( code );
		assert.ok( stub.includes( '__( "Loading", "jetpack-videopress-pkg" );' ) );
	} );

	it( 'extracts bare and member-expression calls', () => {
		const code = 'const a = __("Bare"); const b = i18n.__("Member", "some-domain");';
		const stub = makeI18nStub( code );
		assert.ok( stub.includes( '__( "Bare" );' ), 'bare call, no domain, kept without domain' );
		assert.ok( stub.includes( '__( "Member", "some-domain" );' ), 'member call kept' );
	} );

	it( 'skips a gettext-shaped call on an object that is not the i18n module', () => {
		const code =
			'const cache = { __: k => k };\n' +
			'const a = cache.__("some-key");\n' +
			'const b = window.wp.i18n.__("Real string", "d1");';
		const stub = makeI18nStub( code );
		assert.ok( stub.includes( '__( "Real string", "d1" );' ), 'the real call is extracted' );
		assert.ok(
			! stub.includes( 'some-key' ),
			"a bundled dependency's own `__` does not become a translatable string"
		);
	} );

	it( 'handles _x, _n, and _nx argument positions, normalizing the count to 1', () => {
		const code = [
			'var a = (0, i._x)("Go", "verb", "d1");',
			'var b = (0, i._n)("%d cat", "%d cats", n, "d1");',
			'var c = (0, i._nx)("%d apple", "%d apples", count(), "fruit", "d1");',
		].join( '\n' );
		const stub = makeI18nStub( code );
		assert.ok( stub.includes( '_x( "Go", "verb", "d1" );' ) );
		assert.ok( stub.includes( '_n( "%d cat", "%d cats", 1, "d1" );' ) );
		assert.ok( stub.includes( '_nx( "%d apple", "%d apples", 1, "fruit", "d1" );' ) );
	} );

	it( 'extracts optional-chaining calls (window.wp?.i18n?.__)', () => {
		const code = 'var label = window.wp?.i18n?.__("Hello from fixture", "strip-fixture");';
		const stub = makeI18nStub( code );
		assert.ok( stub !== null, 'optional call recognised' );
		assert.ok( stub.includes( '__( "Hello from fixture", "strip-fixture" );' ) );
	} );

	it( 'skips calls whose msgid is not a string literal', () => {
		const code = 'var x = (0, i.__)(someVariable, "d1"); var y = (0, i.__)("Real", "d1");';
		const stub = makeI18nStub( code );
		assert.ok( ! stub.includes( 'someVariable' ), 'dynamic msgid dropped' );
		assert.ok( stub.includes( '__( "Real", "d1" );' ), 'literal msgid kept' );
	} );

	it( 'carries translator comments through to the stub', () => {
		const code = [
			'/* translators: %s: user name. */',
			'var x = (0, i.__)("Hello, %s", "d1");',
		].join( '\n' );
		const stub = makeI18nStub( code );
		assert.ok(
			stub.includes( 'translators: %s: user name.' ),
			'translator comment preserved for make-pot'
		);
		const commentIndex = stub.indexOf( 'translators: %s: user name.' );
		const callIndex = stub.indexOf( '__( "Hello, %s", "d1" );' );
		assert.ok( commentIndex < callIndex, 'comment precedes its call' );
	} );

	it( 'deduplicates identical calls', () => {
		const code = 'a = (0, i.__)("Same", "d1"); b = (0, i.__)("Same", "d1");';
		const stub = makeI18nStub( code );
		const occurrences = stub.split( '__( "Same", "d1" );' ).length - 1;
		assert.equal( occurrences, 1 );
	} );

	it( 'returns null when the code contains no gettext calls', () => {
		assert.equal( makeI18nStub( 'const a = 1 + 2; console.log( a );' ), null );
	} );

	it( 'round-trips: stubbing a stub reproduces the same calls, and isStub detects it', () => {
		const code = 'var x = (0, i.__)("Loading", "d1"); var y = (0, i._x)("Go", "verb", "d1");';
		const stub = makeI18nStub( code );
		assert.ok( stub.startsWith( STUB_HEADER ), 'stub starts with the marker header' );
		assert.ok( isStub( stub ), 'isStub recognises generated stubs' );
		assert.ok( ! isStub( code ), 'isStub rejects ordinary code' );
		const restubbed = makeI18nStub( stub );
		assert.ok( restubbed.includes( '__( "Loading", "d1" );' ) );
		assert.ok( restubbed.includes( '_x( "Go", "verb", "d1" );' ) );
	} );
} );

describe( 'strip() with i18n stubbing', () => {
	/**
	 * Build a minimal fake wp-build output tree in a temp dir.
	 *
	 * @return {string} Path of the temp root (contains `build/`).
	 */
	function makeTree() {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'strip-i18n-stub-' ) );
		const routeDir = path.join( tmp, 'build', 'routes', 'dashboard' );
		const styleDir = path.join( tmp, 'build', 'styles', 'css-test' );
		mkdirSync( routeDir, { recursive: true } );
		mkdirSync( styleDir, { recursive: true } );

		// Paired .js WITH gettext calls → should become a stub.
		writeFileSync(
			path.join( routeDir, 'content.js' ),
			'var x = (0, import_i18n.__)("Hello", "jetpack-test");\nconsole.log("app code");\n'
		);
		writeFileSync(
			path.join( routeDir, 'content.min.js' ),
			'var x=(0,e.__)("Hello","jetpack-test");'
		);
		writeFileSync( path.join( routeDir, 'content.js.map' ), '{}' );

		// Paired .js WITHOUT gettext calls → should be deleted as before.
		writeFileSync( path.join( routeDir, 'route.js' ), 'export const r = 1;\n' );
		writeFileSync( path.join( routeDir, 'route.min.js' ), 'export const r=1;' );

		// Paired .css → should be deleted as before.
		writeFileSync( path.join( styleDir, 'style.css' ), 'body { color: red; }\n' );
		writeFileSync( path.join( styleDir, 'style.min.css' ), 'body{color:red}' );

		return tmp;
	}

	it( 'replaces a string-bearing paired .js with a stub, deletes the rest', () => {
		const tmp = makeTree();
		try {
			const buildDir = path.join( tmp, 'build' );
			const result = strip( buildDir );

			assert.equal( result.stubbedFiles, 1, 'content.js stubbed' );
			assert.equal( result.deletedFiles, 2, 'route.js and style.css deleted' );

			const routeDir = path.join( buildDir, 'routes', 'dashboard' );
			const stub = readFileSync( path.join( routeDir, 'content.js' ), 'utf8' );
			assert.ok( isStub( stub ), 'content.js replaced by a stub' );
			assert.ok( stub.includes( '__( "Hello", "jetpack-test" );' ), 'gettext call preserved' );
			assert.ok( ! stub.includes( 'app code' ), 'application code removed' );

			assert.ok(
				! existsSync( path.join( routeDir, 'content.js.map' ) ),
				'source map of the stubbed file deleted'
			);
			assert.ok( ! existsSync( path.join( routeDir, 'route.js' ) ), 'string-less .js deleted' );
			assert.ok(
				! existsSync( path.join( buildDir, 'styles', 'css-test', 'style.css' ) ),
				'unminified css deleted'
			);
			assert.ok(
				existsSync( path.join( routeDir, 'content.min.js' ) ),
				'minified sibling retained'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'is idempotent — a second pass leaves the stub alone and changes nothing', () => {
		const tmp = makeTree();
		try {
			const buildDir = path.join( tmp, 'build' );
			strip( buildDir );
			const stubBefore = readFileSync(
				path.join( buildDir, 'routes', 'dashboard', 'content.js' ),
				'utf8'
			);

			const second = strip( buildDir );
			assert.deepEqual( second, {
				deletedFiles: 0,
				stubbedFiles: 0,
				patchedFiles: 0,
				skipped: false,
			} );
			assert.equal(
				readFileSync( path.join( buildDir, 'routes', 'dashboard', 'content.js' ), 'utf8' ),
				stubBefore,
				'stub byte-identical after second pass'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );
} );
