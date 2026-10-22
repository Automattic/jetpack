/**
 * Internal dependencies
 */
import { NO_LOCKED_INTERVALS, type IntervalType, type LockableInterval } from '../interval';
import {
	chartInterval,
	defaultPeriodForInterval,
	drawableIntervals,
	intervalMenuOptions,
	type IntervalExtension,
	type IntervalRange,
} from '../periods';

// The period sets in use.
const DAY_WEEK_MONTH = [ 'day', 'week', 'month' ] as const;
const DAY_WEEK_MONTH_YEAR = [ 'day', 'week', 'month', 'year' ] as const;
const HOUR_DAY_WEEK_MONTH = [ 'hour', 'day', 'week', 'month' ] as const;

const LAST_30_DAYS = {
	preset: 'last-30-days',
	from: '2026-09-16',
	to: '2026-10-15',
} satisfies IntervalRange;
const LAST_90_DAYS = {
	preset: 'last-90-days',
	from: '2026-07-18',
	to: '2026-10-15',
} satisfies IntervalRange;
const LAST_12_MONTHS = {
	preset: 'last-12-months',
	from: '2025-11-01',
	to: '2026-10-31',
} satisfies IntervalRange;
const ADD_DAYS: IntervalExtension = { extra: [ 'day' ] };
const WITHHOLD_DAYS: IntervalExtension = { unavailable: { intervals: [ 'day' ], hint: 'H' } };

describe( 'defaultPeriodForInterval', () => {
	describe( 'day/week/month widgets (subscribers chart)', () => {
		it.each( [
			[ 'week', 'week' ],
			[ 'month', 'month' ],
			// No year option in the dropdown, so year clamps to the coarsest allowed.
			[ 'year', 'month' ],
			[ 'day', 'day' ],
			[ 'hour', 'day' ],
		] )( 'maps %s to %s', ( interval, expected ) => {
			expect( defaultPeriodForInterval( interval, DAY_WEEK_MONTH ) ).toBe( expected );
		} );
	} );

	describe( 'hour/day/week/month widgets (traffic chart)', () => {
		it.each( [
			[ 'hour', 'hour' ],
			[ undefined, 'day' ],
			[ 'nonsense', 'day' ],
		] )( 'maps %s to %s', ( interval, expected ) => {
			expect( defaultPeriodForInterval( interval, HOUR_DAY_WEEK_MONTH ) ).toBe( expected );
		} );
	} );

	it( 'clamps to the coarsest allowed period when the mapped one is too coarse', () => {
		expect( defaultPeriodForInterval( 'year', [ 'day', 'week' ] as const ) ).toBe( 'week' );
		expect( defaultPeriodForInterval( 'month', [ 'day' ] as const ) ).toBe( 'day' );
	} );

	it( 'clamps to the finest allowed period when the mapped one is too fine', () => {
		expect( defaultPeriodForInterval( 'hour', [ 'week', 'month' ] as const ) ).toBe( 'week' );
		expect( defaultPeriodForInterval( 'day', [ 'week' ] as const ) ).toBe( 'week' );
	} );

	it( 'reads the allowed periods as a set, whatever order they arrive in', () => {
		expect( defaultPeriodForInterval( 'hour', [ 'month', 'day', 'week' ] as const ) ).toBe( 'day' );
		expect( defaultPeriodForInterval( 'year', [ 'month', 'day', 'week' ] as const ) ).toBe(
			'month'
		);
	} );
} );

describe( 'drawableIntervals', () => {
	it( 'drops a bucket the chart would clamp away', () => {
		// A 2–6 day window allows both, but a daily report cannot draw hours.
		expect( drawableIntervals( [ 'day', 'hour' ], DAY_WEEK_MONTH_YEAR ) ).toEqual( [ 'day' ] );
	} );

	it( 'keeps every bucket the chart draws, in the order given', () => {
		expect( drawableIntervals( [ 'week', 'month' ], DAY_WEEK_MONTH_YEAR ) ).toEqual( [
			'week',
			'month',
		] );
	} );

	it( 'falls back to where the clamp lands when nothing survives', () => {
		// Today and Yesterday allow hours alone, which no daily report draws.
		expect( drawableIntervals( [ 'hour' ], DAY_WEEK_MONTH_YEAR ) ).toEqual( [ 'day' ] );
	} );

	it( 'dedupes buckets that clamp onto the same period', () => {
		expect( drawableIntervals( [ 'hour', 'day' ], [ 'week', 'month' ] as const ) ).toEqual( [
			'week',
		] );
	} );

	it( 'leaves a chart that draws hours alone', () => {
		expect( drawableIntervals( [ 'day', 'hour' ], HOUR_DAY_WEEK_MONTH ) ).toEqual( [
			'day',
			'hour',
		] );
	} );

	it( 'keeps years for a chart that draws them, and drops them for one that does not', () => {
		expect( drawableIntervals( [ 'month', 'year' ], DAY_WEEK_MONTH_YEAR ) ).toEqual( [
			'month',
			'year',
		] );
		expect( drawableIntervals( [ 'month', 'year' ], HOUR_DAY_WEEK_MONTH ) ).toEqual( [ 'month' ] );
	} );

	it( 'has nothing to offer when the range allows nothing', () => {
		expect( drawableIntervals( [], DAY_WEEK_MONTH_YEAR ) ).toEqual( [] );
	} );

	it( 'clamps both ways, so a finer-only chart lists a bucket the range excludes', () => {
		// Pins the one-sided invariant the fallback assumes: no grain offers only
		// buckets finer than the range allows, and this is what one would get.
		expect( drawableIntervals( [ 'day', 'week' ], [ 'hour' ] as const ) ).toEqual( [ 'hour' ] );
	} );
} );

describe( 'chartInterval', () => {
	// A 3-day window: the range allows hours and days, a daily report draws days.
	const CUSTOM_3_DAYS = {
		preset: undefined,
		from: '2026-08-01T00:00:00',
		to: '2026-08-03T23:59:59',
	} as const;

	it( 'keeps a bucket the range allows and the chart draws', () => {
		expect( chartInterval( { ...CUSTOM_3_DAYS, interval: 'day' }, DAY_WEEK_MONTH_YEAR ) ).toBe(
			'day'
		);
	} );

	it( 'clamps a bucket the chart cannot draw', () => {
		expect( chartInterval( { ...CUSTOM_3_DAYS, interval: 'hour' }, DAY_WEEK_MONTH_YEAR ) ).toBe(
			'day'
		);
	} );

	it( 'stays inside the menu for a chart whose periods have a gap', () => {
		// The range allows day and week; this chart skips week, so the menu is
		// day alone. Clamping against the widget's own set would land on month,
		// which the menu never lists.
		const params = {
			preset: undefined,
			from: '2026-07-09T00:00:00',
			to: '2026-08-07T23:59:59',
			interval: 'week',
		} as const;

		expect( drawableIntervals( [ 'day', 'week' ], [ 'day', 'month' ] as const ) ).toEqual( [
			'day',
		] );
		expect( chartInterval( params, [ 'day', 'month' ] as const ) ).toBe( 'day' );
	} );

	it( 'keeps the chart off a bucket the plan locks', () => {
		const params = {
			preset: 'last-30-days',
			from: '2026-09-16',
			to: '2026-10-15',
			interval: 'week',
		} as const;

		expect( chartInterval( params, DAY_WEEK_MONTH ) ).toBe( 'week' );
		expect( chartInterval( params, DAY_WEEK_MONTH, [ 'week', 'month', 'year' ] ) ).toBe( 'day' );
	} );

	// A chart with no bucket control (WordAds) passes none: the window alone picks it.
	it( 'draws the range default when no bucket is stored', () => {
		const params = { from: 'a', to: 'b', interval: undefined };

		expect( chartInterval( { ...params, preset: 'last-12-months' }, DAY_WEEK_MONTH ) ).toBe(
			'month'
		);
		expect( chartInterval( { ...params, preset: 'last-30-days' }, DAY_WEEK_MONTH ) ).toBe( 'day' );
		expect( chartInterval( { ...CUSTOM_3_DAYS, interval: undefined }, DAY_WEEK_MONTH ) ).toBe(
			'day'
		);
	} );

	it.each<
		[
			string,
			typeof LAST_30_DAYS | typeof LAST_90_DAYS | typeof LAST_12_MONTHS,
			IntervalType | undefined,
			IntervalExtension | undefined,
			string,
		]
	>( [
		[ 'clamps days away without an extension', LAST_90_DAYS, 'day', undefined, 'week' ],
		[ 'draws a bucket the widget adds', LAST_90_DAYS, 'day', ADD_DAYS, 'day' ],
		[ 'keeps the range default first', LAST_90_DAYS, undefined, ADD_DAYS, 'week' ],
		[ 'draws months for a withheld bucket', LAST_12_MONTHS, 'day', WITHHOLD_DAYS, 'month' ],
	] )( '%s', ( _, range, interval, extension, expected ) => {
		expect(
			chartInterval( { ...range, interval }, DAY_WEEK_MONTH, NO_LOCKED_INTERVALS, extension )
		).toBe( expected );
	} );
} );

describe( 'intervalMenuOptions', () => {
	const MULTI_YEAR = { preset: undefined, from: '2023-01-01', to: '2026-06-30' };
	const CUSTOM_200_DAYS = { preset: undefined, from: '2026-01-01', to: '2026-07-19' };
	const LOCKED = [ 'week', 'month', 'year' ] as const;

	it.each( [
		[ 'a chart that draws no years', MULTI_YEAR, HOUR_DAY_WEEK_MONTH, [ 'day' ], [ 'month' ] ],
		[ 'a widget that declares no periods', MULTI_YEAR, undefined, [ 'day' ], [ 'month', 'year' ] ],
		[ 'a chart without days', LAST_30_DAYS, [ 'week', 'month' ] as const, [ 'week' ], [] ],
	] )( 'splits the buckets for %s', ( _, params, periods, options, lockedOptions ) => {
		expect( intervalMenuOptions( params, LOCKED, periods ) ).toEqual( {
			options,
			lockedOptions,
			unavailableOptions: [],
		} );
	} );

	it.each< [ string, IntervalRange, readonly LockableInterval[], IntervalExtension, object ] >( [
		[
			'a bucket the widget adds, after the range default',
			LAST_90_DAYS,
			NO_LOCKED_INTERVALS,
			ADD_DAYS,
			{ options: [ 'week', 'month', 'day' ], lockedOptions: [], unavailableOptions: [] },
		],
		[
			'no second copy of a bucket the range already offers',
			LAST_30_DAYS,
			NO_LOCKED_INTERVALS,
			ADD_DAYS,
			{ options: [ 'day', 'week' ], lockedOptions: [], unavailableOptions: [] },
		],
		[
			'a bucket the widget withholds, with its hint',
			LAST_90_DAYS,
			NO_LOCKED_INTERVALS,
			WITHHOLD_DAYS,
			{
				options: [ 'week', 'month' ],
				lockedOptions: [],
				unavailableOptions: [ 'day' ],
				unavailableHint: 'H',
			},
		],
		[
			'a withheld bucket the plan already left open',
			CUSTOM_200_DAYS,
			LOCKED,
			WITHHOLD_DAYS,
			{ options: [ 'day' ], lockedOptions: [ 'week', 'month' ], unavailableOptions: [] },
		],
	] )( 'lists %s', ( _, params, locked, extension, expected ) => {
		expect( intervalMenuOptions( params, locked, DAY_WEEK_MONTH, extension ) ).toStrictEqual(
			expected
		);
	} );
} );
