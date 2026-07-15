import { bucketStatsTimeSeries, getStatsChartBucketKey } from '..';
import type { StatsNormalizedReport, StatsTopPostsItem } from '..';

function createPoint( date: string, views: number ) {
	return {
		time_interval: date,
		date_start: `${ date }T00:00:00+00:00`,
		date_end: `${ date }T23:59:59+00:00`,
		items: [
			{
				id: 1,
				label: 'Post',
				views,
				link: 'https://example.com/post/',
				type: 'post',
			},
		],
	};
}

function getViews( point: StatsNormalizedReport< StatsTopPostsItem >[ 'data' ][ number ] ) {
	const views = point.items.reduce( ( total, item ) => total + item.views, 0 );

	return { value: views, views };
}

describe( 'Stats chart buckets', () => {
	it( 'uses daily dates as identity keys', () => {
		expect( getStatsChartBucketKey( '2026-07-09', 'day' ) ).toBe( '2026-07-09' );
	} );

	it( 'groups daily points by ISO week and sums their metrics', () => {
		const report: StatsNormalizedReport< StatsTopPostsItem > = {
			summary: {
				date_start: '2000-01-01T00:00:00+00:00',
				date_end: '2000-01-01T23:59:59+00:00',
				views: 18,
			},
			data: [
				createPoint( '2026-07-09', 7 ),
				createPoint( '2026-07-10', 6 ),
				createPoint( '2026-07-13', 5 ),
			],
		};

		expect( getStatsChartBucketKey( '2026-07-09', 'week' ) ).toBe( '2026-07-06' );
		expect( getStatsChartBucketKey( '2026-07-10', 'week' ) ).toBe( '2026-07-06' );
		expect( bucketStatsTimeSeries( report, 'week', getViews ) ).toEqual( {
			summary: {
				date_start: '2026-07-09T00:00:00+00:00',
				date_end: '2026-07-13T23:59:59+00:00',
				views: 18,
			},
			data: [
				{
					time_interval: '2026-07-06',
					date_start: '2026-07-09T00:00:00+00:00',
					date_end: '2026-07-10T23:59:59+00:00',
					label: '2026-07-06',
					items: [],
					value: 13,
					views: 13,
				},
				{
					time_interval: '2026-07-13',
					date_start: '2026-07-13T00:00:00+00:00',
					date_end: '2026-07-13T23:59:59+00:00',
					label: '2026-07-13',
					items: [],
					value: 5,
					views: 5,
				},
			],
		} );
	} );

	it( 'uses full first-of-month dates across a month boundary', () => {
		const report: StatsNormalizedReport< StatsTopPostsItem > = {
			summary: {},
			data: [ createPoint( '2026-06-30', 4 ), createPoint( '2026-07-01', 8 ) ],
		};

		expect( getStatsChartBucketKey( '2026-06-30', 'month' ) ).toBe( '2026-06-01' );
		expect( getStatsChartBucketKey( '2026-07-01', 'month' ) ).toBe( '2026-07-01' );
		expect(
			bucketStatsTimeSeries( report, 'month', getViews ).data.map( point => point.time_interval )
		).toEqual( [ '2026-06-01', '2026-07-01' ] );
	} );

	it( 'returns empty data while passing through an empty report summary', () => {
		const report: StatsNormalizedReport< StatsTopPostsItem > = {
			summary: { views: 0 },
			data: [],
		};

		expect( bucketStatsTimeSeries( report, 'day', getViews ) ).toEqual( {
			summary: { views: 0 },
			data: [],
		} );
		expect( bucketStatsTimeSeries( undefined, 'day', getViews ) ).toEqual( {
			summary: {},
			data: [],
		} );
	} );
} );
