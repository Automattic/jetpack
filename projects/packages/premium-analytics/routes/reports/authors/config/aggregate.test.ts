import { aggregateAuthorRows, authorsToTimeSeries, getChartBucketKey } from './aggregate';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from '@jetpack-premium-analytics/data';

const report: StatsNormalizedReport< StatsTopAuthorsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-06-01',
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-01T23:59:59+00:00',
			items: [
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 10,
					icon: 'https://example.com/ada.png',
					children: [
						{
							id: 1,
							label: 'Analytical Engine',
							views: 10,
							link: 'https://example.com/analytical-engine/',
						},
					],
				},
				{
					label: 'Guest Author',
					views: 3,
					icon: null,
				},
			],
		},
		{
			time_interval: '2026-06-02',
			date_start: '2026-06-02T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
			items: [
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 12,
					icon: 'https://example.com/ada.png',
				},
				{
					label: 'Guest Author',
					views: 5,
					icon: null,
				},
			],
		},
	],
};

describe( 'report authors aggregate', () => {
	it( 'builds the chart series by summing every author in each bucket', () => {
		const series = authorsToTimeSeries( report );

		expect( series.summary ).toEqual( {
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.time_interval ) ).toEqual( [
			'2026-06-01',
			'2026-06-02',
		] );
		expect( series.data.map( point => point.views ) ).toEqual( [ 13, 17 ] );
	} );

	it.each( [ 'week', 'month' ] as const )( 'groups daily totals by %s for the chart', period => {
		const series = authorsToTimeSeries( report, period );
		const bucketKey = getChartBucketKey( report.data[ 0 ].time_interval, period );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: bucketKey,
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-02T23:59:59+00:00',
				views: 30,
			} ),
		] );
	} );

	it( 'aggregates one row per author and omits nested posts', () => {
		expect( aggregateAuthorRows( report ) ).toEqual( [
			{
				id: 'id:42',
				name: 'Ada Lovelace',
				avatarUrl: 'https://example.com/ada.png',
				views: 22,
			},
			{
				id: 'label:Guest Author|',
				name: 'Guest Author',
				avatarUrl: null,
				views: 8,
			},
		] );
	} );

	it( 'returns empty chart and table data before the report loads', () => {
		expect( authorsToTimeSeries( undefined ) ).toEqual( { summary: {}, data: [] } );
		expect( aggregateAuthorRows( undefined ) ).toEqual( [] );
	} );
} );
