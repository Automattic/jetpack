/**
 * Internal dependencies
 */
import { chartInterval, defaultPeriodForInterval, drawableIntervals } from '../periods';

// The period sets in use.
const DAY_WEEK_MONTH = [ 'day', 'week', 'month' ] as const;
const DAY_WEEK_MONTH_YEAR = [ 'day', 'week', 'month', 'year' ] as const;
const HOUR_DAY_WEEK_MONTH = [ 'hour', 'day', 'week', 'month' ] as const;

describe( 'defaultPeriodForInterval', () => {
	describe( 'day/week/month widgets (subscribers chart)', () => {
		it.each( [
			[ 'week', 'week' ],
			[ 'month', 'month' ],
			// No year option in the dropdown, so year clamps to the coarsest allowed.
			[ 'year', 'month' ],
			[ 'day', 'day' ],
			[ 'hour', 'day' ],
			[ undefined, 'day' ],
			[ 'nonsense', 'day' ],
		] )( 'maps %s to %s', ( interval, expected ) => {
			expect( defaultPeriodForInterval( interval, DAY_WEEK_MONTH ) ).toBe( expected );
		} );
	} );

	describe( 'day/week/month/year widgets (wordads chart tabs)', () => {
		it.each( [
			[ 'week', 'week' ],
			[ 'month', 'month' ],
			// Year is offered here, so it is kept rather than collapsed.
			[ 'year', 'year' ],
			[ 'day', 'day' ],
			[ undefined, 'day' ],
			[ 'nonsense', 'day' ],
		] )( 'maps %s to %s', ( interval, expected ) => {
			expect( defaultPeriodForInterval( interval, DAY_WEEK_MONTH_YEAR ) ).toBe( expected );
		} );
	} );

	describe( 'hour/day/week/month widgets (traffic chart)', () => {
		it.each( [
			[ 'hour', 'hour' ],
			[ 'day', 'day' ],
			[ 'week', 'week' ],
			[ 'year', 'month' ],
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
} );
