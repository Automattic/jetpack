/**
 * Internal dependencies
 */
import { calculateDelta } from '../calculate-delta';

describe( 'calculateDelta', () => {
	it( 'calculates a percentage increase', () => {
		expect( calculateDelta( 150, 100 ) ).toBe( 50 );
	} );

	it( 'calculates a percentage decrease', () => {
		expect( calculateDelta( 75, 100 ) ).toBe( -25 );
	} );

	it( 'returns zero when both values are zero', () => {
		expect( calculateDelta( 0, 0 ) ).toBe( 0 );
	} );

	it( 'returns -100 when the current value drops to zero', () => {
		expect( calculateDelta( 0, 100 ) ).toBe( -100 );
	} );

	it.each( [ 100, -100 ] )(
		'returns undefined when the previous value is zero and the current value is %d',
		currentValue => {
			expect( calculateDelta( currentValue, 0 ) ).toBeUndefined();
		}
	);
} );
