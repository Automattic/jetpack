import { getBucketInfo, getBucketResolution } from '../bucket-info';
import type { SeriesData } from '../../types';

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

const hourlyDates = ( start: Date, hours: number ): Date[] =>
	Array.from( { length: hours }, ( _, i ) => new Date( start.getTime() + i * 60 * 60 * 1000 ) );

const dailyDates = ( start: Date, days: number ): Date[] =>
	Array.from( { length: days }, ( _, i ) => new Date( start.getTime() + i * 24 * 60 * 60 * 1000 ) );

const toSeries = ( dates: Date[] ): SeriesData[] => [
	{
		label: 'series',
		data: dates.map( date => ( { date, value: 1 } ) ),
	},
];

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

describe( 'getBucketResolution', () => {
	it( 'infers hourly buckets from sub-daily spacing', () => {
		expect(
			getBucketResolution( toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 6 ) ) )
		).toBe( 'hour' );
	} );

	it( 'infers daily buckets from daily spacing', () => {
		expect(
			getBucketResolution( toSeries( dailyDates( new Date( '2026-08-01T00:00:00' ), 5 ) ) )
		).toBe( 'day' );
	} );

	it( 'infers daily buckets from weekly spacing, which labels the same way', () => {
		const weeklyDates = Array.from(
			{ length: 5 },
			( _, i ) => new Date( Date.UTC( 2026, 0, 5 + i * 7 ) )
		);

		expect( getBucketResolution( toSeries( weeklyDates ) ) ).toBe( 'day' );
	} );

	it( 'infers monthly buckets from a shortest-month gap', () => {
		expect(
			getBucketResolution(
				toSeries( [ new Date( '2026-02-01T00:00:00' ), new Date( '2026-03-01T00:00:00' ) ] )
			)
		).toBe( 'month' );
	} );

	it( 'infers yearly buckets from a yearly gap', () => {
		expect(
			getBucketResolution(
				toSeries( [ new Date( '2025-06-01T00:00:00' ), new Date( '2026-06-01T00:00:00' ) ] )
			)
		).toBe( 'year' );
	} );

	it( 'keeps a daily gap across spring-forward out of the hourly bucket', () => {
		const start = new Date( '2026-03-08T00:00:00' );
		const dstDates = [ 0, 23, 47 ].map(
			offsetHours => new Date( start.getTime() + offsetHours * 60 * 60 * 1000 )
		);

		expect( getBucketResolution( toSeries( dstDates ) ) ).toBe( 'day' );
	} );

	it( 'reports daily buckets when no series has two points', () => {
		// Unmeasurable spacing reads as Infinity, which must not be mistaken for a
		// very coarse bucket.
		expect( getBucketResolution( toSeries( [ new Date( '2026-08-02T00:00:00' ) ] ) ) ).toBe(
			'day'
		);
	} );

	it( 'reports a declared resolution over the measured spacing', () => {
		const hourly = toSeries( hourlyDates( new Date( '2026-08-02T00:00:00' ), 6 ) );

		expect( getBucketResolution( hourly, 'month' ) ).toBe( 'month' );
	} );

	it( 'reports a declared weekly resolution as daily', () => {
		// Weeks and days are both calendar-date buckets as far as labelling goes,
		// and 'week' is not a label format of its own.
		expect( getBucketResolution( toSeries( [] ), 'week' ) ).toBe( 'day' );
	} );
} );
