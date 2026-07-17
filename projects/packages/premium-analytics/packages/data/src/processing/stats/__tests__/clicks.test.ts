import { mergeStatsClicksComparisonRows, sanitizeStatsClicksResponse } from '..';
import { clicksFixture, clicksSummaryFixture } from '../__fixtures__/clicks';

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
} );
