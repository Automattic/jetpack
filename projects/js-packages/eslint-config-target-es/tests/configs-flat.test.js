const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const globals = require( 'globals' );
const { getRules } = require( '../src/funcs.js' );

/* global globalThis */

// "Mock" to ensure the same object is returned every time so `toEqual()` later won't try to descend it.
jest.mock( 'eslint-plugin-es-x', () => {
	globalThis.mockEsx ??= jest.requireActual( 'eslint-plugin-es-x' );
	return globalThis.mockEsx;
} );

// These create (and cd into) a temporary directory for each test, then clean it up after.
const pwd = process.cwd();
let tmpdir;

beforeEach( () => {
	tmpdir = fs.mkdtempSync( path.join( os.tmpdir(), 'eslint-config-target-es-test-' ) );
	fs.symlinkSync( path.join( __dirname, '../node_modules' ), path.join( tmpdir, 'node_modules' ) );
	process.chdir( tmpdir );
} );

afterEach( () => {
	process.chdir( pwd );
	if ( tmpdir ) {
		fs.rmSync( tmpdir, { force: true, recursive: true } );
	}
} );

/**
 * Load the config, bypassing normal module caching.
 *
 * @param {string} name - Config name.
 * @returns {object} Config.
 */
function loadConfig( name ) {
	let config;
	jest.isolateModules( () => {
		config = require( `../src/flatconfig/${ name }.js` );
	} );
	return config;
}

// The part of the config that doesn't vary.
const template = {
	plugins: {
		'es-x': require( 'eslint-plugin-es-x' ),
	},
	languageOptions: {
		ecmaVersion: 2022,
	},
};
if ( globals.es2022 ) {
	template.languageOptions.globals = globals.es2022;
}

// Configs and getRules options to test.
const configs = [
	[ 'language', { builtins: false } ],
	[ 'builtins', { builtins: true } ],
	[ 'all', {} ],
];

// Browserslist queries to test.
const queries = [ 'defaults', 'extends @wordpress/browserslist-config' ];

describe.each( configs )( 'Config "%s"', ( configName, options ) => {
	describe.each( queries )( 'for query "%s"', query => {
		test( 'Get config from package.json', () => {
			fs.writeFileSync(
				path.join( tmpdir, 'package.json' ),
				JSON.stringify( {
					browserslist: query,
				} )
			);
			expect( loadConfig( configName ) ).toEqual( {
				...template,
				rules: getRules( { ...options, query: query } ),
			} );
		} );

		test( 'Get config from .browserslistrc', () => {
			fs.writeFileSync( path.join( tmpdir, '.browserslistrc' ), query );
			expect( loadConfig( configName ) ).toEqual( {
				...template,
				rules: getRules( { ...options, query: query } ),
			} );
		} );
	} );
} );
