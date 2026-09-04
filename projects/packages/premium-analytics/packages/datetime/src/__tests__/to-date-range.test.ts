/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { getDateRangeSpan } from '../date-range-span';
import { clampRangeEndToToday, completeToDateRange } from '../to-date-range';

/**
 * A zone away from UTC, so a boundary computed on the wrong clock lands on a
 * different day.
 */
const TIMEZONE = 'America/New_York';

/**
 * The first instant of a day in the site's zone.
 *
 * @param year  - Full year.
 * @param month - 1-indexed month.
 * @param day   - Day of month.
 * @return The date.
 */
function at( year: number, month: number, day: number ): TZDate {
	return new TZDate( year, month - 1, day, 0, 0, 0, 0, TIMEZONE );
}

/**
 * The last instant of a day in the site's zone, the shape presets use for `to`.
 *
 * @param year  - Full year.
 * @param month - 1-indexed month.
 * @param day   - Day of month.
 * @return The end of that day.
 */
function endOf( year: number, month: number, day: number ): TZDate {
	return new TZDate( year, month - 1, day, 23, 59, 59, 999, TIMEZONE );
}

describe( 'completeToDateRange', () => {
	// `last-12-months` as read on 20 August 2026: eleven whole months and the
	// running one.
	const toDate = { from: at( 2025, 9, 1 ), to: endOf( 2026, 8, 20 ) };

	it( 'runs the 12-month window to the end of its running month', () => {
		const completed = completeToDateRange( toDate, 'last-12-months' );

		expect( completed.from ).toEqual( toDate.from );
		expect( completed.to ).toEqual( endOf( 2026, 8, 31 ) );
	} );

	it( 'closes the month on the window’s own clock', () => {
		const completed = completeToDateRange( toDate, 'last-12-months' );

		expect( completed.to ).toBeInstanceOf( TZDate );
		expect( ( completed.to as TZDate ).timeZone ).toBe( TIMEZONE );
	} );

	/*
	 * The property everything downstream relies on: the same selection, read
	 * mid-month, on the last day of a month, and on the first of the next,
	 * always measures as twelve months.
	 */
	it.each( [
		[ 'mid-month', { from: at( 2025, 9, 1 ), to: endOf( 2026, 8, 20 ) } ],
		[ 'on the last day of a month', { from: at( 2025, 9, 1 ), to: endOf( 2026, 8, 31 ) } ],
		[ 'on the first of a month', { from: at( 2025, 10, 1 ), to: endOf( 2026, 9, 1 ) } ],
	] )( 'measures as twelve months when read %s', ( _label, range ) => {
		expect( getDateRangeSpan( completeToDateRange( range, 'last-12-months' ) ) ).toEqual( {
			unit: 'month',
			value: 12,
		} );
	} );

	it( 'leaves a window that already ends on a month end where it is', () => {
		const complete = { from: at( 2025, 9, 1 ), to: endOf( 2026, 8, 31 ) };

		expect( completeToDateRange( complete, 'last-12-months' ) ).toEqual( complete );
	} );

	it( 'returns any other preset’s range as is, even one starting on the first', () => {
		// A hand-picked range has no running month to complete.
		expect( completeToDateRange( toDate, 'custom' ) ).toBe( toDate );
		expect( completeToDateRange( toDate, 'last-30-days' ) ).toBe( toDate );
		expect( completeToDateRange( toDate, undefined ) ).toBe( toDate );
	} );

	it( 'returns a range without an end untouched', () => {
		const open = { from: at( 2025, 9, 1 ) };

		expect( completeToDateRange( open, 'last-12-months' ) ).toBe( open );
	} );
} );

describe( 'clampRangeEndToToday', () => {
	// Where a forward step out of "12 months" lands: the running month closed,
	// which reaches eleven days past the day it was taken on.
	const steppedForward = { from: at( 2025, 9, 1 ), to: endOf( 2026, 8, 31 ) };
	const noon = new TZDate( 2026, 7, 20, 12, 0, 0, 0, TIMEZONE );

	it( 'pulls a window ending after today back to the end of today', () => {
		expect( clampRangeEndToToday( steppedForward, noon ) ).toEqual( {
			from: at( 2025, 9, 1 ),
			to: endOf( 2026, 8, 20 ),
		} );
	} );

	it( 'closes the day on the window’s own clock', () => {
		// 02:00 UTC is still the 26th in New York, so a clamp read on the
		// browser's clock would leave the window a day long.
		const clamped = clampRangeEndToToday(
			steppedForward,
			new Date( Date.UTC( 2026, 7, 27, 2, 0 ) )
		);

		expect( clamped.to ).toEqual( endOf( 2026, 8, 26 ) );
		expect( clamped.to ).toBeInstanceOf( TZDate );
	} );

	it( 'leaves a window that already ends today where it is', () => {
		const toDate = { from: at( 2025, 9, 1 ), to: endOf( 2026, 8, 20 ) };

		expect( clampRangeEndToToday( toDate, noon ) ).toBe( toDate );
	} );

	it( 'leaves a window ending in the past where it is', () => {
		const past = { from: at( 2024, 9, 1 ), to: endOf( 2025, 8, 31 ) };

		expect( clampRangeEndToToday( past, noon ) ).toBe( past );
	} );

	it( 'returns a range without an end untouched', () => {
		const open = { from: at( 2025, 9, 1 ) };

		expect( clampRangeEndToToday( open, noon ) ).toBe( open );
	} );
} );
