/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { drillDateRange } from '../drill-date-range';

/**
 * A UTC instant, so bucket boundaries are the same on every machine.
 *
 * @param iso - ISO string in UTC.
 * @return The date, in UTC.
 */
function utc( iso: string ): TZDate {
	return new TZDate( Date.parse( iso ), 'UTC' );
}

// Far past every bucket under test, so the clamp only fires where a test asks.
const NOW = utc( '2030-01-01T00:00:00.000Z' );

describe( 'drillDateRange', () => {
	it( 'opens the calendar day around the clicked instant', () => {
		const range = drillDateRange( utc( '2026-07-21T13:45:00.000Z' ), 'day', NOW );

		expect( range?.from?.getTime() ).toBe( Date.parse( '2026-07-21T00:00:00.000Z' ) );
		expect( range?.to?.getTime() ).toBe( Date.parse( '2026-07-21T23:59:59.999Z' ) );
	} );

	it( 'opens the ISO week, so a Sunday click stays in the week it was drawn in', () => {
		// 2026-07-26 is a Sunday: ISO weeks end there rather than starting there.
		const range = drillDateRange( utc( '2026-07-26T09:00:00.000Z' ), 'week', NOW );

		expect( range?.from?.getTime() ).toBe( Date.parse( '2026-07-20T00:00:00.000Z' ) );
		expect( range?.to?.getTime() ).toBe( Date.parse( '2026-07-26T23:59:59.999Z' ) );
	} );

	it( 'opens the calendar month', () => {
		const range = drillDateRange( utc( '2026-02-14T00:00:00.000Z' ), 'month', NOW );

		expect( range?.from?.getTime() ).toBe( Date.parse( '2026-02-01T00:00:00.000Z' ) );
		expect( range?.to?.getTime() ).toBe( Date.parse( '2026-02-28T23:59:59.999Z' ) );
	} );

	it( 'opens the calendar quarter', () => {
		const range = drillDateRange( utc( '2026-05-09T00:00:00.000Z' ), 'quarter', NOW );

		expect( range?.from?.getTime() ).toBe( Date.parse( '2026-04-01T00:00:00.000Z' ) );
		expect( range?.to?.getTime() ).toBe( Date.parse( '2026-06-30T23:59:59.999Z' ) );
	} );

	it( 'opens the calendar year', () => {
		const range = drillDateRange( utc( '2026-05-09T00:00:00.000Z' ), 'year', NOW );

		expect( range?.from?.getTime() ).toBe( Date.parse( '2026-01-01T00:00:00.000Z' ) );
		expect( range?.to?.getTime() ).toBe( Date.parse( '2026-12-31T23:59:59.999Z' ) );
	} );

	it( 'refuses to open an hour, the finest bucket the report draws', () => {
		expect( drillDateRange( utc( '2026-07-21T13:00:00.000Z' ), 'hour', NOW ) ).toBeNull();
	} );

	it( 'stops the window at now when the bucket is still in progress', () => {
		const now = utc( '2026-07-21T10:30:00.000Z' );
		const range = drillDateRange( utc( '2026-07-21T09:00:00.000Z' ), 'day', now );

		expect( range?.from?.getTime() ).toBe( Date.parse( '2026-07-21T00:00:00.000Z' ) );
		expect( range?.to?.getTime() ).toBe( now.getTime() );
	} );

	it( 'refuses a bucket that has not started', () => {
		const now = utc( '2026-07-21T10:30:00.000Z' );

		expect( drillDateRange( utc( '2026-07-22T00:00:00.000Z' ), 'day', now ) ).toBeNull();
	} );

	it( 'cuts the day on the timezone the clicked date carries, not the machine', () => {
		// 2026-07-21T02:00Z is still July 20 in New York, so the site's own day
		// is the one that opens.
		const range = drillDateRange(
			new TZDate( Date.parse( '2026-07-21T02:00:00.000Z' ), 'America/New_York' ),
			'day',
			NOW
		);

		expect( range?.from?.getTime() ).toBe( Date.parse( '2026-07-20T04:00:00.000Z' ) );
		expect( range?.to?.getTime() ).toBe( Date.parse( '2026-07-21T03:59:59.999Z' ) );
	} );
} );
