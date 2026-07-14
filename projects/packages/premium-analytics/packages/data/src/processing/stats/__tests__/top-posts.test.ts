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

	it( 'preserves the homepage row id and title when archives are skipped', () => {
		const result = sanitizeStatsTopPostsResponse(
			{
				days: {
					'2026-06-16': {
						postviews: [
							{
								id: 0,
								href: null,
								date: null,
								title: 'Homepage (Latest posts)',
								type: 'homepage',
								views: 12,
							},
						],
					},
				},
			},
			{
				period: 'day',
				end_date: '2026-06-16',
				skip_archives: 1,
			}
		);

		expect( result.data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				id: 0,
				label: 'Homepage (Latest posts)',
				link: null,
				page: null,
				type: 'homepage',
			} )
		);
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
	it( 'keeps URL-less rows and matches them by label', () => {
		// With skip_archives=1 the API returns the homepage-as-latest-posts
		// entry without a link; it must survive the merge and match across
		// periods by its label.
		const homepage: StatsTopPostsItem = {
			id: 0,
			label: 'Homepage (Latest posts)',
			views: 12,
			link: null,
			children: null,
		};
		const post: StatsTopPostsItem = {
			id: 1,
			label: 'Hello',
			views: 5,
			link: 'https://example.com/hello/',
			children: null,
		};

		const { rows, hasComparison } = mergeStatsTopPostsComparisonRows(
			makeReport( [ post, homepage ] ),
			makeReport( [ { ...homepage, views: 8 } ] )
		);

		expect( hasComparison ).toBe( true );
		expect( rows ).toEqual( [
			expect.objectContaining( { label: 'Homepage (Latest posts)', previousViews: 8 } ),
			expect.objectContaining( { label: 'Hello', previousViews: undefined } ),
		] );
	} );

	it( 'ranks rows before applying the visible max', () => {
		// The API caps postviews at max but appends the homepage entry on top,
		// so the visible cap must re-rank first.
		const rows = [
			{ id: 1, label: 'A', views: 5, link: 'https://example.com/a/', children: null },
			{ id: 2, label: 'B', views: 3, link: 'https://example.com/b/', children: null },
			{ id: 0, label: 'Homepage (Latest posts)', views: 9, link: null, children: null },
		];

		const { rows: visible } = mergeStatsTopPostsComparisonRows( makeReport( rows ), undefined, {
			maxRows: 2,
		} );

		expect( visible.map( row => row.label ) ).toEqual( [ 'Homepage (Latest posts)', 'A' ] );
	} );
} );
