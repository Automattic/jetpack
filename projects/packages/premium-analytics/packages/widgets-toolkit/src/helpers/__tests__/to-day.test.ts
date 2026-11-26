/**
 * Internal dependencies
 */
import { toDay, toDayRange } from '../to-day';

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

describe( 'toDayRange', () => {
	it( 'slices the date part off both ISO bounds', () => {
		expect(
			toDayRange( '2026-07-01T00:00:00.000+08:00', '2026-07-07T23:59:59.999+08:00' )
		).toEqual( { from: '2026-07-01', to: '2026-07-07' } );
	} );

	it.each( [
		[ 'a missing from', undefined, '2026-07-07T23:59:59.999+08:00' ],
		[ 'an invalid to', '2026-07-01T00:00:00.000+08:00', '2026-02-31T00:00:00.000+08:00' ],
	] )( 'returns undefined for %s', ( _case, from, to ) => {
		expect( toDayRange( from, to ) ).toBeUndefined();
	} );
} );
