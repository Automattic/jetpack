/**
 * CLI-contract tests for the `emit-widget-strings` bin: domain and schema
 * resolution, the path overrides, and the failure modes. The emitter itself
 * is covered by emit-widget-strings.test.js; these run the real executable.
 */

const { spawnSync } = require( 'child_process' );
const { existsSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync } = require( 'fs' );
const assert = require( 'node:assert/strict' );
const os = require( 'node:os' );
const { describe, it } = require( 'node:test' );
const path = require( 'path' );

const BIN = path.join( __dirname, '..', '..', 'bin', 'emit-widget-strings.js' );
const SCHEMA = { title: 'widget title', keywords: [ 'widget keyword' ] };

/**
 * Create a temp package dir.
 *
 * @param {object}  options          - Options.
 * @param {string}  [options.domain] - Write composer.json with this `extra.textdomain`.
 * @param {boolean} [options.schema] - Write `src/widget-i18n.json`.
 * @param {object}  [options.widget] - Write `widgets/one/widget.json` with this manifest.
 * @return {string} The temp package dir.
 */
function makePackage( {
	domain,
	schema = true,
	widget = { title: 'One', keywords: [ 'k' ] },
} = {} ) {
	const tmp = mkdtempSync( path.join( os.tmpdir(), 'emit-widget-strings-bin-' ) );
	if ( domain ) {
		writeFileSync(
			path.join( tmp, 'composer.json' ),
			JSON.stringify( { extra: { textdomain: domain } } )
		);
	}
	if ( schema ) {
		mkdirSync( path.join( tmp, 'src' ) );
		writeFileSync( path.join( tmp, 'src', 'widget-i18n.json' ), JSON.stringify( SCHEMA ) );
	}
	if ( widget ) {
		mkdirSync( path.join( tmp, 'widgets', 'one' ), { recursive: true } );
		writeFileSync( path.join( tmp, 'widgets', 'one', 'widget.json' ), JSON.stringify( widget ) );
	}
	return tmp;
}

/**
 * Run the bin in a directory.
 *
 * @param {string}   cwd  - Working directory.
 * @param {string[]} args - CLI arguments.
 * @return {object} spawnSync result.
 */
function runBin( cwd, args = [] ) {
	return spawnSync( process.execPath, [ BIN, ...args ], { cwd, encoding: 'utf8' } );
}

describe( 'emit-widget-strings bin', () => {
	it( 'reads the domain and schema from the package and writes build/widgets/widget-strings.php', () => {
		const tmp = makePackage( { domain: 'pkg-from-composer' } );
		const result = runBin( tmp );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /wrote 2 string\(s\) from 1 widget\.json file\(s\)/ );
		const php = readFileSync( path.join( tmp, 'build', 'widgets', 'widget-strings.php' ), 'utf8' );
		assert.ok( php.includes( "_x( 'One', 'widget title', 'pkg-from-composer' );" ) );
		assert.ok( php.includes( "_x( 'k', 'widget keyword', 'pkg-from-composer' );" ) );
	} );

	it( 'honours --domain, --schema, --widgets and --out', () => {
		const tmp = makePackage( { schema: false, widget: null } );
		writeFileSync( path.join( tmp, 'schema.json' ), JSON.stringify( SCHEMA ) );
		mkdirSync( path.join( tmp, 'elsewhere', 'two' ), { recursive: true } );
		writeFileSync(
			path.join( tmp, 'elsewhere', 'two', 'widget.json' ),
			JSON.stringify( { title: 'Two' } )
		);
		const result = runBin( tmp, [
			'--domain',
			'flag-domain',
			'--schema',
			'schema.json',
			'--widgets',
			'elsewhere',
			'--out',
			'out/strings.php',
		] );
		assert.equal( result.status, 0, result.stderr );
		assert.ok(
			readFileSync( path.join( tmp, 'out', 'strings.php' ), 'utf8' ).includes(
				"_x( 'Two', 'widget title', 'flag-domain' );"
			)
		);
	} );

	it( 'reports nothing to emit and leaves no file when no manifest carries a string', () => {
		const tmp = makePackage( { domain: 'pkg', widget: { name: 'x/one' } } );
		const result = runBin( tmp );
		assert.equal( result.status, 0, result.stderr );
		assert.match( result.stdout, /nothing to emit from 1 widget\.json file\(s\)/ );
		assert.ok( ! existsSync( path.join( tmp, 'build', 'widgets', 'widget-strings.php' ) ) );
	} );

	it( 'fails without a text domain', () => {
		const result = runBin( makePackage() );
		assert.notEqual( result.status, 0 );
		assert.match( result.stderr, /no text domain/ );
	} );

	it( 'fails without an i18n schema', () => {
		const result = runBin( makePackage( { domain: 'pkg', schema: false } ) );
		assert.notEqual( result.status, 0 );
		assert.match( result.stderr, /no i18n schema/ );
	} );
} );
