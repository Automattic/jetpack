/**
 * Internal dependencies
 */
import { compareOptionalNumbers } from '../compare-optional-numbers';

// Wrapped in rows: `Array#sort` moves bare `undefined` elements last without calling the comparator.
const sortRows = ( values: ( number | undefined )[], direction: 'asc' | 'desc' ) =>
	values
		.map( value => ( { value } ) )
		.sort( ( a, b ) => compareOptionalNumbers( a.value, b.value, direction ) )
		.map( row => row.value );

describe( 'compareOptionalNumbers', () => {
	it( 'orders numbers by direction', () => {
		expect( sortRows( [ 2, 0, 5 ], 'asc' ) ).toEqual( [ 0, 2, 5 ] );
		expect( sortRows( [ 2, 0, 5 ], 'desc' ) ).toEqual( [ 5, 2, 0 ] );
	} );

	it( 'keeps missing values last in either direction', () => {
		expect( sortRows( [ undefined, 0, 3 ], 'asc' ) ).toEqual( [ 0, 3, undefined ] );
		expect( sortRows( [ 3, undefined, 0 ], 'desc' ) ).toEqual( [ 3, 0, undefined ] );
	} );
} );
