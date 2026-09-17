import { getSubpage, splitHash, SUBPAGES } from './runtime-contract';

describe( 'getSubpage', () => {
	it.each( SUBPAGES )( 'matches %s', subpage => {
		expect( getSubpage( `#/${ subpage }` ) ).toBe( subpage );
	} );

	it( 'tolerates a trailing slash', () => {
		expect( getSubpage( '#/getting-started/' ) ).toBe( 'getting-started' );
	} );

	it( 'ignores a hash query when matching', () => {
		expect( getSubpage( '#/cache-debug-log?x=1' ) ).toBe( 'cache-debug-log' );
	} );

	it.each( [ '', '#', '#/' ] )( 'returns null for the root (%p)', hash => {
		expect( getSubpage( hash ) ).toBeNull();
	} );

	it( 'returns null for an unrecognised path', () => {
		expect( getSubpage( '#/nope' ) ).toBeNull();
	} );
} );

describe( 'splitHash', () => {
	it( 'separates the path from the hash query', () => {
		const { path, query } = splitHash( '#/cache-debug-log?x=1&y=2' );

		expect( path ).toBe( 'cache-debug-log' );
		expect( query.get( 'x' ) ).toBe( '1' );
		expect( query.get( 'y' ) ).toBe( '2' );
	} );

	it( 'gives an empty query when the hash carries none', () => {
		expect( splitHash( '#/getting-started' ).query.toString() ).toBe( '' );
	} );
} );
