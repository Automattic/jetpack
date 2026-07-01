import { jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const useEntityRecords = jest.fn();
const useSelect = jest.fn();

const recordsByType = {
	post: [
		{
			id: 1,
			title: { rendered: 'Post title' },
			link: 'https://example.com/post-title/',
			type: 'post',
			status: 'publish',
			meta: {
				advanced_seo_description: 'Post description.',
				jetpack_seo_html_title: 'Post SEO title',
				jetpack_seo_noindex: false,
				jetpack_seo_schema_type: 'article',
			},
		},
	],
	page: [],
	gear_review: [
		{
			id: 9,
			title: { rendered: 'Alpenglow 45' },
			link: 'https://example.com/gear-reviews/alpenglow-45/',
			type: 'gear_review',
			status: 'publish',
			meta: {
				advanced_seo_description: 'Backpack field review.',
				jetpack_seo_html_title: 'Alpenglow 45 Backpack Review',
				jetpack_seo_noindex: true,
				jetpack_seo_schema_type: 'faq',
			},
		},
	],
};

const postTypes = [
	{
		slug: 'post',
		name: 'Posts',
		rest_base: 'posts',
		rest_namespace: 'wp/v2',
		viewable: true,
		visibility: { show_ui: true },
	},
	{
		slug: 'page',
		name: 'Pages',
		rest_base: 'pages',
		rest_namespace: 'wp/v2',
		viewable: true,
		visibility: { show_ui: true },
	},
	{
		slug: 'gear_review',
		name: 'Gear Reviews',
		rest_base: 'gear-reviews',
		rest_namespace: 'custom/v1',
		viewable: true,
		visibility: { show_ui: true },
	},
	{
		slug: 'attachment',
		name: 'Media',
		rest_base: 'media',
		rest_namespace: 'wp/v2',
		viewable: true,
		visibility: { show_ui: true },
	},
];

jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecords,
} ) );

jest.unstable_mockModule( '@wordpress/data', () => ( {
	useSelect,
} ) );

const { default: useSeoPosts } = await import( '../use-seo-posts' );

describe( 'useSeoPosts', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		useEntityRecords.mockImplementation( ( _kind: string, name: keyof typeof recordsByType ) => ( {
			records: recordsByType[ name ] ?? [],
			hasResolved: true,
		} ) );

		useSelect.mockImplementation( selector =>
			selector( () => ( {
				getEntityRecords: ( kind: string, name: string ) => {
					if ( kind === 'root' && name === 'postType' ) {
						return postTypes;
					}
					if ( kind === 'postType' ) {
						return recordsByType[ name as keyof typeof recordsByType ] ?? [];
					}
					return [];
				},
				hasFinishedResolution: () => true,
				isResolving: () => false,
			} ) )
		);
	} );

	it( 'merges supported custom post type records with posts and pages', () => {
		const { result } = renderHook( () => useSeoPosts() );

		expect( result.current.items ).toEqual(
			expect.arrayContaining( [
				expect.objectContaining( { id: 1, type: 'post', title: 'Post title' } ),
				expect.objectContaining( {
					id: 9,
					type: 'gear_review',
					title: 'Alpenglow 45',
					schemaType: 'faq',
					noindex: true,
				} ),
			] )
		);
		expect( result.current.postTypeOptions ).toEqual( [
			{ value: 'post', label: 'Posts' },
			{ value: 'page', label: 'Pages' },
			{ value: 'gear_review', label: 'Gear Reviews' },
		] );
		expect( result.current.isLoading ).toBe( false );
	} );
} );
