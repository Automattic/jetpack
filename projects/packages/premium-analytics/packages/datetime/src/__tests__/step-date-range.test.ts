/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { differenceInCalendarDays, differenceInHours } from 'date-fns';
/**
 * Internal dependencies
 */
import { canStepBackward, canStepForward, stepDateRange } from '../step-date-range';
import type { DateRange } from '../get-comparison-range';

/**
 * A zone that observes DST, so a step across a boundary is exercised.
 */
const TIMEZONE = 'America/New_York';

/**
 * An instant on the site's clock.
 *
 * @param year   - Full year.
 * @param month  - 1-based month.
 * @param day    - Day of the month.
 * @param hour   - Hour of the day.
 * @param minute - Minute of the hour.
 * @return The date.
 */
function at( year: number, month: number, day: number, hour = 0, minute = 0 ): TZDate {
	return new TZDate( year, month - 1, day, hour, minute, 0, 0, TIMEZONE );
}

/**
 * The last instant of an hour on the site's clock.
 *
 * @param year  - Full year.
 * @param month - 1-based month.
 * @param day   - Day of the month.
 * @param hour  - Hour of the day.
 * @return The date.
 */
function endOfHourAt( year: number, month: number, day: number, hour: number ): TZDate {
	return new TZDate( year, month - 1, day, hour, 59, 59, 999, TIMEZONE );
}

/**
 * A range covering whole days, which is what a preset produces.
 *
 * @param from - First day.
 * @param to   - Last day.
 * @return The inclusive whole-day range.
 */
function wholeDays( from: TZDate, to: TZDate ): Required< DateRange > {
	return {
		from: new TZDate( from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0, TIMEZONE ),
		to: new TZDate( to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999, TIMEZONE ),
	};
}

describe( 'stepDateRange', () => {
	it( 'moves a day-scale window by its own length', () => {
		const range = wholeDays( at( 2026, 7, 21 ), at( 2026, 7, 27 ) );

		const previous = stepDateRange( range, 'previous' );

		expect( previous ).toEqual( wholeDays( at( 2026, 7, 14 ), at( 2026, 7, 20 ) ) );
	} );

	it( 'moves an hour-snapped window by its full length', () => {
		// `last-24-hours`: hour boundaries, a millisecond short of 24 hours.
		const range = { from: at( 2026, 7, 9, 19 ), to: endOfHourAt( 2026, 7, 10, 18 ) };

		const previous = stepDateRange( range, 'previous' );

		expect( previous ).toEqual( { from: at( 2026, 7, 8, 19 ), to: endOfHourAt( 2026, 7, 9, 18 ) } );
	} );

	it( 'moves a month-scale window by calendar months, not by days', () => {
		// A whole year: stepping back has to land on the same days of the month.
		const range = wholeDays( at( 2026, 1, 1 ), at( 2026, 12, 31 ) );

		const previous = stepDateRange( range, 'previous' );

		expect( previous ).toEqual( wholeDays( at( 2025, 1, 1 ), at( 2025, 12, 31 ) ) );
	} );

	it( 'steps a sub-day window by hours', () => {
		const range = { from: at( 2026, 7, 27, 9 ), to: at( 2026, 7, 28, 9 ) };

		const previous = stepDateRange( range, 'previous' );

		expect( previous ).toEqual( { from: at( 2026, 7, 26, 9 ), to: at( 2026, 7, 27, 9 ) } );
	} );

	// `getDateRangeSpan` reads one whole month as its days, which would move
	// "Last month" back 30 days rather than to the month before.
	it.each( [
		[ 'a whole month', wholeDays( at( 2026, 9, 1 ), at( 2026, 9, 30 ) ), 'last-month' ],
		[ 'a whole month picked by hand', wholeDays( at( 2026, 9, 1 ), at( 2026, 9, 30 ) ), 'custom' ],
		[ 'the month to date', wholeDays( at( 2026, 9, 1 ), at( 2026, 9, 14 ) ), 'month-to-date' ],
	] as const )( 'steps %s to the whole month before', ( _name, range, presetId ) => {
		expect( stepDateRange( range, 'previous', { presetId } ) ).toEqual(
			wholeDays( at( 2026, 8, 1 ), at( 2026, 8, 31 ) )
		);
	} );

	it( 'steps a "Last N days" window on whole months by its days', () => {
		const range = wholeDays( at( 2026, 4, 1 ), at( 2026, 4, 30 ) );

		expect( stepDateRange( range, 'previous', { presetId: 'last-30-days' } ) ).toEqual(
			wholeDays( at( 2026, 3, 2 ), at( 2026, 3, 31 ) )
		);
	} );

	it( 'steps the year to date back to the whole year before', () => {
		const range = wholeDays( at( 2026, 1, 1 ), at( 2026, 7, 27 ) );

		expect( stepDateRange( range, 'previous', { presetId: 'year-to-date' } ) ).toEqual(
			wholeDays( at( 2025, 1, 1 ), at( 2025, 12, 31 ) )
		);
	} );

	it( 'steps a to-date year window by its completed months', () => {
		// `last-12-months` as read mid-month.
		const range = wholeDays( at( 2025, 9, 1 ), at( 2026, 8, 20 ) );

		expect( stepDateRange( range, 'previous', { presetId: 'last-12-months' } ) ).toEqual(
			wholeDays( at( 2024, 9, 1 ), at( 2025, 8, 31 ) )
		);
	} );

	it( 'does not step all time', () => {
		const range = wholeDays( at( 2020, 1, 1 ), at( 2026, 8, 20 ) );

		expect( stepDateRange( range, 'previous', { presetId: 'all-time' } ) ).toBeUndefined();
	} );

	/*
	 * A property rather than one example because of clamping: `addMonths` shortens
	 * a day the target month cannot hold, and the clamp does not undo.
	 */
	describe( 'is reversible', () => {
		const cases = [
			[ 'days', wholeDays( at( 2026, 7, 21 ), at( 2026, 7, 27 ) ) ],
			[ 'a single month', wholeDays( at( 2026, 9, 1 ), at( 2026, 9, 30 ) ) ],
			[ 'whole months', wholeDays( at( 2026, 1, 1 ), at( 2026, 12, 31 ) ) ],
			[ 'months from a 31st', wholeDays( at( 2026, 8, 31 ), at( 2026, 10, 30 ) ) ],
			[ 'a leap February', wholeDays( at( 2024, 1, 31 ), at( 2024, 3, 30 ) ) ],
			[ 'hours', { from: at( 2026, 7, 27, 9 ), to: at( 2026, 7, 28, 9 ) } ],
			[ 'days across a DST change', wholeDays( at( 2026, 10, 30 ), at( 2026, 11, 5 ) ) ],
		] as const;

		it.each( cases )( 'returns to the starting window across %s', ( _name, range ) => {
			const back = stepDateRange( range, 'previous' );
			const forward = back && stepDateRange( back, 'next' );

			expect( forward ).toEqual( range );
		} );

		// Not from a 31st: its day fallback lands on whole months, which then step
		// as months, so the walk back does not retrace the walk out.
		const walks = cases.filter( ( [ name ] ) => name !== 'months from a 31st' );

		it.each( walks )( 'returns from several steps out across %s', ( _name, range ) => {
			let moved: DateRange | undefined = range;

			for ( let i = 0; i < 3; i++ ) {
				moved = moved && stepDateRange( moved, 'previous' );
			}
			for ( let i = 0; i < 3; i++ ) {
				moved = moved && stepDateRange( moved, 'next' );
			}

			expect( moved ).toEqual( range );
		} );
	} );

	/*
	 * Counted in calendar days, not elapsed milliseconds: a window crossing a DST
	 * change is an hour longer, and the step preserves the days a reader sees.
	 */
	it( 'preserves the window length when a calendar step would clamp', () => {
		const range = wholeDays( at( 2026, 8, 31 ), at( 2026, 10, 30 ) );

		const previous = stepDateRange( range, 'previous' );
		const daysIn = ( r?: DateRange ) =>
			r?.from && r.to ? differenceInCalendarDays( r.to, r.from ) : null;

		expect( daysIn( previous ) ).toBe( daysIn( range ) );
	} );

	// "Last 24 hours" read on the afternoon the clocks fall back: 24 elapsed
	// hours that show as 23 on the wall. The step moves by elapsed time, so the
	// window keeps its length and its start hour, and the round trip holds.
	it( 'steps an hour window across a DST change by elapsed hours', () => {
		const range = { from: at( 2026, 10, 31, 16 ), to: endOfHourAt( 2026, 11, 1, 14 ) };

		const previous = stepDateRange( range, 'previous' );

		expect( previous ).toEqual( {
			from: at( 2026, 10, 30, 16 ),
			to: endOfHourAt( 2026, 10, 31, 15 ),
		} );
		expect( differenceInHours( previous!.to!, previous!.from!, { roundingMethod: 'round' } ) ).toBe(
			differenceInHours( range.to, range.from, { roundingMethod: 'round' } )
		);
		expect( stepDateRange( previous!, 'next' ) ).toEqual( range );
	} );

	it( 'returns undefined for a range it cannot measure', () => {
		expect(
			stepDateRange( { from: undefined, to: at( 2026, 7, 27 ) }, 'previous' )
		).toBeUndefined();
		expect( stepDateRange( { from: at( 2026, 7, 21 ), to: undefined }, 'next' ) ).toBeUndefined();
		expect( stepDateRange( {}, 'next' ) ).toBeUndefined();
	} );
} );

describe( 'canStepForward', () => {
	const now = at( 2026, 7, 27, 12 );

	/*
	 * Live presets end in the future (`Last 24 hours`, `today`) or before the
	 * present (`Last 7 days`), yet all are the latest window available.
	 */
	it( 'is false on a rolling window whose end has just gone stale', () => {
		const to = at( 2026, 7, 27, 11, 59 );

		expect( canStepForward( { from: at( 2026, 7, 26, 11, 59 ), to }, now ) ).toBe( false );
	} );

	// The live window ends in the future on purpose; counting that bucket is what
	// keeps it reachable after a step back.
	it( 'is true on the window right behind a live hour-snapped one', () => {
		const live = { from: at( 2026, 7, 26, 13 ), to: endOfHourAt( 2026, 7, 27, 12 ) };
		const back = stepDateRange( live, 'previous' );

		expect( canStepForward( live, now ) ).toBe( false );
		expect( canStepForward( back!, now ) ).toBe( true );
	} );

	it( 'is true on yesterday while today is still running', () => {
		const today = wholeDays( at( 2026, 7, 27 ), at( 2026, 7, 27 ) );
		const yesterday = stepDateRange( today, 'previous' );

		expect( canStepForward( today, now ) ).toBe( false );
		expect( canStepForward( yesterday!, now ) ).toBe( true );
	} );

	it( 'closes the bucket on the window timezone, not the machine one', () => {
		const site = '+00:00';
		const yesterday = {
			from: new TZDate( 2026, 6, 26, 0, 0, 0, 0, site ),
			to: new TZDate( 2026, 6, 26, 23, 59, 59, 999, site ),
		};
		// 02:00 UTC on the next site day, whatever timezone runs the tests.
		const nowInstant = new Date( Date.UTC( 2026, 6, 27, 2, 0 ) );

		expect( canStepForward( yesterday, nowInstant ) ).toBe( true );
	} );

	it( 'is false on a window ending at the end of yesterday', () => {
		const range = wholeDays( at( 2026, 7, 20 ), at( 2026, 7, 26 ) );

		expect( canStepForward( range, now ) ).toBe( false );
	} );

	it( 'is true once the window has been stepped back', () => {
		const range = wholeDays( at( 2026, 7, 13 ), at( 2026, 7, 19 ) );

		expect( canStepForward( range, now ) ).toBe( true );
	} );

	// Stepping forward from there lands on the latest window, which is where the
	// control has to disable again.
	it( 'turns false again on the window a forward step lands on', () => {
		const range = wholeDays( at( 2026, 7, 13 ), at( 2026, 7, 19 ) );
		const next = stepDateRange( range, 'next' );

		expect( canStepForward( next!, now ) ).toBe( false );
	} );

	// The month or year in progress is the bucket `now` sits in, so the one
	// before it can step forward into it; the month or year to date cannot.
	it.each( [
		[ 'the month before', wholeDays( at( 2026, 6, 1 ), at( 2026, 6, 30 ) ), 'last-month', true ],
		[
			'the month to date',
			wholeDays( at( 2026, 7, 1 ), at( 2026, 7, 27 ) ),
			'month-to-date',
			false,
		],
		[ 'last year', wholeDays( at( 2025, 1, 1 ), at( 2025, 12, 31 ) ), 'last-year', true ],
		[ 'the year to date', wholeDays( at( 2026, 1, 1 ), at( 2026, 7, 27 ) ), 'year-to-date', false ],
		[ 'all time', wholeDays( at( 2020, 1, 1 ), at( 2026, 7, 27 ) ), 'all-time', false ],
	] as const )( 'is %s on %s', ( _name, range, presetId, expected ) => {
		expect( canStepForward( range, now, { presetId } ) ).toBe( expected );
	} );

	it( 'is false without an end to step from', () => {
		expect( canStepForward( { from: at( 2026, 7, 14 ), to: undefined }, now ) ).toBe( false );
	} );
} );

describe( 'canStepBackward', () => {
	const range = wholeDays( at( 2026, 7, 21 ), at( 2026, 7, 27 ) );

	it( 'is true without a limit', () => {
		expect( canStepBackward( range ) ).toBe( true );
	} );

	it.each( [
		[ 'at the start of the previous window', at( 2026, 7, 14 ), true ],
		[ 'inside the previous window', at( 2026, 7, 15 ), false ],
	] )( 'follows the earliest date %s', ( _name, earliestDate, expected ) => {
		expect( canStepBackward( range, { earliestDate } ) ).toBe( expected );
	} );

	it( 'is false on all time', () => {
		expect( canStepBackward( range, { presetId: 'all-time' } ) ).toBe( false );
	} );

	it( 'is false without a start to step from', () => {
		expect( canStepBackward( { from: undefined, to: at( 2026, 7, 27 ) } ) ).toBe( false );
	} );
} );
