/**
 * Code frames are only worth building when something will read them.
 *
 * `buildCodeFrameError()` renders an excerpt of the surrounding source, so its
 * cost scales with the size of the file. Passing it directly as a `debug()`
 * argument looks free when debug output is off, but arguments are evaluated
 * eagerly, so the frame gets built for every matched call regardless. Over the
 * bundles this plugin runs on during a build that dominated the transform, so
 * these tests pin the behaviour: no debug output, no code frames.
 */

const mockOrigDebug = jest.requireActual( 'debug' );
const mockDebug = jest.fn();
// Only stand in for this plugin's own namespace — Babel itself logs through
// `debug`, and capturing every namespace would count its messages too.
jest.mock( 'debug', () => {
	return name => {
		if ( name.startsWith( '@automattic/babel-plugin-replace-textdomain' ) ) {
			return mockDebug;
		}
		return mockOrigDebug( name );
	};
} );

const { transformSync } = require( '@babel/core' );
const plugin = require( '../src/index.js' );

const babelOptions = { babelrc: false, configFile: false, filename: __filename };

/**
 * `NodePath.prototype`, read off a live path rather than imported, so these
 * tests do not need `@babel/traverse` as a dependency of their own.
 */
const nodePathProto = ( () => {
	let proto;
	transformSync( ';', {
		...babelOptions,
		plugins: [
			() => ( {
				visitor: {
					Program( path ) {
						proto = Object.getPrototypeOf( path );
					},
				},
			} ),
		],
	} );
	return proto;
} )();

/**
 * Build a source file with `count` gettext calls that are missing their domain
 * argument — the shape esbuild leaves behind, and the branch that used to build
 * a code frame every time.
 *
 * @param {number} count - Number of call sites to emit.
 * @return {string} Source code.
 */
function sourceWithMissingDomains( count ) {
	return Array.from( { length: count }, ( _, i ) => `__( 'string ${ i }' );` ).join( '\n' );
}

const stamp = ( code, pluginOptions = { textdomain: 'new-domain' } ) =>
	transformSync( code, { ...babelOptions, plugins: [ [ plugin, pluginOptions ] ] } ).code;

let spy;

beforeEach( () => {
	mockDebug.mockClear();
	mockDebug.enabled = false;
	spy = jest.spyOn( nodePathProto, 'buildCodeFrameError' );
} );

afterEach( () => {
	spy.mockRestore();
} );

describe( 'code frame construction', () => {
	it( 'builds no code frames when debug output is disabled', () => {
		const code = stamp( sourceWithMissingDomains( 25 ) );

		expect( spy ).not.toHaveBeenCalled();
		expect( mockDebug ).not.toHaveBeenCalled();
		// The stamp itself still happened. Babel quotes the inserted literal
		// itself, so match either quote style.
		expect( code.match( /["']new-domain["']/g ) ).toHaveLength( 25 );
	} );

	it( 'builds code frames when debug output is enabled', () => {
		mockDebug.enabled = true;

		stamp( sourceWithMissingDomains( 25 ) );

		expect( spy ).toHaveBeenCalledTimes( 25 );
		expect( mockDebug ).toHaveBeenCalledTimes( 25 );
	} );

	it( 'does no code frame work per call site as the file grows', () => {
		stamp( sourceWithMissingDomains( 1 ) );
		const afterOne = spy.mock.calls.length;

		stamp( sourceWithMissingDomains( 500 ) );
		const afterMany = spy.mock.calls.length;

		// Guards the complexity, not just the count: the old code built one
		// frame per call site, so this grew with the size of the bundle.
		expect( afterOne ).toBe( 0 );
		expect( afterMany ).toBe( 0 );
	} );

	it( 'produces identical output whether or not debug output is enabled', () => {
		const source = sourceWithMissingDomains( 10 );

		mockDebug.enabled = false;
		const quiet = stamp( source );

		mockDebug.enabled = true;
		const verbose = stamp( source );

		expect( quiet ).toBe( verbose );
	} );

	it( 'skips the frame for an unmapped domain when debug output is disabled', () => {
		// `textdomain` as an object leaves unlisted domains alone, which is the
		// other branch that logs through a code frame.
		const code = stamp( `__( 'foo', 'unmapped' );`, { textdomain: { other: 'x' } } );

		expect( spy ).not.toHaveBeenCalled();
		expect( code ).toContain( "'unmapped'" );
	} );

	it( 'skips the frame for a non-literal domain when debug output is disabled', () => {
		const code = stamp( `__( 'foo', someVariable );` );

		expect( spy ).not.toHaveBeenCalled();
		// A dynamic domain is left untouched.
		expect( code ).toContain( 'someVariable' );
	} );
} );
