/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { addDays, addYears, endOfMonth, startOfDay, startOfMonth, subMonths } from 'date-fns';
/**
 * Internal dependencies
 */
import { planDateStep } from '../plan-date-step';
import { computePrimaryRange } from '../presets/primary';
import { SELECTABLE_PRESETS, type SelectablePresetId } from '../presets/types';
import type { DateRange } from '../get-comparison-range';

const TIMEZONE = 'UTC';
const NOW = new Date( '2026-08-20T12:00:00.000Z' );
const MS_PER_HOUR = 60 * 60 * 1000;

beforeAll( () => {
	jest.useFakeTimers();
} );

afterAll( () => {
	jest.useRealTimers();
} );

/**
 * Whole days on the site's clock.
 *
 * @param from - First day, as `[ year, month, day ]` with a 1-based month.
 * @param to   - Last day, likewise.
 * @return The inclusive range.
 */
function wholeDays(
	from: [ number, number, number ],
	to: [ number, number, number ]
): Required< DateRange > {
	return {
		from: new TZDate( from[ 0 ], from[ 1 ] - 1, from[ 2 ], 0, 0, 0, 0, TIMEZONE ),
		to: new TZDate( to[ 0 ], to[ 1 ] - 1, to[ 2 ], 23, 59, 59, 999, TIMEZONE ),
	};
}

/**
 * An instant on the site's clock.
 *
 * @param date   - `[ year, month, day ]` with a 1-based month.
 * @param hour   - Hour of the day.
 * @param minute - Minute of the hour.
 * @return The date.
 */
function at( date: [ number, number, number ], hour = 0, minute = 0 ): TZDate {
	return new TZDate( date[ 0 ], date[ 1 ] - 1, date[ 2 ], hour, minute, 0, 0, TIMEZONE );
}

/**
 * The last instant of an hour on the site's clock.
 *
 * @param date - `[ year, month, day ]` with a 1-based month.
 * @param hour - Hour of the day.
 * @return The date.
 */
function endOfHourAt( date: [ number, number, number ], hour: number ): TZDate {
	return new TZDate( date[ 0 ], date[ 1 ] - 1, date[ 2 ], hour, 59, 59, 999, TIMEZONE );
}

/**
 * A window as a failure names it.
 *
 * @param range - The window.
 * @return Both ends, in the site's zone.
 */
function describeRange( range: Required< DateRange > | undefined ): string {
	return range ? `${ range.from.toISOString() } – ${ range.to.toISOString() }` : 'nothing';
}

describe( 'planDateStep', () => {
	const context = { timeZone: TIMEZONE, now: NOW };
	const weekBeforeLast = wholeDays( [ 2026, 8, 7 ], [ 2026, 8, 13 ] );
	const today = wholeDays( [ 2026, 8, 20 ], [ 2026, 8, 20 ] );

	// The presets read the clock; hand it back as found, since a group sibling
	// sharing the registry may have frozen it for its own run.
	let clock: number;
	beforeEach( () => {
		clock = Date.now();
		jest.setSystemTime( NOW );
	} );
	afterEach( () => jest.setSystemTime( clock ) );

	it.each( [
		[
			'back before the earliest date the plan allows',
			weekBeforeLast,
			'previous',
			{ earliestDate: weekBeforeLast.from },
		],
		[ 'forward from the latest window', wholeDays( [ 2026, 8, 14 ], [ 2026, 8, 20 ] ), 'next', {} ],
		[ 'forward from today', today, 'next', {} ],
		[
			'forward from the live hour-snapped window',
			{ from: at( [ 2026, 8, 19 ], 13 ), to: endOfHourAt( [ 2026, 8, 20 ], 12 ) },
			'next',
			{ presetId: 'last-24-hours' },
		],
		[
			'forward from the month to date',
			wholeDays( [ 2026, 8, 1 ], [ 2026, 8, 20 ] ),
			'next',
			{ presetId: 'month-to-date' },
		],
		[
			'anywhere from all time',
			wholeDays( [ 2020, 1, 1 ], [ 2026, 8, 20 ] ),
			'previous',
			{ presetId: 'all-time' },
		],
		[ 'from a window missing an end', { from: today.from }, 'previous', {} ],
		[ 'from a window that runs backwards', { from: today.to, to: today.from }, 'previous', {} ],
	] as const )( 'refuses a step %s', ( _name, range, direction, extra ) => {
		expect( planDateStep( range, direction, { ...context, ...extra } ) ).toBeUndefined();
	} );

	it( 'allows a step back to the earliest date the plan allows', () => {
		expect(
			planDateStep( weekBeforeLast, 'previous', {
				...context,
				earliestDate: at( [ 2026, 7, 31 ] ),
			} )
		).toMatchObject( { range: wholeDays( [ 2026, 7, 31 ], [ 2026, 8, 6 ] ) } );
	} );

	it( 'steps a preset by its own unit, and names only the return to it', () => {
		const lastWeek = computePrimaryRange( 'last-7-days', TIMEZONE )!;

		const back = planDateStep( lastWeek, 'previous', { ...context, presetId: 'last-7-days' } );
		expect( back ).toEqual( { range: weekBeforeLast, presetId: 'custom', step: 'last-7-days' } );

		const forward = planDateStep( back!.range, 'next', {
			...context,
			presetId: 'custom',
			step: 'last-7-days',
		} );
		expect( forward ).toEqual( { range: lastWeek, presetId: 'last-7-days', step: 'last-7-days' } );
	} );

	// Jun 1–30 is a whole month, which measured afresh would step as one.
	it( 'steps by the step the URL carries, whatever shape the window has', () => {
		const june = wholeDays( [ 2026, 6, 1 ], [ 2026, 6, 30 ] );

		expect( planDateStep( june, 'next', { ...context, step: 'P30D' } ) ).toEqual( {
			range: wholeDays( [ 2026, 7, 1 ], [ 2026, 7, 30 ] ),
			presetId: 'custom',
			step: 'P30D',
		} );
	} );

	it.each( [
		[
			'thirty days',
			wholeDays( [ 2026, 7, 1 ], [ 2026, 7, 30 ] ),
			'P30D',
			wholeDays( [ 2026, 6, 1 ], [ 2026, 6, 30 ] ),
		],
		[
			'a whole month',
			wholeDays( [ 2026, 7, 1 ], [ 2026, 7, 31 ] ),
			'P1M',
			wholeDays( [ 2026, 6, 1 ], [ 2026, 6, 30 ] ),
		],
		[
			'a whole year',
			wholeDays( [ 2025, 1, 1 ], [ 2025, 12, 31 ] ),
			'P1Y',
			wholeDays( [ 2024, 1, 1 ], [ 2024, 12, 31 ] ),
		],
	] )( 'measures a hand-picked window of %s on its first step', ( _name, range, step, landing ) => {
		expect( planDateStep( range, 'previous', context ) ).toEqual( {
			range: landing,
			presetId: 'custom',
			step,
		} );
	} );

	it.each( [
		[
			'the applied preset over a step the URL carries',
			{ presetId: 'last-7-days', step: 'P1M' },
			'last-7-days',
		],
		[ 'the window’s shape over a step the URL cannot name', { step: 'P0D' }, 'P7D' ],
		[ 'the window’s shape over a step no date can hold', { step: 'P999999999D' }, 'P7D' ],
	] as const )( 'reads %s', ( _name, extra, step ) => {
		expect( planDateStep( weekBeforeLast, 'previous', { ...context, ...extra } ) ).toMatchObject( {
			range: wholeDays( [ 2026, 7, 31 ], [ 2026, 8, 6 ] ),
			step,
		} );
	} );

	// Oct 31 to today have data, so the window after Oct 1–30 is offered, cut at
	// today; it steps back onto the thirty days it came from.
	it( 'steps forward into a window that has begun, cut at today', () => {
		const now = new Date( '2026-11-02T12:00:00.000Z' );
		const thirtyDays = wholeDays( [ 2026, 10, 1 ], [ 2026, 10, 30 ] );

		const forward = planDateStep( thirtyDays, 'next', { ...context, now } );
		expect( forward ).toEqual( {
			range: wholeDays( [ 2026, 10, 31 ], [ 2026, 11, 2 ] ),
			presetId: 'custom',
			step: 'P30D',
		} );

		expect(
			planDateStep( forward!.range, 'previous', { ...context, now, step: forward!.step } )
		).toMatchObject( { range: thirtyDays } );
	} );

	it( 'steps the month to date back to the whole month before, and forward to itself', () => {
		const toDate = computePrimaryRange( 'month-to-date', TIMEZONE )!;

		const back = planDateStep( toDate, 'previous', { ...context, presetId: 'month-to-date' } );
		expect( back ).toEqual( {
			range: wholeDays( [ 2026, 7, 1 ], [ 2026, 7, 31 ] ),
			presetId: 'custom',
			step: 'month-to-date',
		} );

		expect( planDateStep( back!.range, 'next', { ...context, step: back!.step } ) ).toEqual( {
			range: toDate,
			presetId: 'month-to-date',
			step: 'month-to-date',
		} );
	} );

	it( 'steps the last month into the month in progress without naming it', () => {
		const july = computePrimaryRange( 'last-month', TIMEZONE )!;

		expect( planDateStep( july, 'next', { ...context, presetId: 'last-month' } ) ).toEqual( {
			range: wholeDays( [ 2026, 8, 1 ], [ 2026, 8, 20 ] ),
			presetId: 'custom',
			step: 'last-month',
		} );
	} );

	// In December the year to date covers the same days; the window keeps the
	// name it set out with, so the dashboard never remembers the other preset.
	it( 'names a return to "Last 12 months" as that, not as the year to date', () => {
		const now = new Date( '2026-12-03T12:00:00.000Z' );
		jest.setSystemTime( now );
		const twelveMonths = computePrimaryRange( 'last-12-months', TIMEZONE )!;

		const back = planDateStep( twelveMonths, 'previous', {
			...context,
			now,
			presetId: 'last-12-months',
		} );
		expect( back ).toMatchObject( { range: wholeDays( [ 2025, 1, 1 ], [ 2025, 12, 31 ] ) } );

		expect( planDateStep( back!.range, 'next', { ...context, now, step: back!.step } ) ).toEqual( {
			range: twelveMonths,
			presetId: 'last-12-months',
			step: 'last-12-months',
		} );
	} );

	it( 'cuts an hour window at the running hour', () => {
		const now = new Date( '2026-08-20T12:30:00.000Z' );
		const earlier = { from: at( [ 2026, 8, 20 ], 8 ), to: endOfHourAt( [ 2026, 8, 20 ], 10 ) };

		expect( planDateStep( earlier, 'next', { ...context, now } ) ).toEqual( {
			range: { from: at( [ 2026, 8, 20 ], 11 ), to: endOfHourAt( [ 2026, 8, 20 ], 12 ) },
			presetId: 'custom',
			step: 'PT3H',
		} );
	} );

	it( 'closes the day on the site’s clock, not the machine’s', () => {
		// 02:00 UTC on the 20th: still the 19th in New York, the 20th in UTC.
		const now = new Date( Date.UTC( 2026, 7, 20, 2, 0 ) );
		const yesterday = wholeDays( [ 2026, 8, 19 ], [ 2026, 8, 19 ] );

		expect( planDateStep( yesterday, 'next', { timeZone: 'UTC', now } ) ).toMatchObject( {
			range: today,
		} );
	} );
} );

/*
 * Every preset on every day of a leap year: in a zone without DST, one that
 * moves its clocks at midnight, and one in the southern hemisphere. The window
 * before a preset is spelled out from the presets themselves, read on an
 * earlier day, so a drift of a day or an hour names the date it happened on.
 */
describe( 'planDateStep over a year', () => {
	const ZONES = [ 'UTC', 'America/Havana', 'Pacific/Auckland' ];
	const YEAR = 2024;

	// The sweep moves the clock through the year; hand it back as found.
	let clock: number;
	beforeEach( () => {
		clock = Date.now();
	} );
	afterEach( () => jest.setSystemTime( clock ) );

	/**
	 * A preset's window as read at some other instant.
	 *
	 * @param presetId - The preset.
	 * @param timeZone - The site's zone.
	 * @param instant  - The instant to read it at.
	 * @return The window.
	 */
	function presetAt( presetId: SelectablePresetId, timeZone: string, instant: number ) {
		const was = Date.now();
		jest.setSystemTime( instant );
		const range = computePrimaryRange( presetId, timeZone )!;
		jest.setSystemTime( was );

		return range;
	}

	/**
	 * The window a preset steps back onto, from the presets' own definitions.
	 *
	 * @param presetId - The preset.
	 * @param timeZone - The site's zone.
	 * @param now      - The instant the preset was read at, in that zone.
	 * @return The window before.
	 */
	function windowBefore( presetId: SelectablePresetId, timeZone: string, now: TZDate ) {
		switch ( presetId ) {
			case 'today':
				return presetAt( 'yesterday', timeZone, now.getTime() );
			case 'yesterday':
				return presetAt( 'yesterday', timeZone, addDays( now, -1 ).getTime() );
			case 'last-24-hours':
				return presetAt( presetId, timeZone, now.getTime() - 24 * MS_PER_HOUR );
			case 'last-7-days':
				return presetAt( presetId, timeZone, addDays( now, -7 ).getTime() );
			case 'last-30-days':
				return presetAt( presetId, timeZone, addDays( now, -30 ).getTime() );
			case 'last-90-days':
				return presetAt( presetId, timeZone, addDays( now, -90 ).getTime() );
			case 'last-365-days':
				return presetAt( presetId, timeZone, addDays( now, -365 ).getTime() );
			case 'month-to-date':
				return presetAt( 'last-month', timeZone, now.getTime() );
			case 'last-month':
				return presetAt( 'last-month', timeZone, subMonths( now, 1 ).getTime() );
			case 'year-to-date':
				return presetAt( 'last-year', timeZone, now.getTime() );
			case 'last-year':
				return presetAt( 'last-year', timeZone, addYears( now, -1 ).getTime() );
			case 'last-12-months': {
				const today = startOfDay( now );
				const firstMonth = subMonths( today, 23 );
				const lastMonth = subMonths( today, 12 );

				return { from: startOfMonth( firstMonth ), to: endOfMonth( lastMonth ) };
			}
		}
	}

	/** The preset whose window lies after a live preset's, where it has begun. */
	const WINDOW_AFTER: Partial< Record< SelectablePresetId, SelectablePresetId > > = {
		yesterday: 'today',
		'last-month': 'month-to-date',
		'last-year': 'year-to-date',
	};

	/**
	 * Whether two windows are the same instants.
	 *
	 * @param a - One window.
	 * @param b - The other.
	 * @return Whether they match.
	 */
	function sameWindow(
		a: Required< DateRange > | undefined,
		b: Required< DateRange > | undefined
	) {
		return a?.from.getTime() === b?.from.getTime() && a?.to.getTime() === b?.to.getTime();
	}

	const presets = SELECTABLE_PRESETS.map( presetId => [ presetId ] as const );

	describe.each( ZONES )( 'in %s', timeZone => {
		it.each( presets )(
			'steps %s back onto the window before and forward onto itself, every day',
			presetId => {
				const faults: string[] = [];
				const first = new TZDate( YEAR, 0, 1, 12, 0, 0, 0, timeZone );

				for ( let day = 0; day < 366; day++ ) {
					const now = addDays( first, day );
					jest.setSystemTime( now.getTime() );
					const live = computePrimaryRange( presetId, timeZone )!;
					const context = { timeZone, now, presetId };
					const stamp = now.toISOString().slice( 0, 10 );

					const back = planDateStep( live, 'previous', context );
					const before = windowBefore( presetId, timeZone, now );
					if ( ! sameWindow( back?.range, before ) ) {
						faults.push(
							`${ stamp } back: ${ describeRange( back?.range ) }, expected ${ describeRange( before ) }`
						);
						continue;
					}

					const forward = planDateStep( back!.range, 'next', { timeZone, now, step: back!.step } );
					if ( ! sameWindow( forward?.range, live ) || forward?.presetId !== presetId ) {
						faults.push(
							`${ stamp } forward: ${ describeRange( forward?.range ) } as ${ forward?.presetId }, expected ${ describeRange( live ) } as ${ presetId }`
						);
					}

					const after = WINDOW_AFTER[ presetId ];
					const next = planDateStep( live, 'next', context );
					const expected = after ? computePrimaryRange( after, timeZone ) : undefined;
					if (
						expected ? ! sameWindow( next?.range, expected ) || next?.presetId !== 'custom' : next
					) {
						faults.push(
							`${ stamp } next: ${ describeRange( next?.range ) }, expected ${ describeRange( expected ) }`
						);
					}
				}

				expect( faults ).toEqual( [] );
			}
		);
	} );
} );
