import { getValueScaleDomain } from '../value-domain';
import type { DataPointDate, SeriesData } from '../../../../types';

const series = (
	values: Array< number | null >,
	options?: SeriesData[ 'options' ]
): SeriesData => ( {
	label: 'Series',
	data: values.map( ( value, index ) => ( {
		date: new Date( 2026, index, 1 ),
		value,
	} ) ),
	options,
} );

describe( 'getValueScaleDomain', () => {
	test( 'leaves a varying series to visx', () => {
		expect( getValueScaleDomain( [ series( [ 10, 20, 30 ] ) ], false ) ).toBeNull();
	} );

	test( 'anchors a flat series at zero so its bars have height', () => {
		expect( getValueScaleDomain( [ series( [ 500, 500, 500 ] ) ], false ) ).toEqual( [ 0, 500 ] );
	} );

	test( 'anchors a single-bucket window at zero', () => {
		expect( getValueScaleDomain( [ series( [ 42 ] ) ], false ) ).toEqual( [ 0, 42 ] );
	} );

	test( 'spans zero for a flat negative series', () => {
		expect( getValueScaleDomain( [ series( [ -5, -5 ] ) ], false ) ).toEqual( [ -5, 0 ] );
	} );

	test( 'falls back to a unit domain when every value is zero', () => {
		expect( getValueScaleDomain( [ series( [ 0, 0 ] ) ], false ) ).toEqual( [ 0, 1 ] );
	} );

	test( 'falls back to a unit domain when no bucket has a reading', () => {
		expect( getValueScaleDomain( [ series( [ null, null ] ) ], false ) ).toEqual( [ 0, 1 ] );
	} );

	test( 'ignores buckets with no reading when fitting a varying series', () => {
		expect( getValueScaleDomain( [ series( [ null, 10, 20 ] ) ], false ) ).toBeNull();
	} );

	test( 'keeps zero in the domain across every series in comparison mode', () => {
		const data = [ series( [ 10, 20 ] ), series( [ 5, 40 ], { type: 'comparison' } ) ];
		expect( getValueScaleDomain( data, true ) ).toEqual( [ 0, 40 ] );
	} );

	test( 'reads visualValue in preference to value', () => {
		const data: SeriesData[] = [
			{
				label: 'Series',
				data: [ { date: new Date( 2026, 0, 1 ), value: 0, visualValue: 2 } as DataPointDate ],
			},
		];
		expect( getValueScaleDomain( data, false ) ).toEqual( [ 0, 2 ] );
	} );
} );
