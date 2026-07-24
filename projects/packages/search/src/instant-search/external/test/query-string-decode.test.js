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
	} );

	test( 'recovers bare/invalid percent escapes as literal text instead of dropping them', () => {
		// e.g. an unresolved email merge tag like `%DONOR%` — kept as plain text.
		expect( decode( 's=%MALFORMED%' ) ).toEqual( { s: '%MALFORMED%' } );
		expect( decode( 'x=100%' ) ).toEqual( { x: '100%' } );
		expect( decode( 'x=%' ) ).toEqual( { x: '%' } );
		expect( decode( 'x=%zz' ) ).toEqual( { x: '%zz' } );
	} );

	test( 'drops a key only for a well-formed-but-undecodable escape', () => {
		// %E0%A4: a valid %XX pair (untouched by sanitizing) that's a truncated UTF-8 sequence.
		expect( decode( 'x=%E0%A4' ) ).toEqual( {} );
	} );

	test( 'drops only the malformed key, keeping other well-formed keys intact', () => {
		expect( decode( 's=foo&bad=%E0%A4&sort=date' ) ).toEqual( { s: 'foo', sort: 'date' } );
	} );

	test( 'still applies boolean/number coercion for the successful-decode path', () => {
		expect( decode( 'x=true', true, false ) ).toEqual( { x: true } );
		expect( decode( 'x=42', false, true ) ).toEqual( { x: 42 } );
	} );
} );
