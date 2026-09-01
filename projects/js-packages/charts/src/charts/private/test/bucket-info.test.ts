import { getBucketInfo } from '../time-axis';
import type { useChartDataTransform } from '../../../hooks';

type SortedData = ReturnType< typeof useChartDataTransform >;

const seriesSpacedHours = ( hours: number, count: number ): SortedData =>
	[
		{
			label: 'views',
			data: Array.from( { length: count }, ( _, index ) => ( {
				date: new Date( Date.UTC( 2026, 7, 1 ) + index * hours * 60 * 60 * 1000 ),
				value: index,
			} ) ),
		},
	] as unknown as SortedData;

describe( 'getBucketInfo', () => {
	it( 'preserves a declared week in bucket and collapses it for display', () => {
		const data = seriesSpacedHours( 24 * 7, 6 );

		expect( getBucketInfo( data, 'week' ) ).toEqual( {
			bucket: 'week',
			displayResolution: 'day',
		} );
	} );

	it( 'passes a declared resolution through unchanged otherwise', () => {
		const data = seriesSpacedHours( 1, 6 );

		expect( getBucketInfo( data, 'hour' ) ).toEqual( {
			bucket: 'hour',
			displayResolution: 'hour',
		} );
	} );

	it( 'infers from spacing when nothing is declared', () => {
		expect( getBucketInfo( seriesSpacedHours( 1, 6 ) ) ).toEqual( {
			bucket: 'hour',
			displayResolution: 'hour',
		} );
		expect( getBucketInfo( seriesSpacedHours( 24, 6 ) ) ).toEqual( {
			bucket: 'day',
			displayResolution: 'day',
		} );
	} );

	it( 'never infers week, only reports it when declared', () => {
		expect( getBucketInfo( seriesSpacedHours( 24 * 7, 6 ) ).bucket ).toBe( 'day' );
	} );
} );
