import { sanitizeStatsTagsResponse } from '..';
import { tagsFixture } from '../__fixtures__/tags';

describe( 'Stats tags normalizer', () => {
	it( 'normalizes tag rows', () => {
		expect( sanitizeStatsTagsResponse( tagsFixture ).data[ 0 ].items[ 0 ] ).toEqual(
			expect.objectContaining( {
				label: 'News',
				value: 18,
				link: 'https://example.com/category/news/',
			} )
		);
	} );

	it( 'normalizes multi-tag rows with children', () => {
		expect( sanitizeStatsTagsResponse( tagsFixture ).data[ 0 ].items[ 1 ] ).toEqual(
			expect.objectContaining( {
				label: 'Announcements, Release',
				value: 7,
				link: null,
				children: [
					expect.objectContaining( {
						label: 'Announcements',
						labelIcon: 'folder',
						value: 0,
						link: 'https://example.com/category/announcements/',
						children: null,
					} ),
					expect.objectContaining( {
						label: 'Release',
						labelIcon: 'tag',
						value: 0,
						link: 'https://example.com/tag/release/',
						children: null,
					} ),
				],
			} )
		);
	} );

	it( 'aggregates summary totals', () => {
		expect( sanitizeStatsTagsResponse( tagsFixture ).summary.total ).toBe( 25 );
	} );

	it( 'normalizes empty responses', () => {
		expect( sanitizeStatsTagsResponse( { tags: [] } ) ).toMatchObject( {
			summary: {
				total: 0,
			},
			data: [],
		} );
	} );
} );
