import { sanitizeStatsUtmResponse } from '..';
import { utmFixture, utmWithTopPostsFixture } from '../__fixtures__/utm';

describe( 'Stats UTM normalizer', () => {
	it( 'normalizes raw UTM top values into sorted report items', () => {
		const result = sanitizeStatsUtmResponse( utmFixture, {
			date: '2026-06-16',
			utm_param: 'utm_source,utm_medium',
		} );

		expect( result.summary ).toEqual( { total: 35 } );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					{
						label: 'newsletter / email',
						value: 24,
						paramValues: '["newsletter","email"]',
						children: null,
					},
					{
						label: 'google / cpc',
						value: 11,
						paramValues: '["google","cpc"]',
						children: null,
					},
				],
			} )
		);
	} );

	it( 'normalizes top posts included with UTM values', () => {
		const result = sanitizeStatsUtmResponse( utmWithTopPostsFixture, {
			date: '2026-06-16',
			utm_param: 'utm_campaign,utm_source,utm_medium',
		} );

		expect( result.summary ).toEqual( { total: 25 } );
		expect( result.data[ 0 ].items ).toEqual( [
			{
				label: 'spring-sale / newsletter / email',
				value: 18,
				children: [
					{
						id: 41,
						label: 'Spring sale landing page',
						value: 12,
						href: 'https://example.com/spring-sale/',
						page: '/stats/post/41',
						actions: [
							{ type: 'link', data: 'https://example.com/spring-sale/' },
							{
								type: 'url-builder',
								data: {
									url: 'https://example.com/spring-sale/',
									utm_campaign: 'spring-sale',
									utm_source: 'newsletter',
									utm_medium: 'email',
								},
							},
						],
						children: null,
					},
				],
			},
			{
				label: 'direct',
				value: 7,
				children: null,
			},
		] );
	} );

	it( 'returns an empty report when top UTM values are missing', () => {
		expect( sanitizeStatsUtmResponse( {}, { date: '2026-06-16' } ) ).toEqual( {
			summary: { total: 0 },
			data: [],
		} );
	} );

	it( 'treats an empty top posts object as already resolved', () => {
		const result = sanitizeStatsUtmResponse(
			{
				top_utm_values: {
					direct: 7,
				},
				top_posts: {},
			},
			{ date: '2026-06-16' }
		);

		expect( result.data[ 0 ].items ).toEqual( [
			{
				label: 'direct',
				value: 7,
				children: null,
			},
		] );
	} );

	it( 'keeps param values when top posts are null', () => {
		const result = sanitizeStatsUtmResponse(
			{
				top_utm_values: {
					direct: 7,
				},
				top_posts: null,
			},
			{ date: '2026-06-16' }
		);

		expect( result.data[ 0 ].items ).toEqual( [
			{
				label: 'direct',
				value: 7,
				paramValues: 'direct',
				children: null,
			},
		] );
	} );

	it( 'treats disabled top post queries as already resolved', () => {
		const result = sanitizeStatsUtmResponse(
			{
				top_utm_values: {
					'["newsletter","email"]': 24,
				},
			},
			{
				date: '2026-06-16',
				query_top_posts: false,
				utm_param: 'utm_source,utm_medium',
			}
		);

		expect( result.data[ 0 ].items ).toEqual( [
			{
				label: 'newsletter / email',
				value: 24,
				children: null,
			},
		] );
	} );
} );
