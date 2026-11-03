/**
 * Internal dependencies
 */
import { toDay } from '../to-day';

describe( 'toDay', () => {
	it( 'extracts the date-only part of an ISO date-time', () => {
		expect( toDay( '2026-05-04T13:45:00Z' ) ).toBe( '2026-05-04' );
	} );

	it( 'passes through a bare date', () => {
		expect( toDay( '2026-05-04' ) ).toBe( '2026-05-04' );
	} );

	it( 'returns undefined for undefined', () => {
		expect( toDay( undefined ) ).toBeUndefined();
	} );

	it( 'returns undefined for an empty string', () => {
		expect( toDay( '' ) ).toBeUndefined();
	} );

	it( 'returns undefined for a malformed shape', () => {
		expect( toDay( '04/05/2026' ) ).toBeUndefined();
		expect( toDay( '2026-5-4' ) ).toBeUndefined();
		expect( toDay( 'not-a-date' ) ).toBeUndefined();
	} );

	// Callers feed the result to date maths that throws on an impossible day, or
	// compare it as a string, where a loose check would lexically match real days.
	it( 'returns undefined for a well-shaped but impossible calendar date', () => {
		expect( toDay( '2026-02-31' ) ).toBeUndefined();
		expect( toDay( '2026-13-01' ) ).toBeUndefined();
	} );

	it( 'accepts a real leap day', () => {
		expect( toDay( '2024-02-29' ) ).toBe( '2024-02-29' );
	} );

	it( 'rejects a leap day in a non-leap year', () => {
		expect( toDay( '2026-02-29' ) ).toBeUndefined();
	} );
} );
