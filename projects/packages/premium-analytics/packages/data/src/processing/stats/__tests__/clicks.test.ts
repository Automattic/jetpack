import { mergeStatsClicksComparisonRows, sanitizeStatsClicksResponse } from '..';
import { clicksFixture, clicksSummaryFixture } from '../__fixtures__/clicks';
import type { StatsClicksItem } from '../clicks';
import type { StatsNormalizedReport } from '../types';

describe( 'Stats clicks normalizer', () => {
	it( 'normalizes summarized clicks into range data', () => {
		const result = sanitizeStatsClicksResponse( clicksSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result.summary ).toEqual( {
			total_clicks: 1323,
			other_clicks: 0,
			date_start: '2026-06-16T00:00:00+00:00',
			date_end: '2026-06-22T23:59:59+00:00',
		} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				items: [
					expect.objectContaining( {
						label: 'wordpress.org',
						views: 413,
						link: null,
						icon: 'https://example.com/blavatar.png',
						children: [
							expect.objectContaining( {
								label: '/plugins/jetpack-search',
								views: 100,
								link: 'https://wordpress.org/plugins/jetpack-search',
							} ),
							expect.objectContaining( {
								label: '/plugins/jetpack-boost/',
								views: 32,
								link: 'https://wordpress.org/plugins/jetpack-boost/',
							} ),
						],
					} ),
				],
			} )
		);
	} );

	it( 'normalizes clicks into by-date data points', () => {
		const result = sanitizeStatsClicksResponse( clicksFixture, {
			end_date: '2026-06-16',
		} );

		expect( result.summary ).toEqual( {} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						label: 'wordpress.org',
						views: 12,
						children: [
							expect.objectContaining( {
								label: '/plugins/jetpack-search',
								views: 8,
							} ),
						],
					} ),
				],
			} )
		);
	} );

	it( 'uses fallback child label when click parent name is empty', () => {
		const result = sanitizeStatsClicksResponse(
			{
				date: '2026-06-22',
				days: {
					'2026-06-16': {
						clicks: [
							{
								name: '',
								views: 1,
								children: [
									{
										name: 'https://example.com/path',
										views: 1,
									},
								],
							},
						],
					},
				},
			},
			{
				end_date: '2026-06-16',
			}
		);

		expect( result.data[ 0 ].items[ 0 ].children?.[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: '/',
				views: 1,
			} )
		);
	} );

	it( 'removes only the first parent-name occurrence from child labels', () => {
		const result = sanitizeStatsClicksResponse(
			{
				date: '2026-06-22',
				days: {
					'2026-06-16': {
						clicks: [
							{
								name: 'example.com',
								views: 1,
								children: [
									{
										name: 'example.com/path/example.com',
										views: 1,
									},
								],
							},
						],
					},
				},
			},
			{
				end_date: '2026-06-16',
			}
		);

		expect( result.data[ 0 ].items[ 0 ].children?.[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: '/path/example.com',
				views: 1,
			} )
		);
	} );

	it( 'treats zero comparison values as overlapping click rows', () => {
		const primary = sanitizeStatsClicksResponse(
			{
				date: '2026-06-29',
				days: {},
				summary: {
					clicks: [
						{
							name: 'wordpress.org',
							views: 42,
							children: [
								{
									name: 'wordpress.org/plugins/jetpack-search',
									views: 42,
									url: 'https://wordpress.org/plugins/jetpack-search',
								},
							],
						},
					],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-29',
				end_date: '2026-06-29',
				summarize: true,
			}
		);
		const comparison = sanitizeStatsClicksResponse(
			{
				date: '2026-06-22',
				days: {},
				summary: {
					clicks: [
						{
							name: 'wordpress.org',
							views: 0,
							children: [
								{
									name: 'wordpress.org/plugins/jetpack-search',
									views: 0,
									url: 'https://wordpress.org/plugins/jetpack-search',
								},
							],
						},
					],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-22',
				end_date: '2026-06-22',
				summarize: true,
			}
		);

		expect( mergeStatsClicksComparisonRows( primary, comparison ) ).toEqual( {
			hasComparison: true,
			rows: [
				expect.objectContaining( {
					label: 'wordpress.org',
					views: 42,
					previousValue: 0,
					childrenHaveComparison: true,
					children: [
						expect.objectContaining( {
							label: '/plugins/jetpack-search',
							views: 42,
							previousValue: 0,
						} ),
					],
				} ),
			],
		} );
	} );

	it( 'matches a flat primary URL to the same URL inside a grouped comparison domain', () => {
		const primary = sanitizeStatsClicksResponse(
			{
				date: '2026-06-29',
				summary: {
					clicks: [
						{
							name: 'wordpress.org/plugins/jetpack-search',
							views: 42,
							url: 'https://wordpress.org/plugins/jetpack-search',
							children: null,
						},
					],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-29',
				end_date: '2026-06-29',
				summarize: true,
			}
		);
		const comparison = sanitizeStatsClicksResponse(
			{
				date: '2026-06-22',
				summary: {
					clicks: [
						{
							name: 'wordpress.org',
							views: 40,
							url: null,
							children: [
								{
									name: 'wordpress.org/plugins/jetpack-search',
									views: 28,
									url: 'https://wordpress.org/plugins/jetpack-search',
								},
								{
									name: 'wordpress.org/plugins/jetpack-boost',
									views: 12,
									url: 'https://wordpress.org/plugins/jetpack-boost',
								},
							],
						},
					],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-22',
				end_date: '2026-06-22',
				summarize: true,
			}
		);

		expect( mergeStatsClicksComparisonRows( primary, comparison ) ).toEqual( {
			hasComparison: true,
			rows: [
				expect.objectContaining( {
					link: 'https://wordpress.org/plugins/jetpack-search',
					views: 42,
					previousValue: 28,
					children: null,
				} ),
			],
		} );
	} );

	it( 'matches grouped primary totals and nested URLs to a flat comparison row', () => {
		const primary = sanitizeStatsClicksResponse(
			{
				date: '2026-06-29',
				summary: {
					clicks: [
						{
							name: 'wordpress.org',
							views: 42,
							url: null,
							children: [
								{
									name: 'wordpress.org/plugins/jetpack-search',
									views: 30,
									url: 'https://wordpress.org/plugins/jetpack-search',
								},
								{
									name: 'wordpress.org/plugins/jetpack-boost',
									views: 12,
									url: 'https://wordpress.org/plugins/jetpack-boost',
								},
							],
						},
					],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-29',
				end_date: '2026-06-29',
				summarize: true,
			}
		);
		const comparison = sanitizeStatsClicksResponse(
			{
				date: '2026-06-22',
				summary: {
					clicks: [
						{
							name: 'wordpress.org/plugins/jetpack-search',
							views: 28,
							url: 'https://wordpress.org/plugins/jetpack-search',
							children: null,
						},
					],
				},
			},
			{
				period: 'day',
				start_date: '2026-06-22',
				end_date: '2026-06-22',
				summarize: true,
			}
		);

		expect( mergeStatsClicksComparisonRows( primary, comparison ) ).toEqual( {
			hasComparison: true,
			rows: [
				expect.objectContaining( {
					label: 'wordpress.org',
					views: 42,
					previousValue: 28,
					childrenHaveComparison: true,
					children: [
						expect.objectContaining( {
							link: 'https://wordpress.org/plugins/jetpack-search',
							views: 30,
							previousValue: 28,
						} ),
						expect.objectContaining( {
							link: 'https://wordpress.org/plugins/jetpack-boost',
							views: 12,
							previousValue: undefined,
						} ),
					],
				} ),
			],
		} );
	} );

	it( 'matches rows whose URL cannot be parsed by falling back to the raw value', () => {
		// Not every `url` the endpoint returns is absolute — a root-relative one
		// makes `new URL()` throw. Both periods have to key off the same raw
		// string, or such rows would never match and would lose their delta.
		const buildReport = ( views: number, date: string ) =>
			sanitizeStatsClicksResponse(
				{
					date,
					summary: {
						clicks: [ { name: '', views, url: '/downloads/report.pdf', children: null } ],
					},
				},
				{ period: 'day', start_date: date, end_date: date, summarize: true }
			);

		expect(
			mergeStatsClicksComparisonRows(
				buildReport( 42, '2026-06-29' ),
				buildReport( 28, '2026-06-22' )
			)
		).toEqual( {
			hasComparison: true,
			rows: [
				expect.objectContaining( {
					// An empty name falls back to the link for the display label.
					label: '/downloads/report.pdf',
					views: 42,
					previousValue: 28,
				} ),
			],
		} );
	} );

	it( 'reports comparison on grandchildren of a nested click group', () => {
		const buildReport = ( leafViews: number ): StatsNormalizedReport< StatsClicksItem > => ( {
			summary: {},
			data: [
				{
					time_interval: '2026-06-29',
					date_start: '2026-06-29T00:00:00+00:00',
					date_end: '2026-06-29T23:59:59+00:00',
					items: [
						{
							label: 'wordpress.org',
							views: leafViews,
							link: null,
							icon: null,
							labelIcon: null,
							children: [
								{
									label: '/plugins',
									views: leafViews,
									link: 'https://wordpress.org/plugins',
									icon: null,
									labelIcon: 'external',
									children: [
										{
											label: '/plugins/jetpack-search',
											views: leafViews,
											link: 'https://wordpress.org/plugins/jetpack-search',
											icon: null,
											labelIcon: 'external',
											children: null,
										},
									],
								},
							],
						},
					],
				},
			],
		} );

		const result = mergeStatsClicksComparisonRows( buildReport( 42 ), buildReport( 28 ) );

		expect( result.rows[ 0 ].children?.[ 0 ] ).toEqual(
			expect.objectContaining( {
				link: 'https://wordpress.org/plugins',
				previousValue: 28,
				childrenHaveComparison: true,
				children: [
					expect.objectContaining( {
						link: 'https://wordpress.org/plugins/jetpack-search',
						previousValue: 28,
					} ),
				],
			} )
		);
	} );

	it( 'matches an unlinked child by label inside its comparison group', () => {
		const buildReport = (
			groupViews: number,
			linkedViews: number,
			unlinkedViews: number
		): StatsNormalizedReport< StatsClicksItem > => ( {
			summary: {},
			data: [
				{
					time_interval: '2026-06-29',
					date_start: '2026-06-29T00:00:00+00:00',
					date_end: '2026-06-29T23:59:59+00:00',
					items: [
						{
							label: 'wordpress.org',
							views: groupViews,
							link: null,
							icon: null,
							labelIcon: null,
							children: [
								{
									label: '/plugins/jetpack-search',
									views: linkedViews,
									link: 'https://wordpress.org/plugins/jetpack-search',
									icon: null,
									labelIcon: 'external',
									children: null,
								},
								{
									label: 'untracked',
									views: unlinkedViews,
									link: null,
									icon: null,
									labelIcon: null,
									children: null,
								},
							],
						},
					],
				},
			],
		} );

		const result = mergeStatsClicksComparisonRows( buildReport( 9, 6, 3 ), buildReport( 7, 5, 2 ) );

		expect( result.hasComparison ).toBe( true );
		expect( result.rows[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'wordpress.org',
				previousValue: 7,
				childrenHaveComparison: true,
			} )
		);
		expect( result.rows[ 0 ].children ).toEqual( [
			expect.objectContaining( {
				link: 'https://wordpress.org/plugins/jetpack-search',
				previousValue: 5,
			} ),
			expect.objectContaining( { label: 'untracked', link: null, previousValue: 2 } ),
		] );
	} );

	it( 'does not pair an unlinked child with a linked comparison row of the same label', () => {
		const buildReport = (
			children: StatsClicksItem[]
		): StatsNormalizedReport< StatsClicksItem > => ( {
			summary: {},
			data: [
				{
					time_interval: '2026-06-29',
					date_start: '2026-06-29T00:00:00+00:00',
					date_end: '2026-06-29T23:59:59+00:00',
					items: [
						{
							label: 'wordpress.org',
							views: 9,
							link: null,
							icon: null,
							labelIcon: null,
							children,
						},
					],
				},
			],
		} );
		const linkedChild = ( views: number ): StatsClicksItem => ( {
			label: '/plugins',
			views,
			link: 'https://wordpress.org/plugins',
			icon: null,
			labelIcon: 'external',
			children: null,
		} );

		const result = mergeStatsClicksComparisonRows(
			buildReport( [
				linkedChild( 6 ),
				{
					label: '/plugins',
					views: 3,
					link: null,
					icon: null,
					labelIcon: null,
					children: null,
				},
			] ),
			buildReport( [ linkedChild( 5 ) ] )
		);

		// The linked comparison row belongs to the primary row that shares its
		// URL. Pairing it by label as well would count the same 5 clicks twice.
		expect( result.rows[ 0 ].children ).toEqual( [
			expect.objectContaining( { link: 'https://wordpress.org/plugins', previousValue: 5 } ),
			expect.objectContaining( { link: null, previousValue: undefined } ),
		] );
	} );

	it( 'keeps unlinked children of different click groups apart', () => {
		const buildGroup = (
			domain: string,
			groupViews: number,
			linkedViews: number,
			unlinkedViews: number
		): StatsClicksItem => ( {
			label: domain,
			views: groupViews,
			link: null,
			icon: null,
			labelIcon: null,
			children: [
				{
					label: '/page',
					views: linkedViews,
					link: `https://${ domain }/page`,
					icon: null,
					labelIcon: 'external',
					children: null,
				},
				{
					label: 'untracked',
					views: unlinkedViews,
					link: null,
					icon: null,
					labelIcon: null,
					children: null,
				},
			],
		} );

		const buildReport = (
			items: StatsClicksItem[]
		): StatsNormalizedReport< StatsClicksItem > => ( {
			summary: {},
			data: [
				{
					time_interval: '2026-06-29',
					date_start: '2026-06-29T00:00:00+00:00',
					date_end: '2026-06-29T23:59:59+00:00',
					items,
				},
			],
		} );

		const result = mergeStatsClicksComparisonRows(
			buildReport( [
				buildGroup( 'a.example.com', 9, 6, 3 ),
				buildGroup( 'b.example.com', 5, 4, 1 ),
			] ),
			buildReport( [ buildGroup( 'a.example.com', 7, 5, 2 ) ] )
		);

		expect( result.rows[ 0 ].children?.[ 1 ] ).toEqual(
			expect.objectContaining( { label: 'untracked', previousValue: 2 } )
		);
		// The comparison period has no b.example.com group, so its unlinked
		// child must not borrow the delta of the same label under a.example.com.
		expect( result.rows[ 1 ].children?.[ 1 ] ).toEqual(
			expect.objectContaining( { label: 'untracked', previousValue: undefined } )
		);
	} );
} );
