import { getBucketedValue, getValueBuckets } from '../private/heatmap-buckets';
import { getExtentOf, getValueExtent, scaleValues } from '../private/use-heatmap-colors';
import type { HeatmapColumn } from '../types';

const bucketsOf = ( values: number[], steps: number ) =>
	getValueBuckets( values, getExtentOf( values ), steps );

describe( 'getValueBuckets', () => {
	test( 'splits twenty-four distinct values into five even buckets', () => {
		const values = Array.from( { length: 24 }, ( _v, index ) => ( index + 1 ) * 10 );
		const buckets = bucketsOf( values, 5 );

		expect( buckets ).toEqual( { thresholds: [ 50, 100, 150, 200 ], steps: 5 } );
		expect( values.map( value => getBucketedValue( value, buckets ) ) ).toEqual( [
			0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 0.75,
			0.75, 1, 1, 1, 1, 1,
		] );
	} );

	test( 'paints the same values on two steps when asked for two', () => {
		const values = Array.from( { length: 24 }, ( _v, index ) => ( index + 1 ) * 10 );
		const buckets = bucketsOf( values, 2 );

		expect( buckets ).toEqual( { thresholds: [ 130 ], steps: 2 } );
		expect( new Set( values.map( value => getBucketedValue( value, buckets ) ) ) ).toEqual(
			new Set( [ 0, 1 ] )
		);
		expect( getBucketedValue( 120, buckets ) ).toBe( 0 );
		expect( getBucketedValue( 130, buckets ) ).toBe( 1 );
	} );

	test( 'keeps the smallest value lightest when ties collapse the quantiles', () => {
		const buckets = bucketsOf( [ ...Array( 10 ).fill( 1 ), 5, 9 ], 5 );

		expect( buckets ).toEqual( { thresholds: [ 5, 9 ], steps: 5 } );
		expect( getBucketedValue( 1, buckets ) ).toBe( 0 );
		expect( getBucketedValue( 5, buckets ) ).toBe( 0.5 );
		expect( getBucketedValue( 9, buckets ) ).toBe( 1 );
	} );

	test( 'keeps the values above a dominant tie on steps of their own', () => {
		const buckets = bucketsOf( [ ...Array( 10 ).fill( 1 ), 2, 3, 4, 5 ], 5 );

		expect( buckets ).toEqual( { thresholds: [ 2, 3, 4, 5 ], steps: 5 } );
		expect( [ 1, 2, 3, 4, 5 ].map( value => getBucketedValue( value, buckets ) ) ).toEqual( [
			0, 0.25, 0.5, 0.75, 1,
		] );
	} );

	test( 'gives each distinct value its own step when there are fewer than the steps', () => {
		const buckets = bucketsOf( [ 5, 5, 10, 10, 20, 20 ], 5 );

		expect( buckets ).toEqual( { thresholds: [ 10, 20 ], steps: 5 } );
	} );

	test( 'skips the unused swatches when three thresholds share a five-step legend', () => {
		const buckets = bucketsOf( [ 1, 2, 3, 4 ], 5 );

		expect( buckets ).toEqual( { thresholds: [ 2, 3, 4 ], steps: 5 } );
		expect( [ 1, 2, 3, 4 ].map( value => getBucketedValue( value, buckets ) ) ).toEqual( [
			0, 0.25, 0.75, 1,
		] );
	} );

	test( 'paints a single distinct value as the darkest step', () => {
		const buckets = bucketsOf( [ 7, 7, 7 ], 5 );

		expect( buckets ).toEqual( { thresholds: [], steps: 5 } );
		expect( getBucketedValue( 7, buckets ) ).toBe( 1 );
	} );

	test( 'buckets a zero when the series has negatives', () => {
		const buckets = bucketsOf( [ -4, 0, 6 ], 5 );

		expect( getBucketedValue( -4, buckets ) ).toBe( 0 );
		expect( getBucketedValue( 0, buckets ) ).toBe( 0.5 );
		expect( getBucketedValue( 6, buckets ) ).toBe( 1 );
	} );

	test( 'scales a series that is entirely negative', () => {
		const buckets = bucketsOf( [ -10, -5, -1 ], 5 );

		expect( buckets ).toEqual( { thresholds: [ -5, -1 ], steps: 5 } );
		expect( getBucketedValue( -10, buckets ) ).toBe( 0 );
		expect( getBucketedValue( -5, buckets ) ).toBe( 0.5 );
		expect( getBucketedValue( -1, buckets ) ).toBe( 1 );
	} );

	test( 'leaves the empty-cell zeros out of the thresholds', () => {
		expect( bucketsOf( [ 0, 0, 10, 20 ], 5 ).thresholds ).toEqual( [ 20 ] );
	} );

	test( 'leaves summary columns and partial cells out of the thresholds', () => {
		const data: HeatmapColumn[] = [
			{ data: [ { value: 10 }, { value: 20 } ] },
			{ data: [ { value: 999_999, partial: true } ] },
			{ summary: true, data: [ { value: 500_000 } ] },
		];

		expect( getValueBuckets( scaleValues( data ), getValueExtent( data ), 5 ).thresholds ).toEqual(
			[ 20 ]
		);
	} );

	test( 'returns no thresholds for an all-empty series', () => {
		expect( bucketsOf( [], 5 ) ).toEqual( { thresholds: [], steps: 5 } );
	} );
} );
