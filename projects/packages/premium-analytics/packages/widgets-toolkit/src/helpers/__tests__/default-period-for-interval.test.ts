/**
 * Internal dependencies
 */
import { defaultPeriodForInterval } from '../default-period-for-interval';

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
