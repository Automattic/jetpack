/**
 * CLI-contract tests for the `stamp-textdomains` bin: domain resolution from
 * composer.json vs `--domain`, the `--dir` override, and the failure mode when
 * no domain can be determined. The transform itself is covered by
 * stamp-textdomains.test.js; these run the real executable so the wrapper's
 * argument parsing and exit codes are exercised too.
 */

const { spawnSync } = require( 'child_process' );
const { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );

const BIN = path.join( __dirname, '..', '..', 'bin', 'stamp-textdomains.js' );

/**
 * Create a temp package dir with a stampable bundle.
 *
 * @param {object} options            - Options.
 * @param {string} [options.domain]   - Write composer.json with this `extra.textdomain`.
 * @param {string} [options.buildDir] - Relative build dir to create (default `build`).
 * @return {string} The temp package dir.
 */
function makePackage( { domain, buildDir = 'build' } = {} ) {
	const tmp = mkdtempSync( path.join( os.tmpdir(), 'stamp-textdomains-bin-' ) );
	const routeDir = path.join( tmp, buildDir, 'routes', 'dashboard' );
	mkdirSync( routeDir, { recursive: true } );
	writeFileSync( path.join( routeDir, 'content.js' ), 'x = (0, import_i18n.__)("Hello");\n' );
	if ( domain ) {
		writeFileSync(
			path.join( tmp, 'composer.json' ),
			JSON.stringify( { extra: { textdomain: domain } } )
		);
	}
	return tmp;
}

/**
 * Run the bin in a directory.
 *
 * @param {string}   cwd  - Working directory.
 * @param {string[]} args - CLI arguments.
 * @param {object}   env  - Extra environment variables.
 * @return {object} spawnSync result.
 */
function runBin( cwd, args = [], env = {} ) {
	return spawnSync( process.execPath, [ BIN, ...args ], {
		cwd,
		encoding: 'utf8',
		env: { ...process.env, CI: '', ...env },
	} );
}

describe( 'stamp-textdomains bin', () => {
	it( 'reads the domain from composer.json extra.textdomain and stamps build/', () => {
		const tmp = makePackage( { domain: 'jetpack-from-composer' } );
		try {
			const result = runBin( tmp );
			assert.equal( result.status, 0, result.stderr );
			assert.match( result.stdout, /stamped "jetpack-from-composer" onto 1 file/ );
			assert.ok(
				readFileSync(
					path.join( tmp, 'build', 'routes', 'dashboard', 'content.js' ),
					'utf8'
				).includes( '"jetpack-from-composer"' ),
				'bundle stamped with the composer.json domain'
			);
			assert.deepEqual(
				JSON.parse( readFileSync( path.join( tmp, 'build', 'i18n-manifest.json' ), 'utf8' ) ),
				{ bundles: [ 'build/routes/dashboard/content.js' ] },
				'the i18n manifest is written next to the stamped bundles'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( '--domain overrides composer.json', () => {
		const tmp = makePackage( { domain: 'jetpack-from-composer' } );
		try {
			const result = runBin( tmp, [ '--domain', 'jetpack-override' ] );
			assert.equal( result.status, 0, result.stderr );
			assert.ok(
				readFileSync(
					path.join( tmp, 'build', 'routes', 'dashboard', 'content.js' ),
					'utf8'
				).includes( '"jetpack-override"' ),
				'explicit --domain wins'
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( '--dir stamps an alternate build directory', () => {
		const tmp = makePackage( { domain: 'jetpack-d', buildDir: 'output' } );
		try {
			const result = runBin( tmp, [ '--dir', 'output' ] );
			assert.equal( result.status, 0, result.stderr );
			assert.match( result.stdout, /onto 1 file/ );
			assert.ok(
				readFileSync(
					path.join( tmp, 'output', 'routes', 'dashboard', 'content.js' ),
					'utf8'
				).includes( '"jetpack-d"' )
			);
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );

	it( 'caches under node_modules/.cache unless --no-cache is passed or CI is set', () => {
		const cached = makePackage( { domain: 'jetpack-c' } );
		const uncached = makePackage( { domain: 'jetpack-c' } );
		const onCi = makePackage( { domain: 'jetpack-c' } );
		try {
			const bundle = path.join( cached, 'build', 'routes', 'dashboard', 'content.js' );
			const source = readFileSync( bundle, 'utf8' );
			assert.match( runBin( cached ).stdout, /\(0 reused from cache\)/ );
			writeFileSync( bundle, source );
			assert.match( runBin( cached ).stdout, /\(1 reused from cache\)/ );
			assert.ok( existsSync( path.join( cached, 'node_modules', '.cache', 'stamp-textdomains' ) ) );

			assert.match( runBin( uncached, [ '--no-cache' ] ).stdout, /\(0 reused from cache\)/ );
			assert.ok( ! existsSync( path.join( uncached, 'node_modules' ) ), 'nothing cached' );

			assert.equal( runBin( onCi, [], { CI: 'true' } ).status, 0 );
			assert.ok( ! existsSync( path.join( onCi, 'node_modules' ) ), 'nothing cached on CI' );
		} finally {
			rmSync( cached, { recursive: true, force: true } );
			rmSync( uncached, { recursive: true, force: true } );
			rmSync( onCi, { recursive: true, force: true } );
		}
	} );

	it( 'fails with guidance when no domain can be determined', () => {
		const tmp = makePackage();
		try {
			const result = runBin( tmp );
			assert.notEqual( result.status, 0, 'exits non-zero without a domain' );
			assert.match( result.stderr, /no text domain/ );
			assert.match( result.stderr, /--domain or set extra\.textdomain/ );
		} finally {
			rmSync( tmp, { recursive: true, force: true } );
		}
	} );
} );
