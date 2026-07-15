import { aggregateArchiveRows, aggregatePostRows, postsToTimeSeries } from './aggregate';
import type {
	StatsArchivesItem,
	StatsNormalizedReport,
	StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';

describe( 'report posts aggregate', () => {
	it( 'includes the homepage row in chart and table aggregations', () => {
		const report: StatsNormalizedReport< StatsTopPostsItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-W23',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-07T23:59:59+00:00',
					items: [
						{
							id: 1,
							label: 'Post A',
							views: 10,
							link: 'https://example.com/post-a/',
							type: 'post',
						},
						{
							id: 0,
							label: 'Homepage (Latest posts)',
							views: 5,
							link: null,
							type: 'homepage',
						},
					],
				},
				{
					time_interval: '2026-W24',
					date_start: '2026-06-08T00:00:00+00:00',
					date_end: '2026-06-14T23:59:59+00:00',
					items: [
						{
							id: 1,
							label: 'Post A',
							views: 12,
							link: 'https://example.com/post-a/',
							type: 'post',
						},
						{
							id: 0,
							label: 'Homepage (Latest posts)',
							views: 7,
							link: null,
							type: 'homepage',
						},
					],
				},
			],
		};

		const series = postsToTimeSeries( report );

		expect( series.summary ).toEqual( {
			date_start: '2026-06-01T00:00:00+00:00',
			date_end: '2026-06-14T23:59:59+00:00',
		} );
		expect( series.data.map( point => point.time_interval ) ).toEqual( [ '2026-W23', '2026-W24' ] );
		expect( series.data.map( point => point.views ) ).toEqual( [ 15, 19 ] );
		expect( aggregatePostRows( report ) ).toEqual( [
			expect.objectContaining( {
				id: 1,
				label: 'Post A',
				views: 22,
			} ),
			expect.objectContaining( {
				id: 0,
				label: 'Homepage (Latest posts)',
				views: 12,
				link: null,
				type: 'homepage',
			} ),
		] );
	} );

	it( 'flattens archive table rows to leaf archive URL paths', () => {
		const report: StatsNormalizedReport< StatsArchivesItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-W23',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-07T23:59:59+00:00',
					items: [
						{
							label: 'tax',
							value: 8,
							children: [
								{
									label: 'category',
									value: 8,
									children: [
										{
											label: 'News',
											value: 8,
											link: 'https://example.com/category/news/',
											children: null,
										},
									],
								},
							],
						},
						{
							label: 'search',
							value: 3,
							children: [
								{
									label: 'analytics',
									value: 3,
									link: 'https://example.com/search?q=analytics',
									children: null,
								},
							],
						},
						{
							label: 'date',
							value: 2,
							children: [
								{
									label: '2025/03',
									value: 2,
									link: 'https://example.com/2025/03/',
									children: null,
								},
							],
						},
					],
				},
			],
		};

		const rows = aggregateArchiveRows( report );

		expect( rows.map( row => row.label ) ).toEqual( [
			'/category/news',
			'/search?q=analytics',
			'/2025/03',
		] );
		expect( rows.map( row => row.views ) ).toEqual( [ 8, 3, 2 ] );
	} );

	it( 'preserves a collapsed home archive link when aggregating buckets', () => {
		const report: StatsNormalizedReport< StatsArchivesItem > = {
			summary: {},
			data: [
				{
					time_interval: '2026-06-01',
					date_start: '2026-06-01T00:00:00+00:00',
					date_end: '2026-06-01T23:59:59+00:00',
					items: [
						{
							label: 'home',
							value: 3,
							link: 'https://example.com/',
							children: null,
						},
					],
				},
				{
					time_interval: '2026-06-02',
					date_start: '2026-06-02T00:00:00+00:00',
					date_end: '2026-06-02T23:59:59+00:00',
					items: [
						{
							label: 'home',
							value: 5,
							link: 'https://example.com/',
							children: null,
						},
					],
				},
			],
		};

		expect( aggregateArchiveRows( report ) ).toEqual( [
			{
				id: '/|https://example.com/',
				label: '/',
				views: 8,
				link: 'https://example.com/',
			},
		] );
	} );
} );
