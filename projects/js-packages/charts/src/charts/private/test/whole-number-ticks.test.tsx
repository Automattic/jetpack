import { createScale } from '@visx/scale';
import { getWholeNumberTickValues, hasOnlyWholeNumbers } from '../whole-number-ticks';
import type { SeriesData } from '../../../types';

const linear = ( domain: [ number, number ] ) =>
	createScale( { type: 'linear', domain, range: [ 100, 0 ] } );

const series = ( ...values: Array< number | null > ): SeriesData => ( {
	label: 'A',
	data: values.map( ( value, i ) => ( { date: new Date( 2024, i, 1 ), value } ) ),
} );

describe( 'getWholeNumberTickValues', () => {
	it( 'keeps only the whole ticks of a range smaller than the tick count', () => {
		expect( getWholeNumberTickValues( linear( [ 0, 1 ] ), 4 ) ).toEqual( [ 0, 1 ] );
		expect( getWholeNumberTickValues( linear( [ 0, 2 ] ), 4 ) ).toEqual( [ 0, 1, 2 ] );
	} );

	it( 'leaves a scale whose ticks are already whole to visx', () => {
		expect( getWholeNumberTickValues( linear( [ 0, 1000 ] ), 4 ) ).toBeUndefined();
	} );

	it( 'leaves non-numeric scales to visx', () => {
		const band = createScale( { type: 'band', domain: [ 'a', 'b' ], range: [ 0, 100 ] } );
		const time = createScale( {
			type: 'time',
			domain: [ new Date( 2024, 0, 1 ), new Date( 2024, 0, 2 ) ],
			range: [ 0, 100 ],
		} );
		expect( getWholeNumberTickValues( band, 4 ) ).toBeUndefined();
		expect( getWholeNumberTickValues( time, 4 ) ).toBeUndefined();
		expect( getWholeNumberTickValues( undefined, 4 ) ).toBeUndefined();
	} );

	it( 'leaves a range with no whole tick to visx', () => {
		expect( getWholeNumberTickValues( linear( [ 0.2, 0.8 ] ), 4 ) ).toBeUndefined();
	} );

	it( 'leaves a range with only one whole tick to visx', () => {
		expect( getWholeNumberTickValues( linear( [ 0, 0.8 ] ), 4 ) ).toBeUndefined();
	} );
} );

describe( 'hasOnlyWholeNumbers', () => {
	it( 'is true when every reading is whole, skipping missing ones', () => {
		expect( hasOnlyWholeNumbers( [ series( 0, 1, null, 3 ) ] ) ).toBe( true );
	} );

	it( 'is false when any reading has a fraction', () => {
		expect( hasOnlyWholeNumbers( [ series( 0, 1 ), series( 0.5 ) ] ) ).toBe( false );
	} );

	it( 'is false when there is no reading at all', () => {
		expect( hasOnlyWholeNumbers( [ series( null, null ) ] ) ).toBe( false );
		expect( hasOnlyWholeNumbers( [] ) ).toBe( false );
	} );
} );
