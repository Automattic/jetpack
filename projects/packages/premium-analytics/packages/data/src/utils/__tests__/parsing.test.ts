/**
 * Internal dependencies
 */
import { safeParseFloat, safeParseInt } from '../parsing';

describe( 'safeParseInt', () => {
	it( 'parses numeric strings', () => {
		expect( safeParseInt( '42' ) ).toBe( 42 );
		expect( safeParseInt( '0' ) ).toBe( 0 );
	} );

	it( 'falls back to 0 for missing or non-numeric values', () => {
		// The migration relies on this: a summary field absent from an empty-range
		// response must yield 0 (→ the widget's empty state), not NaN (→ NaN bars).
		expect( safeParseInt( undefined ) ).toBe( 0 );
		expect( safeParseInt( null ) ).toBe( 0 );
		expect( safeParseInt( '' ) ).toBe( 0 );
		expect( safeParseInt( 'abc' ) ).toBe( 0 );
	} );

	it( 'honors a custom fallback', () => {
		expect( safeParseInt( undefined, -1 ) ).toBe( -1 );
	} );
} );

describe( 'safeParseFloat', () => {
	it( 'parses decimal strings', () => {
		expect( safeParseFloat( '3.5' ) ).toBe( 3.5 );
		expect( safeParseFloat( '0' ) ).toBe( 0 );
	} );

	it( 'falls back to 0 for missing or non-numeric values', () => {
		expect( safeParseFloat( undefined ) ).toBe( 0 );
		expect( safeParseFloat( null ) ).toBe( 0 );
		expect( safeParseFloat( '' ) ).toBe( 0 );
		expect( safeParseFloat( 'abc' ) ).toBe( 0 );
	} );

	it( 'honors a custom fallback', () => {
		expect( safeParseFloat( undefined, -1 ) ).toBe( -1 );
	} );
} );
