/**
 * Internal dependencies
 */
import { DEFAULT_REFETCH_INTERVAL, getStatsRefetchInterval } from '../refetch-interval';

// Already 09-30 in Tokyo, still 09-29 in Los Angeles.
const NOW = new Date( '2026-09-30T02:00:00Z' );

describe( 'getStatsRefetchInterval', () => {
	it( 'polls a window with no end date', () => {
		expect( getStatsRefetchInterval( undefined, 'UTC', NOW ) ).toBe( DEFAULT_REFETCH_INTERVAL );
	} );

	it( 'polls a window that ends today', () => {
		expect( getStatsRefetchInterval( '2026-09-30', 'UTC', NOW ) ).toBe( DEFAULT_REFETCH_INTERVAL );
	} );

	it( 'stops polling a window that ended before today', () => {
		expect( getStatsRefetchInterval( '2026-09-29', 'UTC', NOW ) ).toBe( false );
	} );

	it( 'polls a window that ends in the future', () => {
		expect( getStatsRefetchInterval( '2026-10-05', 'UTC', NOW ) ).toBe( DEFAULT_REFETCH_INTERVAL );
	} );

	it( 'keeps polling when the end date cannot be read', () => {
		expect( getStatsRefetchInterval( 'not-a-date', 'UTC', NOW ) ).toBe( DEFAULT_REFETCH_INTERVAL );
	} );

	// Each row gives a different answer in UTC than in the report zone.
	it.each( [
		[ 'behind UTC: date-only end is still today', '2026-09-29', 'America/Los_Angeles', NOW, true ],
		[
			'ahead of UTC: date-only end already passed',
			'2026-09-30',
			'Asia/Tokyo',
			new Date( '2026-09-30T20:00:00Z' ),
			false,
		],
		[
			'fixed-offset zone ahead of UTC',
			'2026-09-30',
			'+09:00',
			new Date( '2026-09-30T20:00:00Z' ),
			false,
		],
		[
			'offset end stamp read as the report zone day',
			'2026-09-29T20:00:00-07:00',
			'America/Los_Angeles',
			new Date( '2026-09-30T08:00:00Z' ),
			false,
		],
	] )( 'reads dates in the report timezone: %s', ( _label, end, timezone, now, polls ) => {
		expect( getStatsRefetchInterval( end, timezone, now ) ).toBe(
			polls ? DEFAULT_REFETCH_INTERVAL : false
		);
	} );
} );
