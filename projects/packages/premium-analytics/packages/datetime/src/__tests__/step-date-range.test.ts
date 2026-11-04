/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import {
	endOfStepHorizon,
	getStepSpan,
	measureStepId,
	parseDateStepId,
	shiftStep,
} from '../step-date-range';
import type { DateRange } from '../get-comparison-range';

/**
 * A zone that observes DST, so a step across a boundary is exercised.
 */
const TIMEZONE = 'America/New_York';

/**
 * An instant on the site's clock.
 *
 * @param year     - Full year.
 * @param month    - 1-based month.
 * @param day      - Day of the month.
 * @param hour     - Hour of the day.
 * @param minute   - Minute of the hour.
 * @param timeZone - The zone.
 * @return The date.
 */
function at(
	year: number,
	month: number,
	day: number,
	hour = 0,
	minute = 0,
	timeZone = TIMEZONE
): TZDate {
	return new TZDate( year, month - 1, day, hour, minute, 0, 0, timeZone );
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
	const timeZone = from.timeZone ?? TIMEZONE;

	return {
		from: new TZDate( from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0, timeZone ),
		to: new TZDate( to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999, timeZone ),
	};
}

describe( 'parseDateStepId', () => {
	it.each( [ 'last-7-days', 'month-to-date', 'P7D', 'P1M', 'P2Y', 'PT24H' ] )(
		'accepts %s',
		value => {
			expect( parseDateStepId( value ) ).toBe( value );
		}
	);

	it.each( [
		[ 'a preset with no window', 'all-time' ],
		[ 'the custom marker', 'custom' ],
		[ 'a duration of nothing', 'P0D' ],
		[ 'a lower-case unit', 'P7d' ],
		[ 'a duration in weeks', 'P1W' ],
		[ 'a duration past a century', 'P999999999D' ],
		[ 'a century and a year', 'P101Y' ],
		[ 'a number', 7 ],
		[ 'nothing', undefined ],
	] )( 'rejects %s', ( _name, value ) => {
		expect( parseDateStepId( value ) ).toBeUndefined();
	} );
} );

describe( 'getStepSpan', () => {
	it.each( [
		[ 'today', { unit: 'day', value: 1 } ],
		[ 'last-24-hours', { unit: 'hour', value: 24 } ],
		[ 'last-30-days', { unit: 'day', value: 30 } ],
		[ 'month-to-date', { unit: 'month', value: 1 } ],
		[ 'last-12-months', { unit: 'month', value: 12 } ],
		[ 'last-year', { unit: 'year', value: 1 } ],
		[ 'P90D', { unit: 'day', value: 90 } ],
		[ 'P3M', { unit: 'month', value: 3 } ],
		[ 'P2Y', { unit: 'year', value: 2 } ],
		[ 'PT6H', { unit: 'hour', value: 6 } ],
	] as const )( 'reads %s', ( stepId, span ) => {
		expect( getStepSpan( stepId ) ).toEqual( span );
	} );
} );

describe( 'measureStepId', () => {
	it.each( [
		[ 'a run of days', wholeDays( at( 2026, 7, 21 ), at( 2026, 7, 27 ) ), 'P7D' ],
		[ 'a whole month', wholeDays( at( 2026, 9, 1 ), at( 2026, 9, 30 ) ), 'P1M' ],
		[ 'whole months', wholeDays( at( 2026, 6, 1 ), at( 2026, 8, 31 ) ), 'P3M' ],
		[ 'a whole year', wholeDays( at( 2025, 1, 1 ), at( 2025, 12, 31 ) ), 'P1Y' ],
		[ 'twelve months from mid-year', wholeDays( at( 2025, 7, 1 ), at( 2026, 6, 30 ) ), 'P12M' ],
		[ 'the month to date, by its days', wholeDays( at( 2026, 9, 1 ), at( 2026, 9, 14 ) ), 'P14D' ],
		[ 'a window starting mid-month', wholeDays( at( 2026, 1, 15 ), at( 2026, 3, 14 ) ), 'P59D' ],
		[
			'an hour-snapped window',
			{ from: at( 2026, 7, 9, 19 ), to: endOfHourAt( 2026, 7, 10, 18 ) },
			'PT24H',
		],
		[
			'a window shorter than an hour',
			{ from: at( 2026, 7, 9, 19 ), to: at( 2026, 7, 9, 19, 20 ) },
			'PT1H',
		],
	] )( 'measures %s', ( _name, range, stepId ) => {
		expect( measureStepId( range ) ).toBe( stepId );
	} );

	it( 'measures nothing for a window that runs backwards', () => {
		expect( measureStepId( { from: at( 2026, 7, 27 ), to: at( 2026, 7, 21 ) } ) ).toBeUndefined();
	} );
} );

describe( 'shiftStep', () => {
	it( 'moves a run of days by its length', () => {
		const range = wholeDays( at( 2026, 7, 21 ), at( 2026, 7, 27 ) );

		expect( shiftStep( range, { unit: 'day', value: 7 }, 'previous' ) ).toEqual(
			wholeDays( at( 2026, 7, 14 ), at( 2026, 7, 20 ) )
		);
	} );

	it( 'moves months by the calendar, landing on whole months', () => {
		const year = wholeDays( at( 2026, 1, 1 ), at( 2026, 12, 31 ) );

		expect( shiftStep( year, { unit: 'month', value: 12 }, 'previous' ) ).toEqual(
			wholeDays( at( 2025, 1, 1 ), at( 2025, 12, 31 ) )
		);
		expect( shiftStep( year, { unit: 'year', value: 1 }, 'next' ) ).toEqual(
			wholeDays( at( 2027, 1, 1 ), at( 2027, 12, 31 ) )
		);
	} );

	// A window whose end was cut at today, as the month to date is, steps away
	// onto whole units either way.
	it( 'rebuilds the end from the start, so a window cut at today steps away whole', () => {
		const toDate = wholeDays( at( 2026, 8, 1 ), at( 2026, 8, 20 ) );
		const month = { unit: 'month', value: 1 } as const;

		expect( shiftStep( toDate, month, 'previous' ) ).toEqual(
			wholeDays( at( 2026, 7, 1 ), at( 2026, 7, 31 ) )
		);
		expect( shiftStep( toDate, month, 'next' ) ).toEqual(
			wholeDays( at( 2026, 9, 1 ), at( 2026, 9, 30 ) )
		);
		expect(
			shiftStep(
				wholeDays( at( 2026, 10, 31 ), at( 2026, 11, 2 ) ),
				{ unit: 'day', value: 30 },
				'previous'
			)
		).toEqual( wholeDays( at( 2026, 10, 1 ), at( 2026, 10, 30 ) ) );
	} );

	// "Last 24 hours" read on the afternoon the clocks fall back: 24 elapsed
	// hours that show as 23 on the wall. The step moves by elapsed time, so the
	// window keeps its length and the round trip holds.
	it( 'moves hours by elapsed time across a DST change', () => {
		const range = { from: at( 2026, 10, 31, 16 ), to: endOfHourAt( 2026, 11, 1, 14 ) };
		const span = { unit: 'hour', value: 24 } as const;

		const previous = shiftStep( range, span, 'previous' );

		expect( previous ).toEqual( {
			from: at( 2026, 10, 30, 16 ),
			to: endOfHourAt( 2026, 10, 31, 15 ),
		} );
		expect( shiftStep( previous, span, 'next' ) ).toEqual( range );
	} );

	// Havana moves its clocks at midnight, so the first day of DST starts at
	// 01:00: a day step lands on whatever the day's first instant is.
	it( 'keeps whole days across a DST change at midnight', () => {
		const havana = 'America/Havana';
		const week = wholeDays( at( 2026, 3, 1, 0, 0, havana ), at( 2026, 3, 7, 0, 0, havana ) );
		const span = { unit: 'day', value: 7 } as const;

		const next = shiftStep( week, span, 'next' );

		expect( next ).toEqual(
			wholeDays( at( 2026, 3, 8, 0, 0, havana ), at( 2026, 3, 14, 0, 0, havana ) )
		);
		expect( next.from.getHours() ).toBe( 1 );
		expect( shiftStep( next, span, 'previous' ) ).toEqual( week );
	} );
} );

describe( 'endOfStepHorizon', () => {
	const now = at( 2026, 8, 20, 12, 30 );

	it( 'ends today for a window stepping by days, months or years', () => {
		expect( endOfStepHorizon( now, 'day' ) ).toEqual( endOfHourAt( 2026, 8, 20, 23 ) );
		expect( endOfStepHorizon( now, 'month' ) ).toEqual( endOfHourAt( 2026, 8, 20, 23 ) );
	} );

	it( 'ends the running hour for a window stepping by hours', () => {
		expect( endOfStepHorizon( now, 'hour' ) ).toEqual( endOfHourAt( 2026, 8, 20, 12 ) );
	} );
} );
