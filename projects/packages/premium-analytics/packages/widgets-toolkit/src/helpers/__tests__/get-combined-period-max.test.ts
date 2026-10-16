/**
 * Internal dependencies
 */
import { getCombinedPeriodMax } from '../get-combined-period-max';

describe( 'getCombinedPeriodMax', () => {
	it( 'returns the largest value across both periods', () => {
		expect( getCombinedPeriodMax( [ 100, 50 ], [ 1000, 25 ] ) ).toBe( 1000 );
	} );

	it( 'ignores missing comparison values', () => {
		expect( getCombinedPeriodMax( [ 100, 50 ], [ undefined, 75 ] ) ).toBe( 100 );
	} );

	it( 'uses only the current period when comparison values are absent', () => {
		expect( getCombinedPeriodMax( [ 100, 50 ], [] ) ).toBe( 100 );
		expect( getCombinedPeriodMax( [ 100, 50 ] ) ).toBe( 100 );
	} );

	it( 'returns zero for empty or entirely negative data', () => {
		expect( getCombinedPeriodMax( [], [] ) ).toBe( 0 );
		expect( getCombinedPeriodMax( [ -10 ], [ -5 ] ) ).toBe( 0 );
	} );
} );
