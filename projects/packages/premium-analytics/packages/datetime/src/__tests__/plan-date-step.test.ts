/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { planDateStep } from '../plan-date-step';
import { computePrimaryRange } from '../presets/primary';

const TIMEZONE = 'UTC';
const NOW = new Date( '2026-08-20T12:00:00.000Z' );

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
function wholeDays( from: [ number, number, number ], to: [ number, number, number ] ) {
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
			'forward from a rolling window whose end has just gone stale',
			{ from: at( [ 2026, 8, 19 ], 11, 59 ), to: at( [ 2026, 8, 20 ], 11, 59 ) },
			'next',
			{},
		],
		[
			'forward from the month to date',
			wholeDays( [ 2026, 8, 1 ], [ 2026, 8, 20 ] ),
			'next',
			{ presetId: 'month-to-date' },
		],
		[
			'forward from the year to date',
			wholeDays( [ 2026, 1, 1 ], [ 2026, 8, 20 ] ),
			'next',
			{ presetId: 'year-to-date' },
		],
		[
			'anywhere from all time',
			wholeDays( [ 2020, 1, 1 ], [ 2026, 8, 20 ] ),
			'next',
			{ presetId: 'all-time' },
		],
		[ 'from a window missing an end', { from: today.from }, 'previous', {} ],
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

	// The latest window ends in the running bucket, in the future for a live
	// one; counting that bucket is what keeps it reachable after a step back.
	it.each( [
		[ 'today', today ],
		[
			'the live hour-snapped window',
			{ from: at( [ 2026, 8, 19 ], 13 ), to: new TZDate( 2026, 7, 20, 12, 59, 59, 999, TIMEZONE ) },
		],
	] )( 'reaches %s from the window behind it, and no further', ( _name, latest ) => {
		const behind = planDateStep( latest, 'previous', context );

		expect( behind ).toBeDefined();
		expect( planDateStep( behind!.range, 'next', context ) ).toMatchObject( { range: latest } );
		expect( planDateStep( latest, 'next', context ) ).toBeUndefined();
	} );

	// The month or year in progress is the bucket `now` sits in, so the window
	// before it steps forward into it and lands on the to-date preset.
	it.each( [
		[ 'month', wholeDays( [ 2026, 7, 1 ], [ 2026, 7, 31 ] ), 'last-month', 'month-to-date' ],
		[ 'year', wholeDays( [ 2025, 1, 1 ], [ 2025, 12, 31 ] ), 'last-year', 'year-to-date' ],
	] as const )(
		'steps the last %s forward into the one in progress',
		( _name, range, presetId, landing ) => {
			expect( planDateStep( range, 'next', { ...context, presetId } ) ).toMatchObject( {
				presetId: landing,
			} );
		}
	);

	it( 'closes the bucket on the site’s clock, not the machine’s', () => {
		// 02:00 UTC on the 20th: still the 19th in New York, the 20th in UTC.
		const now = new Date( Date.UTC( 2026, 7, 20, 2, 0 ) );
		const yesterday = wholeDays( [ 2026, 8, 19 ], [ 2026, 8, 19 ] );

		expect( planDateStep( yesterday, 'next', { timeZone: 'UTC', now } ) ).toMatchObject( {
			range: today,
		} );
	} );

	it( 'names the landing as the preset whose window it is today', () => {
		expect( planDateStep( weekBeforeLast, 'next', context ) ).toEqual( {
			range: computePrimaryRange( 'last-7-days', TIMEZONE ),
			presetId: 'last-7-days',
			span: { unit: 'day', value: 7 },
		} );
	} );

	it( 'keeps the landing custom when the plan locks the preset it is', () => {
		expect(
			planDateStep( weekBeforeLast, 'next', { ...context, lockedPresetIds: [ 'last-7-days' ] } )
		).toMatchObject( { presetId: 'custom' } );
	} );

	// Twelve whole months stepped forward close the running August, days the
	// report has no data for; the landing is the to-date window instead.
	it( 'pulls a forward step that runs past today back to it', () => {
		const step = planDateStep( wholeDays( [ 2024, 9, 1 ], [ 2025, 8, 31 ] ), 'next', context );

		expect( step ).toEqual( {
			range: wholeDays( [ 2025, 9, 1 ], [ 2026, 8, 20 ] ),
			presetId: 'last-12-months',
			span: { unit: 'month', value: 12 },
		} );
	} );

	// The pulled-back landing is no preset, yet it still has to step as the
	// months it stands for, or Previous would move by its days and not undo Next.
	it( 'retraces a forward step that was pulled back to today', () => {
		const now = new Date( '2026-11-02T12:00:00.000Z' );
		jest.setSystemTime( now );
		const summer = wholeDays( [ 2026, 6, 1 ], [ 2026, 8, 31 ] );

		const forward = planDateStep( summer, 'next', { ...context, now } );
		expect( forward ).toEqual( {
			range: wholeDays( [ 2026, 9, 1 ], [ 2026, 11, 2 ] ),
			presetId: 'custom',
			span: { unit: 'month', value: 3 },
		} );

		expect( planDateStep( forward!.range, 'previous', { ...context, now } ) ).toMatchObject( {
			range: summer,
		} );
	} );

	it( 'names the year a year step lands on as the year to date, in January too', () => {
		const now = new Date( '2026-01-15T12:00:00.000Z' );
		jest.setSystemTime( now );
		const lastYear = wholeDays( [ 2025, 1, 1 ], [ 2025, 12, 31 ] );

		expect( planDateStep( lastYear, 'next', { ...context, now, presetId: 'last-year' } ) ).toEqual(
			{
				range: wholeDays( [ 2026, 1, 1 ], [ 2026, 1, 15 ] ),
				presetId: 'year-to-date',
				span: { unit: 'year', value: 1 },
			}
		);
	} );

	// A step by days can land on a whole month or the month to date, which
	// would then step as months; the landing keeps the span that reached it.
	it.each( [
		[
			'a 30-day window onto a whole month',
			wholeDays( [ 2026, 7, 1 ], [ 2026, 7, 30 ] ),
			'previous',
		],
		[
			'a 20-day window onto the month to date',
			wholeDays( [ 2026, 7, 12 ], [ 2026, 7, 31 ] ),
			'next',
		],
	] as const )( 'retraces %s by the span that reached it', ( _name, origin, direction ) => {
		const step = planDateStep( origin, direction, context );
		const back = direction === 'previous' ? 'next' : 'previous';

		expect( step ).toMatchObject( { span: { unit: 'day' } } );
		expect(
			planDateStep( step!.range, back, { ...context, presetId: step!.presetId, span: step!.span } )
		).toMatchObject( { range: origin } );
	} );

	// On the 30th the month to date is also the last 30 days; a window reached
	// by months keeps stepping by months.
	it( 'names a landing reached by months as the calendar preset', () => {
		const now = new Date( '2026-08-30T12:00:00.000Z' );
		jest.setSystemTime( now );
		const july = wholeDays( [ 2026, 7, 1 ], [ 2026, 7, 31 ] );

		expect( planDateStep( july, 'next', { ...context, now, presetId: 'custom' } ) ).toEqual( {
			range: wholeDays( [ 2026, 8, 1 ], [ 2026, 8, 30 ] ),
			presetId: 'month-to-date',
			span: { unit: 'month', value: 1 },
		} );
	} );
} );
