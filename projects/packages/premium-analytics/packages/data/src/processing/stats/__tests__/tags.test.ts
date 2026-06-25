import { sanitizeStatsTagsResponse } from '..';
import { tagsByDateFixture, tagsFixture, tagsSummaryFixture } from '../__fixtures__/tags';

describe( 'Stats tags normalizer', () => {
	it( 'normalizes top-level tag rows from the Calypso payload shape', () => {
		const result = sanitizeStatsTagsResponse( tagsFixture );

		expect( result.summary ).toEqual( {} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-22T00:00:00+00:00',
				date_end: '2026-06-22T23:59:59+00:00',
				items: [
					expect.objectContaining( {
						label: [
							{
								label: 'News',
								labelIcon: 'folder',
								link: 'https://example.com/category/news/',
							},
						],
						labelText: 'News',
						value: 18,
						link: 'https://example.com/category/news/',
					} ),
					expect.any( Object ),
				],
			} )
		);
	} );

	it( 'normalizes multi-tag rows with children', () => {
		expect( sanitizeStatsTagsResponse( tagsFixture ).data[ 0 ].items[ 1 ] ).toEqual(
			expect.objectContaining( {
				label: [
					{
						label: 'Announcements',
						labelIcon: 'folder',
						link: null,
					},
					{
						label: 'Release',
						labelIcon: 'tag',
						link: null,
					},
				],
				labelText: 'Announcements, Release',
				value: 7,
				link: null,
				children: [
					expect.objectContaining( {
						label: 'Announcements',
						labelIcon: 'folder',
						value: null,
						link: 'https://example.com/category/announcements/',
						children: null,
					} ),
					expect.objectContaining( {
						label: 'Release',
						labelIcon: 'tag',
						value: null,
						link: 'https://example.com/tag/release/',
						children: null,
					} ),
				],
			} )
		);
	} );

	it( 'normalizes by-date tag buckets and preserves zero values', () => {
		const result = sanitizeStatsTagsResponse( tagsByDateFixture, {
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
						label: [
							{
								label: 'By date',
								labelIcon: 'folder',
								link: 'https://example.com/category/by-date/',
							},
						],
						labelText: 'By date',
						value: 0,
						link: 'https://example.com/category/by-date/',
					} ),
				],
			},
		] );
	} );

	it( 'normalizes summarized tag rows into range data', () => {
		const result = sanitizeStatsTagsResponse( tagsSummaryFixture, {
			period: 'day',
			start_date: '2026-06-16',
			end_date: '2026-06-22',
			summarize: true,
		} );

		expect( result ).toEqual( {
			summary: {
				total_views: 34,
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
							label: [
								{
									label: 'Summary',
									labelIcon: 'tag',
									link: 'https://example.com/tag/summary/',
								},
							],
							labelText: 'Summary',
							value: 34,
							link: 'https://example.com/tag/summary/',
						} ),
					],
				},
			],
		} );
	} );

	it( 'normalizes empty responses', () => {
		expect( sanitizeStatsTagsResponse( { tags: [] } ) ).toMatchObject( {
			summary: {},
			data: [],
		} );
	} );
} );
