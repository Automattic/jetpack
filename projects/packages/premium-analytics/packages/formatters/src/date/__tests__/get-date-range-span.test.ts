/**
 * Internal dependencies
 */
import { getDateRangeSpan } from '../get-date-range-span';

/**
 * Build a local-time date. Dates are constructed from parts rather than parsed
 * from ISO strings so the day boundaries land in the machine's timezone, which
 * is the frame `date-fns` reads.
 *
 * @param year    - Full year.
 * @param month   - 1-indexed month.
 * @param day     - Day of month.
 * @param hours   - Hour of day.
 * @param minutes - Minute of hour.
 * @return The date.
 */
function at( year: number, month: number, day: number, hours = 0, minutes = 0 ): Date {
	return new Date( year, month - 1, day, hours, minutes, 0, 0 );
}

/**
 * The last instant of a day, the shape preset ranges use for `to`.
 *
 * @param year  - Full year.
 * @param month - 1-indexed month.
 * @param day   - Day of month.
 * @return The end of that day.
 */
function endOf( year: number, month: number, day: number ): Date {
	return new Date( year, month - 1, day, 23, 59, 59, 999 );
}

describe( 'getDateRangeSpan', () => {
	it( 'returns null when the range is incomplete', () => {
		expect( getDateRangeSpan() ).toBeNull();
		expect( getDateRangeSpan( {} ) ).toBeNull();
		expect( getDateRangeSpan( { from: at( 2026, 7, 21 ) } ) ).toBeNull();
	} );

	it( 'counts whole days inclusively', () => {
		expect( getDateRangeSpan( { from: at( 2026, 7, 21 ), to: endOf( 2026, 7, 27 ) } ) ).toEqual( {
			unit: 'day',
			value: 7,
		} );
		expect( getDateRangeSpan( { from: at( 2026, 7, 29 ), to: endOf( 2026, 7, 29 ) } ) ).toEqual( {
			unit: 'day',
			value: 1,
		} );
	} );

	it( 'measures a rolling sub-day window in hours', () => {
		// `last-24-hours` ends at the current time, not at a day boundary.
		expect(
			getDateRangeSpan( { from: at( 2026, 7, 28, 14, 30 ), to: at( 2026, 7, 29, 14, 30 ) } )
		).toEqual( { unit: 'hour', value: 24 } );
	} );

	it( 'counts a day-aligned range in days even when it is only one day long', () => {
		// `today` also spans 24 hours, but its boundaries make it a calendar day.
		expect( getDateRangeSpan( { from: at( 2026, 7, 29 ), to: endOf( 2026, 7, 29 ) } ) ).toEqual( {
			unit: 'day',
			value: 1,
		} );
	} );

	it( 'describes whole-month ranges in months', () => {
		// Month-aligned, as the design mock shows it.
		expect( getDateRangeSpan( { from: at( 2025, 7, 1 ), to: endOf( 2026, 6, 30 ) } ) ).toEqual( {
			unit: 'month',
			value: 12,
		} );

		// Rolling, as `last-12-months` actually produces it.
		expect( getDateRangeSpan( { from: at( 2025, 7, 29 ), to: endOf( 2026, 7, 28 ) } ) ).toEqual( {
			unit: 'month',
			value: 12,
		} );
	} );

	it( 'collapses multi-year ranges into years', () => {
		// The year surface's "All time" spans several calendar years, which would
		// otherwise read as an unusable month count.
		expect( getDateRangeSpan( { from: at( 2020, 1, 1 ), to: endOf( 2025, 12, 31 ) } ) ).toEqual( {
			unit: 'year',
			value: 6,
		} );
	} );

	it( 'keeps a twelve-month range in months, as the design spells it', () => {
		expect( getDateRangeSpan( { from: at( 2025, 7, 1 ), to: endOf( 2026, 6, 30 ) } ) ).toEqual( {
			unit: 'month',
			value: 12,
		} );
	} );

	it( 'keeps a whole-year count in months when it does not divide into years', () => {
		expect( getDateRangeSpan( { from: at( 2024, 1, 1 ), to: endOf( 2026, 6, 30 ) } ) ).toEqual( {
			unit: 'month',
			value: 30,
		} );
	} );

	it( 'keeps short whole-month ranges in days', () => {
		// 30 days is a whole month, but "Last 30 days" should not say "1 month".
		expect( getDateRangeSpan( { from: at( 2026, 6, 29 ), to: endOf( 2026, 7, 28 ) } ) ).toEqual( {
			unit: 'day',
			value: 30,
		} );
	} );

	it( 'falls back to days when the range does not divide into months', () => {
		expect( getDateRangeSpan( { from: at( 2026, 4, 30 ), to: endOf( 2026, 7, 28 ) } ) ).toEqual( {
			unit: 'day',
			value: 90,
		} );
	} );

	it( 'does not treat a short final month as a whole month', () => {
		// `addMonths` clamps Jan 31 to Feb 28, which a day-of-month comparison
		// would read as a whole month.
		expect( getDateRangeSpan( { from: at( 2026, 1, 31 ), to: endOf( 2026, 3, 27 ) } ) ).toEqual( {
			unit: 'day',
			value: 56,
		} );
	} );
} );
