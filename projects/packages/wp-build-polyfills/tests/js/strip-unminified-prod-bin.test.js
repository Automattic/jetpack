/**
 * CLI-contract tests for the `strip-unminified-prod` bin: the skip path when
 * there is no build directory, and the one-line summary covering deletions,
 * i18n stubs, and PHP loader patches. The stripping logic itself is covered by
 * the lib and real-fixture tests; these run the real executable.
 */

const { spawnSync } = require( 'child_process' );
const { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );

const BIN = path.join( __dirname, '..', '..', 'bin', 'strip-unminified-prod.js' );

/**
 * Run the bin in a directory.
 *
 * @param {string} cwd - Working directory.
 * @return {object} spawnSync result.
 */
function runBin( cwd ) {
	return spawnSync( process.execPath, [ BIN ], { cwd, encoding: 'utf8' } );
}

describe( 'strip-unminified-prod bin', () => {
	it( 'skips gracefully when there is no build directory', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'strip-bin-' ) );
		try {
			const result = runBin( tmp );
			assert.equal( result.status, 0, result.stderr );
			assert.match( result.stdout, /no build\/ at .*, skipping\./ );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'reports deletions and i18n stubs in its summary', () => {
		const tmp = mkdtempSync( path.join( os.tmpdir(), 'strip-bin-' ) );
		try {
			const routeDir = path.join( tmp, 'build', 'routes', 'dashboard' );
			const styleDir = path.join( tmp, 'build', 'styles', 'css-test' );
			mkdirSync( routeDir, { recursive: true } );
			mkdirSync( styleDir, { recursive: true } );
			writeFileSync( path.join( routeDir, 'content.js' ), 'x = (0, i.__)("Hi", "d1");\n' );
			writeFileSync( path.join( routeDir, 'content.min.js' ), 'x=(0,i.__)("Hi","d1");' );
			writeFileSync( path.join( styleDir, 'style.css' ), 'body { color: red; }\n' );
			writeFileSync( path.join( styleDir, 'style.min.css' ), 'body{color:red}' );

			const result = runBin( tmp );
			assert.equal( result.status, 0, result.stderr );
			assert.match(
				result.stdout,
				/removed 1 unminified file\(s\); replaced 1 with i18n stub\(s\); patched 0 PHP loader\(s\)\./
			);
			assert.ok( existsSync( path.join( routeDir, 'content.js' ) ), 'stub left in place' );
			assert.ok( ! existsSync( path.join( styleDir, 'style.css' ) ), 'css deleted' );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );
} );
