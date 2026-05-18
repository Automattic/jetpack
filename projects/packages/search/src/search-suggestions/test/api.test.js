import { fetchSuggestionsFromApi, parseTaxonomyFromUrl } from '../api';

describe( 'search suggestions API helpers', () => {
	const originalFetch = global.fetch;

	beforeEach( () => {
		jest.spyOn( global, 'fetch' ).mockImplementation();
	} );

	afterEach( () => {
		global.fetch = originalFetch;
	} );

	test( 'parses taxonomy and term from WPCOM suggestion URLs', () => {
		expect( parseTaxonomyFromUrl( 'https://example.com/?taxonomy=category&term=news' ) ).toEqual( {
			taxonomy: 'category',
			slug: 'news',
		} );
	} );

	test( 'parses taxonomy and term from pretty category URLs', () => {
		expect( parseTaxonomyFromUrl( 'https://example.com/category/news/' ) ).toEqual( {
			taxonomy: 'category',
			slug: 'news',
		} );
	} );

	test( 'parses taxonomy and term from relative category URLs', () => {
		expect( parseTaxonomyFromUrl( '/category/news/' ) ).toEqual( {
			taxonomy: 'category',
			slug: 'news',
		} );
	} );

	test( 'normalizes all suggestion groups from the API response', async () => {
		global.fetch.mockResolvedValue( {
			ok: true,
			json: () =>
				Promise.resolve( {
					query_suggestions: [ { text: 'wordpress hooks' } ],
					taxonomy_suggestions: [ { text: 'News', url: 'https://example.com/category/news/' } ],
					title_suggestions: [
						{ text: 'Getting Started', url: 'https://example.com/getting-started/' },
					],
				} ),
		} );

		await expect( fetchSuggestionsFromApi( 'word', '123', {}, undefined ) ).resolves.toEqual( [
			{ type: 'query', text: 'wordpress hooks' },
			{
				type: 'taxonomy',
				text: 'News',
				url: 'https://example.com/category/news/',
				taxonomy: 'category',
				slug: 'news',
			},
			{ type: 'post', text: 'Getting Started', url: 'https://example.com/getting-started/' },
		] );
		expect( global.fetch ).toHaveBeenCalledWith(
			'https://public-api.wordpress.com/wpcom/v2/sites/123/search-suggestions?query=word&size=5',
			expect.objectContaining( { signal: undefined } )
		);
	} );
} );
