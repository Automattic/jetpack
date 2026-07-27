import { decode } from '../query-string-decode';

describe( 'decode', () => {
	test( 'decodes well-formed percent-encoded values', () => {
		expect( decode( 'x=hello%20world' ) ).toEqual( { x: 'hello world' } );
	} );

	test( 'does not throw on malformed percent-encoding', () => {
		expect( () => decode( 'x=%MALFORMED%' ) ).not.toThrow();
		expect( () => decode( 'x=100%' ) ).not.toThrow();
		expect( () => decode( 'x=%' ) ).not.toThrow();
		expect( () => decode( 'x=%zz' ) ).not.toThrow();
		// Regression: a merge tag that happens to look hex-like (A-F) after the `%`.
		expect( () => decode( 'x=%ABTEST%' ) ).not.toThrow();
	} );

	test( 'treats any malformed value as empty, uniformly', () => {
		// Uniform regardless of what follows the `%` — no partial recovery, no special cases.
		expect( decode( 'x=%MALFORMED%' ) ).toEqual( { x: '' } );
		expect( decode( 'x=100%' ) ).toEqual( { x: '' } );
		expect( decode( 'x=%' ) ).toEqual( { x: '' } );
		expect( decode( 'x=%zz' ) ).toEqual( { x: '' } );
		expect( decode( 'x=%ABTEST%' ) ).toEqual( { x: '' } );
	} );

	test( 'keeps the key present (as an empty value) rather than dropping it', () => {
		// So a malformed search term still registers as an active query (see #50709 follow-up)
		// instead of Instant Search treating the page as having no search at all.
		expect( decode( 's=%MALFORMED%&sort=date' ) ).toEqual( { s: '', sort: 'date' } );
	} );

	test( 'still applies boolean/number coercion for the successful-decode path', () => {
		expect( decode( 'x=true', true, false ) ).toEqual( { x: true } );
		expect( decode( 'x=42', false, true ) ).toEqual( { x: 42 } );
	} );

	test( 'does not coerce a malformed value into a number', () => {
		// +'' === 0, so this must return early rather than fall through to number coercion.
		expect( decode( 'x=%zz', false, true ) ).toEqual( { x: '' } );
	} );
} );
