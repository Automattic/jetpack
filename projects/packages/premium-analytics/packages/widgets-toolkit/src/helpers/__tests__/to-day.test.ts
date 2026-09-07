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

	// The reason the stricter of the two former copies is the one hoisted: it
	// protects two callers for two different reasons. `post-traffic-activity`
	// feeds the result to parseISO/eachDayOfInterval, which throw on a
	// well-shaped but non-existent day. `post-detail-highlights` only compares
	// days as strings, so it wouldn't throw — but the loose check let a bad
	// `from` still lexically match real days, producing a plausible-looking
	// windowed sum instead of the documented all-time fallback.
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
