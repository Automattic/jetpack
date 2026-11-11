import { getBucketedValue, getValueBuckets } from '../private/heatmap-buckets';
import type { HeatmapColumn } from '../types';

const columns = ( ...values: ( number | null )[] ): HeatmapColumn[] =>
	values.map( value => ( { data: [ { value } ] } ) );

describe( 'getValueBuckets', () => {
	test( 'splits twenty-four distinct values into five even buckets', () => {
		const values = Array.from( { length: 24 }, ( _v, index ) => ( index + 1 ) * 10 );
		const buckets = getValueBuckets( columns( ...values ), 5 );

		expect( buckets ).toEqual( { thresholds: [ 50, 100, 150, 200 ], divisor: 4 } );
		expect( values.map( value => getBucketedValue( value, buckets ) ) ).toEqual( [
			0, 0, 0, 0, 0.25, 0.25, 0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 0.75,
			0.75, 1, 1, 1, 1, 1,
		] );
	} );

	test( 'keeps the smallest value lightest when ties collapse the quantiles', () => {
		const buckets = getValueBuckets( columns( ...Array( 10 ).fill( 1 ), 5, 9 ), 5 );

		expect( buckets ).toEqual( { thresholds: [ 5, 9 ], divisor: 2 } );
		expect( getBucketedValue( 1, buckets ) ).toBe( 0 );
		expect( getBucketedValue( 5, buckets ) ).toBe( 0.5 );
		expect( getBucketedValue( 9, buckets ) ).toBe( 1 );
	} );

	test( 'gives each distinct value its own step when there are fewer than the steps', () => {
		const buckets = getValueBuckets( columns( 5, 5, 10, 10, 20, 20 ), 5 );

		expect( buckets ).toEqual( { thresholds: [ 10, 20 ], divisor: 2 } );
	} );

	test( 'paints a single distinct value as the darkest step', () => {
		const buckets = getValueBuckets( columns( 7, 7, 7 ), 5 );

		expect( buckets ).toEqual( { thresholds: [], divisor: 0 } );
		expect( getBucketedValue( 7, buckets ) ).toBe( 1 );
	} );

	test( 'buckets a zero when the series has negatives', () => {
		const buckets = getValueBuckets( columns( -4, 0, 6 ), 5 );

		expect( getBucketedValue( -4, buckets ) ).toBe( 0 );
		expect( getBucketedValue( 0, buckets ) ).toBe( 0.5 );
		expect( getBucketedValue( 6, buckets ) ).toBe( 1 );
	} );

	test( 'leaves the empty-cell zeros out of the thresholds', () => {
		expect( getValueBuckets( columns( 0, 0, 10, 20 ), 5 ).thresholds ).toEqual( [ 20 ] );
	} );

	test( 'leaves summary columns and partial cells out of the thresholds', () => {
		const data: HeatmapColumn[] = [
			{ data: [ { value: 10 }, { value: 20 } ] },
			{ data: [ { value: 999_999, partial: true } ] },
			{ summary: true, data: [ { value: 500_000 } ] },
		];

		expect( getValueBuckets( data, 5 ).thresholds ).toEqual( [ 20 ] );
	} );

	test( 'returns no thresholds for an all-empty series', () => {
		expect( getValueBuckets( columns( null, null ), 5 ) ).toEqual( {
			thresholds: [],
			divisor: 0,
		} );
	} );
} );
