import { buildSuggestionsUrl, fetchSuggestions, parseTaxonomyFromUrl } from '../suggestions-api';

const SITE_ID = '12345';

/**
 * Build a resolved mock fetch response.
 *
 * @param {object}  data - Response body to resolve with.
 * @param {boolean} ok   - Response `ok` flag; defaults true.
 * @return {Promise} Fetch-shaped response promise.
 */
function makeResponse( data, ok = true ) {
	return Promise.resolve( {
		ok,
		json: () => Promise.resolve( data ),
	} );
}

beforeEach( () => {
	// eslint-disable-next-line jest/prefer-spy-on
	global.fetch = jest.fn();
} );

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'buildSuggestionsUrl', () => {
	it( 'targets the public API on non-private sites', () => {
		const url = buildSuggestionsUrl( {
			siteId: SITE_ID,
			query: 'hello',
			isPrivateSite: false,
			isWpcom: false,
			homeUrl: 'https://example.com',
		} );
		expect( url ).toMatch( /^https:\/\/public-api\.wordpress\.com\/wpcom\/v2\/sites\// );
		expect( url ).toContain( encodeURIComponent( SITE_ID ) );
		expect( url ).toContain( 'query=hello' );
		expect( url ).toContain( 'size=5' );
	} );

	it( 'targets the homeUrl wpcom-origin proxy on private WPCOM sites', () => {
		const url = buildSuggestionsUrl( {
			siteId: SITE_ID,
			query: 'hello',
			isPrivateSite: true,
			isWpcom: true,
			homeUrl: 'https://my.private.site',
		} );
		expect( url ).toMatch(
			/^https:\/\/my\.private\.site\/wp-json\/wpcom-origin\/wpcom\/v2\/sites\//
		);
	} );

	it( 'falls back to the public API when the site is private but not WPCOM', () => {
		const url = buildSuggestionsUrl( {
			siteId: SITE_ID,
			query: 'hello',
			isPrivateSite: true,
			isWpcom: false,
			homeUrl: 'https://my.private.site',
		} );
		expect( url ).toMatch( /^https:\/\/public-api\.wordpress\.com\// );
	} );

	it( 'URL-encodes the query string and site id', () => {
		const url = buildSuggestionsUrl( {
			siteId: 'a b',
			query: 'hello world & more',
			isPrivateSite: false,
			isWpcom: false,
			homeUrl: '',
		} );
		expect( url ).toContain( 'sites/a%20b/' );
		expect( url ).toContain( 'query=hello%20world%20%26%20more' );
	} );

	it( 'honors a custom size argument', () => {
		const url = buildSuggestionsUrl( {
			siteId: SITE_ID,
			query: 'q',
			isPrivateSite: false,
			isWpcom: false,
			homeUrl: '',
			size: 10,
		} );
		expect( url ).toContain( 'size=10' );
	} );
} );

describe( 'parseTaxonomyFromUrl', () => {
	it( 'recovers WPCOM-style ?taxonomy=…&term=…', () => {
		expect( parseTaxonomyFromUrl( 'https://example.com/?taxonomy=category&term=news' ) ).toEqual( {
			taxonomy: 'category',
			slug: 'news',
		} );
	} );

	it( 'recovers /category/<slug>/ pretty permalinks', () => {
		expect( parseTaxonomyFromUrl( 'https://example.com/category/news/' ) ).toEqual( {
			taxonomy: 'category',
			slug: 'news',
		} );
	} );

	it( 'recovers /tag/<slug>/ pretty permalinks as post_tag', () => {
		expect( parseTaxonomyFromUrl( 'https://example.com/tag/wp/' ) ).toEqual( {
			taxonomy: 'post_tag',
			slug: 'wp',
		} );
	} );

	it( 'recovers legacy ?tag=<slug>', () => {
		expect( parseTaxonomyFromUrl( 'https://example.com/?tag=open-source' ) ).toEqual( {
			taxonomy: 'post_tag',
			slug: 'open-source',
		} );
	} );

	it( 'returns null when the URL shape is unrecognized', () => {
		expect( parseTaxonomyFromUrl( 'https://example.com/about/' ) ).toBeNull();
	} );

	it( 'returns null on malformed URLs without throwing', () => {
		expect( parseTaxonomyFromUrl( 'not-a-url' ) ).toBeNull();
	} );
} );

describe( 'fetchSuggestions', () => {
	const baseArgs = {
		query: 'react',
		siteId: SITE_ID,
		isPrivateSite: false,
		isWpcom: false,
		homeUrl: '',
		nonce: '',
	};

	it( 'returns query, taxonomy, and post items in canonical order', async () => {
		global.fetch.mockReturnValue(
			makeResponse( {
				query_suggestions: [ { text: 'react hooks' } ],
				taxonomy_suggestions: [
					{ text: 'News', url: '/category/news/', taxonomy: 'category', slug: 'news' },
				],
				title_suggestions: [ { text: 'Getting Started', url: '/getting-started/' } ],
			} )
		);

		const items = await fetchSuggestions( baseArgs );

		expect( items ).toHaveLength( 3 );
		expect( items[ 0 ] ).toEqual( { type: 'query', text: 'react hooks' } );
		expect( items[ 1 ] ).toMatchObject( { type: 'taxonomy', text: 'News' } );
		expect( items[ 2 ] ).toEqual( {
			type: 'post',
			text: 'Getting Started',
			url: '/getting-started/',
		} );
	} );

	it( 'drops items without display text', async () => {
		global.fetch.mockReturnValue(
			makeResponse( {
				query_suggestions: [ { text: '' }, { text: 'kept' } ],
				taxonomy_suggestions: [],
				title_suggestions: [],
			} )
		);
		const items = await fetchSuggestions( baseArgs );
		expect( items ).toHaveLength( 1 );
		expect( items[ 0 ].text ).toBe( 'kept' );
	} );

	it( 'drops post / taxonomy items without a url', async () => {
		global.fetch.mockReturnValue(
			makeResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [ { text: 'No URL' } ],
				title_suggestions: [ { text: 'No URL post' } ],
			} )
		);
		const items = await fetchSuggestions( baseArgs );
		expect( items ).toEqual( [] );
	} );

	it( 'recovers taxonomy + slug from the archive URL when the API omits them', async () => {
		global.fetch.mockReturnValue(
			makeResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [ { text: 'News', url: 'https://example.com/category/news/' } ],
				title_suggestions: [],
			} )
		);
		const items = await fetchSuggestions( baseArgs );
		expect( items[ 0 ] ).toMatchObject( { taxonomy: 'category', slug: 'news' } );
	} );

	it( 'returns an empty array on a non-ok HTTP response', async () => {
		global.fetch.mockReturnValue( makeResponse( {}, false ) );
		const items = await fetchSuggestions( baseArgs );
		expect( items ).toEqual( [] );
	} );

	it( 'sets X-WP-Nonce + credentials only for private sites', async () => {
		global.fetch.mockReturnValue(
			makeResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [],
				title_suggestions: [],
			} )
		);

		await fetchSuggestions( {
			...baseArgs,
			isPrivateSite: true,
			isWpcom: true,
			homeUrl: 'https://my.private.site',
			nonce: 'abc',
		} );
		const [ , privateOpts ] = global.fetch.mock.calls[ 0 ];
		expect( privateOpts.headers ).toEqual( { 'X-WP-Nonce': 'abc' } );
		expect( privateOpts.credentials ).toBe( 'include' );

		global.fetch.mockClear();
		global.fetch.mockReturnValue(
			makeResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [],
				title_suggestions: [],
			} )
		);

		await fetchSuggestions( baseArgs );
		const [ , publicOpts ] = global.fetch.mock.calls[ 0 ];
		expect( publicOpts.headers ).toBeUndefined();
		expect( publicOpts.credentials ).toBeUndefined();
	} );

	it( 'propagates AbortError so callers can distinguish it from network failure', async () => {
		const abort = new Error( 'Aborted' );
		abort.name = 'AbortError';
		global.fetch.mockRejectedValue( abort );
		await expect( fetchSuggestions( baseArgs ) ).rejects.toMatchObject( { name: 'AbortError' } );
	} );
} );
