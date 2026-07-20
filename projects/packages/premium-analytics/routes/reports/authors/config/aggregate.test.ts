import { aggregateAuthorRows, authorsToTimeSeries } from './aggregate';
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
					label: 'Guest Author',
					views: 3,
					icon: null,
				},
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 10,
					icon: 'https://example.com/ada.png',
					children: [
						{
							id: 1,
							label: 'Analytical Engine',
							views: 6,
							link: 'https://example.com/analytical-engine/',
						},
						{
							id: 2,
							label: 'Notes on computation',
							views: 4,
							link: 'https://example.com/notes/',
						},
					],
				},
			],
		},
		{
			time_interval: '2026-06-02',
			date_start: '2026-06-02T00:00:00+00:00',
			date_end: '2026-06-02T23:59:59+00:00',
			items: [
				{
					label: 'Guest Author',
					views: 5,
					icon: null,
				},
				{
					id: 42,
					label: 'Ada Lovelace',
					views: 12,
					icon: 'https://example.com/ada.png',
					children: [
						{
							id: 1,
							label: 'Analytical Engine',
							views: 5,
							link: 'https://example.com/analytical-engine/',
						},
						{
							id: 3,
							label: 'Early compiler ideas',
							views: 7,
							link: 'https://example.com/compiler/',
						},
					],
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

	it.each( [
		[ 'week', '2026-06-01' ],
		[ 'month', '2026-06-01' ],
	] as const )( 'groups daily totals by %s for the chart', ( period, bucketKey ) => {
		const series = authorsToTimeSeries( report, period );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: bucketKey,
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-02T23:59:59+00:00',
				views: 30,
			} ),
		] );
	} );

	it( 'aggregates authors and nests their posts in descending views order', () => {
		expect( aggregateAuthorRows( report ) ).toEqual( [
			{
				id: 'id:42',
				label: 'Ada Lovelace',
				avatarUrl: 'https://example.com/ada.png',
				isGroup: true,
				views: 22,
			},
			{
				id: 'id:42|post:id:1',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Analytical Engine',
				avatarUrl: null,
				postId: '1',
				views: 11,
			},
			{
				id: 'id:42|post:id:3',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Early compiler ideas',
				avatarUrl: null,
				postId: '3',
				views: 7,
			},
			{
				id: 'id:42|post:id:2',
				parentId: 'id:42',
				parentName: 'Ada Lovelace',
				label: 'Notes on computation',
				avatarUrl: null,
				postId: '2',
				views: 4,
			},
			{
				id: 'label:Guest Author|',
				label: 'Guest Author',
				avatarUrl: null,
				isGroup: true,
				views: 8,
			},
		] );
	} );

	it( 'returns empty chart and table data before the report loads', () => {
		expect( authorsToTimeSeries( undefined ) ).toEqual( { summary: {}, data: [] } );
		expect( aggregateAuthorRows( undefined ) ).toEqual( [] );
	} );
} );
