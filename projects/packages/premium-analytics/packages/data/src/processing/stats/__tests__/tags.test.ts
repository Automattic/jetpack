import { sanitizeStatsTagsResponse, selectStatsTagsItemsByType } from '..';
import { tagsFixture } from '../__fixtures__/tags';

describe( 'Stats tags normalizer', () => {
	it( 'normalizes top-level tag rows from the Calypso payload shape', () => {
		const result = sanitizeStatsTagsResponse( tagsFixture );

		expect( result.summary ).toEqual( {} );
		expect( result.data[ 0 ] ).toEqual(
			expect.objectContaining( {
				time_interval: '2026-06-22',
				date_start: '2026-06-22T00:00:00',
				date_end: '2026-06-22T23:59:59',
				items: [
					expect.objectContaining( {
						label: [
							{
								label: 'News',
								type: 'category',
								labelIcon: 'folder',
								link: 'https://example.com/category/news/',
							},
						],
						labelText: 'News',
						value: 18,
						link: 'https://example.com/category/news/',
					} ),
					expect.objectContaining( {
						label: [
							{
								label: 'Announcements',
								type: 'category',
								labelIcon: 'folder',
								link: null,
							},
							{
								label: 'Release',
								type: 'tag',
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
								type: 'category',
								labelIcon: 'folder',
								value: null,
								link: 'https://example.com/category/announcements/',
								children: null,
							} ),
							expect.objectContaining( {
								label: 'Release',
								type: 'tag',
								labelIcon: 'tag',
								value: null,
								link: 'https://example.com/tag/release/',
								children: null,
							} ),
						],
					} ),
				],
			} )
		);
	} );

	it( 'normalizes empty responses', () => {
		expect( sanitizeStatsTagsResponse( { tags: [] } ) ).toMatchObject( {
			summary: {},
			data: [],
		} );
	} );

	describe( 'selectStatsTagsItemsByType', () => {
		const items = sanitizeStatsTagsResponse( {
			tags: [
				{ tags: [ { type: 'category', name: 'News', link: '/category/news/' } ], views: 18 },
				{
					tags: [
						{ type: 'category', name: 'Announcements', link: '/category/announcements/' },
						{ type: 'tag', name: 'Release', link: '/tag/release/' },
						{ type: 'tag', name: 'Beta', link: '/tag/beta/' },
					],
					views: 7,
				},
				{ tags: [ { type: 'tag', name: 'Draft', link: '/tag/draft/' } ], views: 3 },
			],
		} ).data[ 0 ].items;

		it.each( [
			[
				'category',
				[
					{ labelText: 'News', value: 18, link: '/category/news/' },
					// A lone survivor of a group becomes a linked row carrying the group's views.
					{ labelText: 'Announcements', value: 7, link: '/category/announcements/' },
				],
			],
			[
				'tag',
				[
					{ labelText: 'Release, Beta', value: 7, link: null },
					{ labelText: 'Draft', value: 3, link: '/tag/draft/' },
				],
			],
		] as const )( "keeps each row's %s members, in rank order", ( type, expected ) => {
			expect( selectStatsTagsItemsByType( items, type ) ).toEqual(
				expected.map( row => expect.objectContaining( row ) )
			);
		} );

		it( 'keeps a narrowed group a drill-down over its surviving members', () => {
			const [ group ] = selectStatsTagsItemsByType( items, 'tag' );

			expect( group.children?.map( child => [ child.label, child.link ] ) ).toEqual( [
				[ 'Release', '/tag/release/' ],
				[ 'Beta', '/tag/beta/' ],
			] );
		} );
	} );
} );
