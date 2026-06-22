import { FOCAL_POINT_META_KEY, readFocalPointMeta } from '../focal-point';

describe( 'readFocalPointMeta', () => {
	it( 'returns the stored point from an attachment record', () => {
		const record = { meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25, y: 0.75 } } };

		expect( readFocalPointMeta( record ) ).toEqual( { x: 0.25, y: 0.75 } );

		// Boundary values (0 and 1) are valid.
		expect( readFocalPointMeta( { meta: { [ FOCAL_POINT_META_KEY ]: { x: 0, y: 1 } } } ) ).toEqual(
			{ x: 0, y: 1 }
		);
	} );

	it( 'returns undefined for a missing record or missing meta', () => {
		expect( readFocalPointMeta( undefined ) ).toBeUndefined();
		expect( readFocalPointMeta( {} ) ).toBeUndefined();
		expect( readFocalPointMeta( { meta: {} } ) ).toBeUndefined();
	} );

	it( 'returns undefined for a malformed or out-of-range stored point', () => {
		const wrap = ( value: unknown ) => ( { meta: { [ FOCAL_POINT_META_KEY ]: value } } );

		expect( readFocalPointMeta( wrap( { x: 0.5 } ) ) ).toBeUndefined(); // missing axis
		expect( readFocalPointMeta( wrap( { x: 1.1, y: 0.5 } ) ) ).toBeUndefined(); // out of range
		expect( readFocalPointMeta( wrap( { x: -0.1, y: 0.5 } ) ) ).toBeUndefined(); // out of range
		expect( readFocalPointMeta( wrap( { x: NaN, y: 0.5 } ) ) ).toBeUndefined(); // non-finite
		expect( readFocalPointMeta( wrap( [ 0.5, 0.5 ] ) ) ).toBeUndefined(); // array
		expect( readFocalPointMeta( wrap( 'nope' ) ) ).toBeUndefined(); // non-object
	} );
} );
