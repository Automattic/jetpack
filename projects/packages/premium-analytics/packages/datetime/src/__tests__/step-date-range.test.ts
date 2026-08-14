/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { differenceInCalendarDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { canStepForward, stepDateRange } from '../step-date-range';
import type { DateRange } from '../get-comparison-range';

/**
 * Build a local-time date, so day boundaries land in the machine's timezone the
 * way the span helper reads them.
 *
 * @param year   - Full year.
 * @param month  - 1-based month.
 * @param day    - Day of the month.
 * @param hour   - Hour of the day.
 * @param minute - Minute of the hour.
 * @return The date.
 */
function at( year: number, month: number, day: number, hour = 0, minute = 0 ): Date {
	return new Date( year, month - 1, day, hour, minute );
}

/**
 * A range covering whole days, which is what a preset produces.
 *
 * @param from - First day.
 * @param to   - Last day.
 * @return The inclusive whole-day range.
 */
function wholeDays( from: Date, to: Date ) {
	return {
		from: new Date( from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0 ),
		to: new Date( to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999 ),
	};
}

describe( 'stepDateRange', () => {
	it( 'moves a day-scale window by its own length', () => {
		const range = wholeDays( at( 2026, 7, 21 ), at( 2026, 7, 27 ) );

		const previous = stepDateRange( range, 'previous' );

		expect( previous?.from ).toEqual( wholeDays( at( 2026, 7, 14 ), at( 2026, 7, 20 ) ).from );
		expect( previous?.to ).toEqual( wholeDays( at( 2026, 7, 14 ), at( 2026, 7, 20 ) ).to );
	} );

	it( 'moves an hour-snapped window by its full length', () => {
		// `last-24-hours`: hour boundaries, a millisecond short of 24 hours.
		const range = {
			from: at( 2026, 7, 9, 19 ),
			to: new Date( 2026, 6, 10, 18, 59, 59, 999 ),
		};

		const previous = stepDateRange( range, 'previous' );

		expect( previous?.from ).toEqual( at( 2026, 7, 8, 19 ) );
		expect( previous?.to ).toEqual( new Date( 2026, 6, 9, 18, 59, 59, 999 ) );
	} );

	it( 'moves a month-scale window by calendar months, not by days', () => {
		// A whole year: stepping back has to land on the same days of the month.
		const range = wholeDays( at( 2026, 1, 1 ), at( 2026, 12, 31 ) );

		const previous = stepDateRange( range, 'previous' );

		expect( previous?.from.getFullYear() ).toBe( 2025 );
		expect( previous?.from.getMonth() ).toBe( 0 );
		expect( previous?.from.getDate() ).toBe( 1 );
		expect( previous?.to.getMonth() ).toBe( 11 );
		expect( previous?.to.getDate() ).toBe( 31 );
	} );

	it( 'steps a sub-day window by hours', () => {
		const range = { from: at( 2026, 7, 27, 9 ), to: at( 2026, 7, 28, 9 ) };

		const previous = stepDateRange( range, 'previous' );

		expect( previous?.from ).toEqual( at( 2026, 7, 26, 9 ) );
		expect( previous?.to ).toEqual( at( 2026, 7, 27, 9 ) );
	} );

	/*
	 * The first acceptance criterion, asserted the way the control exercises it:
	 * each call re-derives the span from whatever range it is handed, so a step
	 * that changes what the window measures as has to survive that too.
	 *
	 * The clamping case is why this is a property rather than one example.
	 * `addMonths` shortens a day the target month cannot hold, and the clamp does
	 * not undo: August 31 two months back is June 30, forward again August 30.
	 */
	describe( 'is reversible', () => {
		const cases = [
			[ 'days', wholeDays( at( 2026, 7, 21 ), at( 2026, 7, 27 ) ) ],
			[ 'whole months', wholeDays( at( 2026, 1, 1 ), at( 2026, 12, 31 ) ) ],
			[ 'months from a 31st', wholeDays( at( 2026, 8, 31 ), at( 2026, 10, 30 ) ) ],
			[ 'a leap February', wholeDays( at( 2024, 1, 31 ), at( 2024, 3, 30 ) ) ],
			[ 'hours', { from: at( 2026, 7, 27, 9 ), to: at( 2026, 7, 28, 9 ) } ],
		] as const;

		it.each( cases )( 'returns to the starting window across %s', ( _name, range ) => {
			const back = stepDateRange( range, 'previous' );
			const forward = back && stepDateRange( back, 'next' );

			expect( forward?.from ).toEqual( range.from );
			expect( forward?.to ).toEqual( range.to );
		} );

		it.each( cases )( 'returns from several steps out across %s', ( _name, range ) => {
			let moved: typeof range | undefined = range;

			for ( let i = 0; i < 3; i++ ) {
				moved = moved && ( stepDateRange( moved, 'previous' ) as typeof range );
			}
			for ( let i = 0; i < 3; i++ ) {
				moved = moved && ( stepDateRange( moved, 'next' ) as typeof range );
			}

			expect( moved?.from ).toEqual( range.from );
			expect( moved?.to ).toEqual( range.to );
		} );
	} );

	/*
	 * The window keeps its length whichever unit the step had to fall back to.
	 * Counted in calendar days, not elapsed milliseconds: a window that crosses a
	 * daylight-saving change is an hour longer than one that does not, and the
	 * step is meant to preserve the days a reader sees rather than the seconds.
	 */
	it( 'preserves the window length when a calendar step would clamp', () => {
		const range = wholeDays( at( 2026, 8, 31 ), at( 2026, 10, 30 ) );

		const previous = stepDateRange( range, 'previous' );
		const daysIn = ( r?: DateRange ) =>
			r?.from && r.to ? differenceInCalendarDays( r.to, r.from ) : null;

		expect( daysIn( previous ) ).toBe( daysIn( range ) );
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
	 * The shapes a live preset takes. `Last 24 hours` ends at the end of the
	 * running hour, `today` at the end of the running day, `Last 7 days` at the
	 * end of yesterday: the first two end in the future, the last never contains
	 * the present, and all are the latest window available.
	 */
	it( 'is false on a rolling window whose end has just gone stale', () => {
		const to = at( 2026, 7, 27, 11, 59 );

		expect( canStepForward( { from: at( 2026, 7, 26, 11, 59 ), to }, now ) ).toBe( false );
	} );

	// The live window ends at the end of the running hour, in the future on
	// purpose; counting that bucket is what keeps it reachable after a step
	// back.
	it( 'is true on the window right behind a live hour-snapped one', () => {
		const live = {
			from: at( 2026, 7, 26, 13 ),
			to: new Date( 2026, 6, 27, 12, 59, 59, 999 ),
		};
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
	// control has to disappear again.
	it( 'turns false again on the window a forward step lands on', () => {
		const range = wholeDays( at( 2026, 7, 13 ), at( 2026, 7, 19 ) );
		const next = stepDateRange( range, 'next' );

		expect( canStepForward( next!, now ) ).toBe( false );
	} );

	it( 'is false without an end to step from', () => {
		expect( canStepForward( { from: at( 2026, 7, 14 ), to: undefined }, now ) ).toBe( false );
	} );
} );
