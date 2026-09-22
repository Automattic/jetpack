import { getValueScaleDomain } from '../value-domain';
import type { DataPointDate, SeriesData } from '../../../../types';

const series = (
	values: Array< number | null >,
	options?: SeriesData[ 'options' ],
	label = 'Series'
): SeriesData => ( {
	label,
	data: values.map( ( value, index ) => ( {
		date: new Date( 2026, index, 1 ),
		value,
	} ) ),
	options,
} );

const allRendered = () => true;

describe( 'getValueScaleDomain', () => {
	test( 'anchors a varying series at zero', () => {
		expect( getValueScaleDomain( [ series( [ 10, 20, 30 ] ) ], true, allRendered ) ).toEqual( [
			0, 30,
		] );
	} );

	test( 'spans zero for a varying negative series', () => {
		expect( getValueScaleDomain( [ series( [ -10, -20 ] ) ], true, allRendered ) ).toEqual( [
			-20, 0,
		] );
	} );

	test( 'leaves a varying series to visx when zero is opted out', () => {
		expect( getValueScaleDomain( [ series( [ 10, 20, 30 ] ) ], false, allRendered ) ).toBeNull();
	} );

	test( 'anchors a flat series at zero so its bars have height', () => {
		expect( getValueScaleDomain( [ series( [ 500, 500, 500 ] ) ], false, allRendered ) ).toEqual( [
			0, 500,
		] );
	} );

	test( 'anchors a single-bucket window at zero', () => {
		expect( getValueScaleDomain( [ series( [ 42 ] ) ], false, allRendered ) ).toEqual( [ 0, 42 ] );
	} );

	test( 'spans zero for a flat negative series', () => {
		expect( getValueScaleDomain( [ series( [ -5, -5 ] ) ], false, allRendered ) ).toEqual( [
			-5, 0,
		] );
	} );

	test( 'falls back to a unit domain when every value is zero', () => {
		expect( getValueScaleDomain( [ series( [ 0, 0 ] ) ], false, allRendered ) ).toEqual( [ 0, 1 ] );
	} );

	test( 'falls back to a unit domain when every value is zero in comparison mode', () => {
		const data = [ series( [ 0, 0 ] ), series( [ 0, 0 ], { type: 'comparison' } ) ];
		expect( getValueScaleDomain( data, true, allRendered ) ).toEqual( [ 0, 1 ] );
	} );

	test( 'falls back to a unit domain when no bucket has a reading', () => {
		expect( getValueScaleDomain( [ series( [ null, null ] ) ], false, allRendered ) ).toEqual( [
			0, 1,
		] );
	} );

	test( 'ignores buckets with no reading when fitting a varying series', () => {
		expect( getValueScaleDomain( [ series( [ null, 10, 20 ] ) ], false, allRendered ) ).toBeNull();
	} );

	test( 'keeps zero in the domain across every series in comparison mode', () => {
		const data = [ series( [ 10, 20 ] ), series( [ 5, 40 ], { type: 'comparison' } ) ];
		expect( getValueScaleDomain( data, true, allRendered ) ).toEqual( [ 0, 40 ] );
	} );

	test( 'anchors a flat series at zero when the varying series beside it is hidden', () => {
		const data = [
			series( [ 500, 500 ], undefined, 'Flat' ),
			series( [ 10, 900 ], undefined, 'Varying' ),
		];
		const isSeriesRendered = ( s: SeriesData ) => s.label !== 'Varying';
		expect( getValueScaleDomain( data, false, isSeriesRendered ) ).toEqual( [ 0, 500 ] );
	} );

	test( 'reads visualValue in preference to value', () => {
		const data: SeriesData[] = [
			{
				label: 'Series',
				data: [ { date: new Date( 2026, 0, 1 ), value: 0, visualValue: 2 } as DataPointDate ],
			},
		];
		expect( getValueScaleDomain( data, false, allRendered ) ).toEqual( [ 0, 2 ] );
	} );
} );
