/**
 * Internal dependencies
 */
import { defaultPeriodForInterval } from '../default-period-for-interval';

// The two period sets in use. Both are ordered finest to coarsest, which the
// helper relies on when clamping.
const DAY_WEEK_MONTH = [ 'day', 'week', 'month' ] as const;
const DAY_WEEK_MONTH_YEAR = [ 'day', 'week', 'month', 'year' ] as const;

describe( 'defaultPeriodForInterval', () => {
	describe( 'day/week/month widgets (traffic chart, subscribers chart)', () => {
		it.each( [
			[ 'week', 'week' ],
			[ 'month', 'month' ],
			[ 'quarter', 'month' ],
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
			[ 'quarter', 'month' ],
			// Year is offered here, so it is kept rather than collapsed.
			[ 'year', 'year' ],
			[ 'day', 'day' ],
			[ undefined, 'day' ],
			[ 'nonsense', 'day' ],
		] )( 'maps %s to %s', ( interval, expected ) => {
			expect( defaultPeriodForInterval( interval, DAY_WEEK_MONTH_YEAR ) ).toBe( expected );
		} );
	} );

	it( 'clamps to the coarsest allowed period when the mapped one is unsupported', () => {
		expect( defaultPeriodForInterval( 'year', [ 'day', 'week' ] as const ) ).toBe( 'week' );
		expect( defaultPeriodForInterval( 'month', [ 'day' ] as const ) ).toBe( 'day' );
	} );
} );
