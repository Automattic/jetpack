/**
 * Internal dependencies
 */
import { defaultPeriodForInterval, drawableIntervals } from '../periods';

// The period sets in use. All are ordered finest to coarsest, which the helper
// relies on when clamping.
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
} );
