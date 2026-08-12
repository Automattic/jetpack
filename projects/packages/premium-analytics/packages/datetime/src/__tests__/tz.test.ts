/**
 * External dependencies
 */
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
import { toLocalTZ } from '../tz';

/**
 * The calendar day and clock time the value resolves to in its own zone.
 * @param date
 */
const wallTime = ( date: Date ) => format( date, "yyyy-MM-dd'T'HH:mm:ss.SSS" );

describe( 'toLocalTZ', () => {
	describe( 'offset-less values are read as wall time in the target zone', () => {
		it.each( [ 'Europe/Amsterdam', 'America/New_York', 'Pacific/Kiritimati', '+00:00' ] )(
			'keeps a date-only value on its own calendar day in %s',
			timeZone => {
				expect( wallTime( toLocalTZ( '2026-06-29', timeZone ) ) ).toBe( '2026-06-29T00:00:00.000' );
			}
		);

		it( 'reads a MySQL datetime as site wall time', () => {
			expect( wallTime( toLocalTZ( '2026-07-09 09:42:57', 'America/New_York' ) ) ).toBe(
				'2026-07-09T09:42:57.000'
			);
		} );

		it( 'reads a `T`-separated datetime as site wall time', () => {
			expect( wallTime( toLocalTZ( '2026-07-09T09:42:57.123', 'America/New_York' ) ) ).toBe(
				'2026-07-09T09:42:57.123'
			);
		} );

		it( 'pads a truncated millisecond field', () => {
			expect( wallTime( toLocalTZ( '2026-07-09T09:42:57.5', 'America/New_York' ) ) ).toBe(
				'2026-07-09T09:42:57.500'
			);
		} );

		// Sub-millisecond precision must not drop the value through to `Date`,
		// which would read it in the browser's zone instead of the site's.
		it( 'truncates a sub-millisecond field rather than rejecting it', () => {
			expect( wallTime( toLocalTZ( '2026-07-09T09:42:57.123456', 'America/New_York' ) ) ).toBe(
				'2026-07-09T09:42:57.123'
			);
		} );

		it( 'anchors to UTC when no timezone is given', () => {
			expect( toLocalTZ( '2026-06-29' ).toISOString() ).toBe( '2026-06-29T00:00:00.000Z' );
		} );
	} );

	describe( 'daylight-saving wall times', () => {
		// Where DST starts at midnight, a date-only value names a wall time that
		// does not exist. It normalizes forward to 01:00, and the round-trip
		// guard has to accept that rather than read it as an impossible date.
		it.each( [
			[ 'America/Santiago', '2026-09-06' ],
			[ 'America/Havana', '2026-03-08' ],
		] )( 'keeps a date-only value on its day when %s has no midnight', ( timeZone, value ) => {
			const date = toLocalTZ( value, timeZone );

			expect( date.getTime() ).not.toBeNaN();
			expect( format( date, 'yyyy-MM-dd' ) ).toBe( value );
		} );

		it( 'normalizes a wall time skipped by a spring-forward jump', () => {
			expect( wallTime( toLocalTZ( '2026-03-08 02:30:00', 'America/New_York' ) ) ).toBe(
				'2026-03-08T03:30:00.000'
			);
		} );

		it( 'takes the first occurrence of an ambiguous fall-back wall time', () => {
			expect( toLocalTZ( '2026-11-01 01:30:00', 'America/New_York' ).toISOString() ).toBe(
				'2026-11-01T05:30:00.000Z'
			);
		} );
	} );

	describe( 'values that already identify an instant are left alone', () => {
		it( 'preserves the instant of an offset-bearing value', () => {
			// Midnight in Amsterdam is 18:00 the previous day in New York, and
			// re-anchoring would wrongly move it to New York midnight.
			expect( wallTime( toLocalTZ( '2026-06-29T00:00:00.000+02:00', 'America/New_York' ) ) ).toBe(
				'2026-06-28T18:00:00.000'
			);
		} );

		it( 'preserves the instant of a `Z`-suffixed value', () => {
			expect( toLocalTZ( '2026-06-29T00:00:00Z', '+00:00' ).toISOString() ).toBe(
				'2026-06-29T00:00:00.000Z'
			);
		} );

		it( 'preserves the instant of a timestamp', () => {
			const instant = Date.UTC( 2026, 5, 29, 3, 0, 0 );

			expect( toLocalTZ( instant, 'America/New_York' ).getTime() ).toBe( instant );
		} );

		it( 'preserves the instant of a Date', () => {
			const instant = new Date( Date.UTC( 2026, 5, 29, 3, 0, 0 ) );

			expect( toLocalTZ( instant, 'America/New_York' ).getTime() ).toBe( instant.getTime() );
		} );
	} );

	describe( 'malformed values', () => {
		it.each( [ '2026-02-31', '2026-13-01', '2026-06-00' ] )(
			'rejects the impossible date %s',
			value => {
				expect( toLocalTZ( value, 'America/New_York' ).getTime() ).toBeNaN();
			}
		);

		it( 'rejects a non-date string', () => {
			expect( toLocalTZ( 'not a date', 'America/New_York' ).getTime() ).toBeNaN();
		} );

		it.each( [ '2026-06-29T24:00:00', '2026-06-29T12:60:00', '2026-06-29T12:30:60' ] )(
			'rejects the invalid wall time %s',
			value => {
				expect( toLocalTZ( value, 'America/New_York' ).getTime() ).toBeNaN();
			}
		);
	} );

	it( 'returns the current instant in the zone when no value is given', () => {
		const before = Date.now();
		const now = toLocalTZ( undefined, 'America/New_York' ).getTime();

		expect( now ).toBeGreaterThanOrEqual( before );
		expect( now ).toBeLessThanOrEqual( Date.now() );
	} );
} );
