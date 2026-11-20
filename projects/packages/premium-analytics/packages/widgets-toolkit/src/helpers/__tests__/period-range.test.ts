/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { bucketRange, monthRange, yearRange } from '../period-range';

const bounds = {
	lifeStartsAt: new Date( '2026-04-10T16:27:32Z' ),
	timeZone: 'UTC',
	now: new Date( '2026-09-09T12:00:00Z' ),
};

describe( 'monthRange', () => {
	it( 'opens a whole month inside the post life', () => {
		expect( monthRange( { year: 2026, month: 5 }, bounds ) ).toEqual( {
			range: {
				from: new Date( '2026-06-01T00:00:00.000Z' ),
				to: new Date( '2026-06-30T23:59:59.999Z' ),
			},
			step: 'P1M',
		} );
	} );

	it( 'starts the first month on the day the life starts, leaving its step to the arrows', () => {
		expect( monthRange( { year: 2026, month: 3 }, bounds ) ).toEqual( {
			range: {
				from: new Date( '2026-04-10T00:00:00.000Z' ),
				to: new Date( '2026-04-30T23:59:59.999Z' ),
			},
		} );
	} );

	it( 'ends the current month now, still stepping it by the month', () => {
		expect( monthRange( { year: 2026, month: 8 }, bounds ) ).toEqual( {
			range: { from: new Date( '2026-09-01T00:00:00.000Z' ), to: bounds.now },
			step: 'P1M',
		} );
	} );

	it( 'reads the month on the site calendar', () => {
		const range = monthRange(
			{ year: 2026, month: 5 },
			{ ...bounds, timeZone: 'America/New_York' }
		)?.range;

		expect( range?.from.toISOString() ).toBe( '2026-06-01T04:00:00.000Z' );
		expect( range?.to.toISOString() ).toBe( '2026-07-01T03:59:59.999Z' );
	} );

	it( 'has nothing to open before the post existed or after today', () => {
		expect( monthRange( { year: 2026, month: 2 }, bounds ) ).toBeNull();
		expect( monthRange( { year: 2026, month: 9 }, bounds ) ).toBeNull();
	} );

	it( 'opens the whole month without a life start', () => {
		expect(
			monthRange( { year: 2026, month: 0 }, { ...bounds, lifeStartsAt: undefined } )
		).toEqual( {
			range: {
				from: new Date( '2026-01-01T00:00:00.000Z' ),
				to: new Date( '2026-01-31T23:59:59.999Z' ),
			},
			step: 'P1M',
		} );
	} );
} );

describe( 'yearRange', () => {
	it( 'opens the year cut to the post life, leaving its step to the arrows', () => {
		expect( yearRange( 2026, bounds ) ).toEqual( {
			range: { from: new Date( '2026-04-10T00:00:00.000Z' ), to: bounds.now },
		} );
	} );

	it( 'opens a whole past year', () => {
		expect(
			yearRange( 2025, { ...bounds, lifeStartsAt: new Date( '2024-01-01T00:00:00Z' ) } )
		).toEqual( {
			range: {
				from: new Date( '2025-01-01T00:00:00.000Z' ),
				to: new Date( '2025-12-31T23:59:59.999Z' ),
			},
			step: 'P1Y',
		} );
	} );

	it( 'has nothing to open for a year after today', () => {
		expect( yearRange( 2027, bounds ) ).toBeNull();
	} );
} );

describe( 'bucketRange', () => {
	const clock = { timeZone: 'UTC', now: new Date( '2027-01-01T00:00:00Z' ) };
	const window = {
		from: localTZDate( '2022-01-01T00:00:00.000Z', 'UTC' ),
		to: localTZDate( '2026-12-31T23:59:59.999Z', 'UTC' ),
	};

	it( 'opens the bucket holding the date', () => {
		expect(
			bucketRange( { date: new Date( '2026-07-22T00:00:00Z' ) }, 'week', window, clock )
		).toEqual( {
			range: {
				from: new Date( '2026-07-20T00:00:00.000Z' ),
				to: new Date( '2026-07-26T23:59:59.999Z' ),
			},
			step: 'P7D',
		} );
	} );

	it( 'cuts the bucket on the site clock, not the browser one', () => {
		const auckland = { timeZone: 'Pacific/Auckland', now: clock.now };

		// 20:00 UTC on Jul 21 is already Jul 22 in Auckland (UTC+12).
		expect(
			bucketRange( { date: new Date( '2026-07-21T20:00:00Z' ) }, 'day', window, auckland )
		).toEqual( {
			range: {
				from: new Date( '2026-07-21T12:00:00.000Z' ),
				to: new Date( '2026-07-22T11:59:59.999Z' ),
			},
			step: 'P1D',
		} );
	} );

	it( 'opens the bucket the report cut when it states the end', () => {
		const sundayWeek = {
			date: new Date( '2026-10-18T00:00:00Z' ),
			endDate: new Date( '2026-10-24T23:59:59Z' ),
		};

		expect( bucketRange( sundayWeek, 'week', window, clock ) ).toEqual( {
			range: {
				from: new Date( '2026-10-18T00:00:00.000Z' ),
				to: new Date( '2026-10-24T23:59:59.999Z' ),
			},
			step: 'P7D',
		} );
	} );

	// A bucket cut at its start is stepped by its days, so Previous then Next returns to
	// it; one cut at its end, today's say, still steps by its own unit.
	it.each( [
		[
			'leading',
			{ from: localTZDate( '2026-07-22T00:00:00.000Z', 'UTC' ), to: window.to },
			'2026-07-22T00:00:00.000Z',
			'2026-07-26T23:59:59.999Z',
			undefined,
		],
		[
			'trailing',
			{ from: window.from, to: localTZDate( '2026-07-22T23:59:59.999Z', 'UTC' ) },
			'2026-07-20T00:00:00.000Z',
			'2026-07-22T23:59:59.999Z',
			'P7D',
		],
	] )( 'cuts a partial %s edge bucket to the window', ( _edge, partial, from, to, step ) => {
		expect(
			bucketRange( { date: new Date( '2026-07-22T00:00:00Z' ) }, 'week', partial, clock )
		).toEqual( {
			range: { from: new Date( from ), to: new Date( to ) },
			...( step ? { step } : {} ),
		} );
	} );

	it( 'opens nothing for a bucket outside the window', () => {
		const july = {
			from: localTZDate( '2026-07-01T00:00:00.000Z', 'UTC' ),
			to: localTZDate( '2026-07-30T23:59:59.999Z', 'UTC' ),
		};

		expect(
			bucketRange( { date: new Date( '2026-09-05T00:00:00Z' ) }, 'day', july, clock )
		).toBeNull();
	} );
} );
