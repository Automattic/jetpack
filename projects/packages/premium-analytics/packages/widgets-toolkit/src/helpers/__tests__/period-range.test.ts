/**
 * Internal dependencies
 */
import { monthRange, yearRange } from '../period-range';

const bounds = {
	lifeStartsAt: new Date( '2026-04-10T16:27:32Z' ),
	timeZone: 'UTC',
	now: new Date( '2026-09-09T12:00:00Z' ),
};

describe( 'monthRange', () => {
	it( 'opens a whole month inside the post life', () => {
		expect( monthRange( { year: 2026, month: 5 }, bounds ) ).toEqual( {
			from: new Date( '2026-06-01T00:00:00.000Z' ),
			to: new Date( '2026-06-30T23:59:59.999Z' ),
		} );
	} );

	it( 'starts the first month on the day the life starts', () => {
		expect( monthRange( { year: 2026, month: 3 }, bounds ) ).toEqual( {
			from: new Date( '2026-04-10T00:00:00.000Z' ),
			to: new Date( '2026-04-30T23:59:59.999Z' ),
		} );
	} );

	it( 'ends the current month now', () => {
		expect( monthRange( { year: 2026, month: 8 }, bounds ) ).toEqual( {
			from: new Date( '2026-09-01T00:00:00.000Z' ),
			to: bounds.now,
		} );
	} );

	it( 'reads the month on the site calendar', () => {
		const range = monthRange(
			{ year: 2026, month: 5 },
			{ ...bounds, timeZone: 'America/New_York' }
		);

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
			from: new Date( '2026-01-01T00:00:00.000Z' ),
			to: new Date( '2026-01-31T23:59:59.999Z' ),
		} );
	} );
} );

describe( 'yearRange', () => {
	it( 'opens the year cut to the post life', () => {
		expect( yearRange( 2026, bounds ) ).toEqual( {
			from: new Date( '2026-04-10T00:00:00.000Z' ),
			to: bounds.now,
		} );
	} );

	it( 'opens a whole past year', () => {
		expect(
			yearRange( 2025, { ...bounds, lifeStartsAt: new Date( '2024-01-01T00:00:00Z' ) } )
		).toEqual( {
			from: new Date( '2025-01-01T00:00:00.000Z' ),
			to: new Date( '2025-12-31T23:59:59.999Z' ),
		} );
	} );

	it( 'has nothing to open for a year after today', () => {
		expect( yearRange( 2027, bounds ) ).toBeNull();
	} );
} );
