import { mergeStatsTopPostsComparisonRows, sanitizeStatsTopPostsResponse } from '..';
import { topPostsFixture, topPostsSummaryFixture } from '../__fixtures__/top-posts';
import type { StatsNormalizedReport, StatsTopPostsItem } from '..';

function makeReport( items: StatsTopPostsItem[] ): StatsNormalizedReport< StatsTopPostsItem > {
	return {
		summary: {},
		data: [
			{
				time_interval: '2026-06-25',
				date_start: '2026-06-25T00:00:00+00:00',
				date_end: '2026-06-25T23:59:59+00:00',
				items,
			},
		],
	};
}

describe( 'Stats top posts normalizer', () => {
	it( 'normalizes summarized top posts into range data', () => {
		const result = sanitizeStatsTopPostsResponse( topPostsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result ).toEqual( {
			summary: {
				total_views: 0,
				dropped_ids: [],
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
			},
			data: [
				{
					time_interval: '2026-06-22',
					date_start: '2026-06-16T00:00:00+00:00',
					date_end: '2026-06-22T23:59:59+00:00',
					items: [
						expect.objectContaining( {
							id: 265143,
							label: 'Homepage',
							views: 4157,
							link: 'https://example.com/home-2/',
							public: true,
							type: 'page',
							status: 'publish',
							video_play: false,
							children: null,
						} ),
						expect.objectContaining( {
							id: 0,
							label: 'Home page / Archives',
							views: 1378,
							link: 'https://example.com/',
							type: 'homepage',
							status: null,
							public: false,
							video_play: false,
						} ),
					],
				},
			],
		} );
	} );

	it( 'normalizes top posts into by-date data points', () => {
		const result = sanitizeStatsTopPostsResponse( topPostsFixture, {
			period: 'day',
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( {} );
		expect( result.data ).toEqual( [
			{
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						id: 41,
						label: 'Hello world',
						views: 64,
						children: null,
						link: 'https://example.com/hello/',
					} ),
				],
			},
		] );
	} );

	it( 'keeps all by-date buckets when the query has a range end date', () => {
		const result = sanitizeStatsTopPostsResponse( topPostsFixture, {
			period: 'day',
			start_date: '2026-06-15',
			end_date: '2026-06-16',
		} );

		expect( result.data ).toHaveLength( 2 );
		expect( result.data.map( item => item.time_interval ) ).toEqual( [
			'2026-06-15',
			'2026-06-16',
		] );
	} );

	it( 'limits by-date buckets to the requested date range', () => {
		const result = sanitizeStatsTopPostsResponse(
			{
				...topPostsFixture,
				days: {
					'2026-06-14': topPostsFixture.days[ '2026-06-15' ],
					...topPostsFixture.days,
					'2026-06-17': topPostsFixture.days[ '2026-06-16' ],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-15',
				end_date: '2026-06-16',
			}
		);

		expect( result.data.map( item => item.time_interval ) ).toEqual( [
			'2026-06-15',
			'2026-06-16',
		] );
	} );

	it( 'detects comparison overlap after applying visible max and post type filters', () => {
		const primary = makeReport( [
			{
				label: 'Homepage',
				views: 10,
				link: 'https://example.com/home/',
				type: 'page',
				children: null,
			},
			{
				label: 'Post',
				views: 8,
				link: 'https://example.com/post/',
				type: 'post',
				children: null,
			},
		] );
		const comparison = makeReport( [
			{
				label: 'Post',
				views: 0,
				link: 'https://example.com/post/',
				type: 'post',
				children: null,
			},
		] );

		expect( mergeStatsTopPostsComparisonRows( primary, comparison, { maxRows: 1 } ) ).toEqual( {
			hasComparison: false,
			rows: [
				expect.objectContaining( {
					label: 'Homepage',
					previousViews: undefined,
				} ),
			],
		} );

		expect(
			mergeStatsTopPostsComparisonRows( primary, comparison, { maxRows: 1, postTypes: [ 'post' ] } )
		).toEqual( {
			hasComparison: true,
			rows: [
				expect.objectContaining( {
					label: 'Post',
					previousViews: 0,
				} ),
			],
		} );
	} );
} );
