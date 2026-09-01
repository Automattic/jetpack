import { getBucketInfo } from '../time-axis';
import type { SeriesData } from '../../../types';

const at = ( hoursFromStart: number ) =>
	new Date( Date.UTC( 2026, 7, 1 ) + hoursFromStart * 60 * 60 * 1000 );

const seriesOf = ( offsetsInHours: number[] ): SeriesData[] => [
	{
		label: 'views',
		data: offsetsInHours.map( ( offset, index ) => ( { date: at( offset ), value: index } ) ),
	},
];

const seriesSpacedHours = ( hours: number, count: number ): SeriesData[] =>
	seriesOf( Array.from( { length: count }, ( _, index ) => index * hours ) );

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

	it( 'reads the same bucket whatever order the points arrive in', () => {
		const offsets = [ 0, 24, 48 ];
		const shuffled = [ 0, 48, 24 ];

		expect( getBucketInfo( seriesOf( shuffled ) ) ).toEqual( getBucketInfo( seriesOf( offsets ) ) );
		expect( getBucketInfo( seriesOf( shuffled ) ).bucket ).toBe( 'day' );
	} );

	it( 'ignores a repeated instant, which pads a series rather than dating it', () => {
		// A shorter comparison series can repeat its last date to match length.
		expect( getBucketInfo( seriesOf( [ 0, 24, 48, 48 ] ) ).bucket ).toBe( 'day' );
	} );
} );
