jest.mock( 'debounce', () => fn => {
	const wrapped = ( ...args ) => fn( ...args );
	wrapped.clear = () => {};
	jest.spyOn( wrapped, 'clear' ).mockImplementation();
	return wrapped;
} );

import { renderHook, waitFor } from '@testing-library/react';
import useSearchSuggestions from '../use-search-suggestions';

const SITE_ID = '12345';

/**
 * Creates a mock fetch response that resolves with ok:true.
 * @param {object} data - response body to resolve with
 * @return {Promise} Resolved fetch response
 */
function makeOkResponse( data ) {
	return Promise.resolve( {
		ok: true,
		json: () => Promise.resolve( data ),
	} );
}

/**
 * Creates a mock fetch response that resolves with ok:false.
 * @return {Promise} Resolved fetch response
 */
function makeErrorResponse() {
	return Promise.resolve( { ok: false } );
}
beforeEach( () => {
	// eslint-disable-next-line jest/prefer-spy-on
	global.fetch = jest.fn();
	window.JetpackInstantSearchOptions = {};
} );

afterEach( () => {
	delete window.JetpackInstantSearchOptions;
	jest.clearAllMocks();
} );

describe( 'useSearchSuggestions', () => {
	it( 'returns empty suggestions and isLoading false when disabled', () => {
		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'test', siteId: SITE_ID, enabled: false } )
		);
		expect( result.current.suggestions ).toEqual( [] );
		expect( result.current.isLoading ).toBe( false );
		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	it( 'fetches from the public API URL when isPrivateSite is false', async () => {
		window.JetpackInstantSearchOptions = { isPrivateSite: false, isWpcom: false };
		global.fetch.mockReturnValue(
			makeOkResponse( { query_suggestions: [], taxonomy_suggestions: [], title_suggestions: [] } )
		);

		renderHook( () => useSearchSuggestions( { query: 'hello', siteId: SITE_ID, enabled: true } ) );

		await waitFor( () => expect( global.fetch ).toHaveBeenCalled() );

		const [ url ] = global.fetch.mock.calls[ 0 ];
		expect( url ).toMatch( /^https:\/\/public-api\.wordpress\.com\/wpcom\/v2\/sites\// );
		expect( url ).toContain( encodeURIComponent( SITE_ID ) );
		expect( url ).toContain( 'query=hello' );
	} );

	it( 'fetches from homeUrl-based URL when isPrivateSite and isWpcom are true', async () => {
		window.JetpackInstantSearchOptions = {
			isPrivateSite: true,
			isWpcom: true,
			homeUrl: 'https://my.private.site',
			apiNonce: 'abc123',
		};
		global.fetch.mockReturnValue(
			makeOkResponse( { query_suggestions: [], taxonomy_suggestions: [], title_suggestions: [] } )
		);

		renderHook( () => useSearchSuggestions( { query: 'hello', siteId: SITE_ID, enabled: true } ) );

		await waitFor( () => expect( global.fetch ).toHaveBeenCalled() );

		const [ url ] = global.fetch.mock.calls[ 0 ];
		expect( url ).toMatch(
			/^https:\/\/my\.private\.site\/wp-json\/wpcom-origin\/wpcom\/v2\/sites\//
		);
	} );

	it( 'includes nonce header and credentials for private sites', async () => {
		window.JetpackInstantSearchOptions = {
			isPrivateSite: true,
			isWpcom: true,
			homeUrl: 'https://my.private.site',
			apiNonce: 'nonce-xyz',
		};
		global.fetch.mockReturnValue(
			makeOkResponse( { query_suggestions: [], taxonomy_suggestions: [], title_suggestions: [] } )
		);

		renderHook( () => useSearchSuggestions( { query: 'hello', siteId: SITE_ID, enabled: true } ) );

		await waitFor( () => expect( global.fetch ).toHaveBeenCalled() );

		const [ , fetchOptions ] = global.fetch.mock.calls[ 0 ];
		expect( fetchOptions.headers[ 'X-WP-Nonce' ] ).toBe( 'nonce-xyz' );
		expect( fetchOptions.credentials ).toBe( 'include' );
	} );

	it( 'returns parsed query, taxonomy, and post items in correct order', async () => {
		global.fetch.mockReturnValue(
			makeOkResponse( {
				query_suggestions: [ { text: 'react hooks' } ],
				taxonomy_suggestions: [
					{ text: 'News', url: '/category/news/', taxonomy: 'category', slug: 'news' },
				],
				title_suggestions: [ { text: 'Getting Started', url: '/getting-started/' } ],
			} )
		);

		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'react', siteId: SITE_ID, enabled: true } )
		);

		await waitFor( () => expect( result.current.suggestions ).toHaveLength( 3 ) );

		const [ q, t, p ] = result.current.suggestions;
		expect( q ).toEqual( { type: 'query', text: 'react hooks' } );
		expect( t.type ).toBe( 'taxonomy' );
		expect( t.text ).toBe( 'News' );
		expect( p ).toEqual( { type: 'post', text: 'Getting Started', url: '/getting-started/' } );
	} );

	it( 'parses taxonomy and slug from WPCOM-style URL (?taxonomy=category&term=unix)', async () => {
		global.fetch.mockReturnValue(
			makeOkResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [
					{
						text: 'Unix',
						url: 'https://example.com/?taxonomy=category&term=unix',
					},
				],
				title_suggestions: [],
			} )
		);

		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'unix', siteId: SITE_ID, enabled: true } )
		);

		await waitFor( () => expect( result.current.suggestions ).toHaveLength( 1 ) );

		const item = result.current.suggestions[ 0 ];
		expect( item.taxonomy ).toBe( 'category' );
		expect( item.slug ).toBe( 'unix' );
	} );

	it( 'parses taxonomy and slug from pretty-permalink category URL (/category/news/)', async () => {
		global.fetch.mockReturnValue(
			makeOkResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [ { text: 'News', url: 'https://example.com/category/news/' } ],
				title_suggestions: [],
			} )
		);

		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'news', siteId: SITE_ID, enabled: true } )
		);

		await waitFor( () => expect( result.current.suggestions ).toHaveLength( 1 ) );

		const item = result.current.suggestions[ 0 ];
		expect( item.taxonomy ).toBe( 'category' );
		expect( item.slug ).toBe( 'news' );
	} );

	it( 'parses taxonomy and slug from pretty-permalink tag URL (/tag/wordpress/)', async () => {
		global.fetch.mockReturnValue(
			makeOkResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [ { text: 'WordPress', url: 'https://example.com/tag/wordpress/' } ],
				title_suggestions: [],
			} )
		);

		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'wp', siteId: SITE_ID, enabled: true } )
		);

		await waitFor( () => expect( result.current.suggestions ).toHaveLength( 1 ) );

		const item = result.current.suggestions[ 0 ];
		expect( item.taxonomy ).toBe( 'post_tag' );
		expect( item.slug ).toBe( 'wordpress' );
	} );

	it( 'parses taxonomy and slug from ?tag=slug URL', async () => {
		global.fetch.mockReturnValue(
			makeOkResponse( {
				query_suggestions: [],
				taxonomy_suggestions: [
					{ text: 'Open Source', url: 'https://example.com/?tag=open-source' },
				],
				title_suggestions: [],
			} )
		);

		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'open', siteId: SITE_ID, enabled: true } )
		);

		await waitFor( () => expect( result.current.suggestions ).toHaveLength( 1 ) );

		const item = result.current.suggestions[ 0 ];
		expect( item.taxonomy ).toBe( 'post_tag' );
		expect( item.slug ).toBe( 'open-source' );
	} );

	it( 'returns empty array when response.ok is false', async () => {
		global.fetch.mockReturnValue( makeErrorResponse() );

		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'error', siteId: SITE_ID, enabled: true } )
		);

		await waitFor( () => expect( global.fetch ).toHaveBeenCalled() );
		// Allow the promise chain to settle
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.suggestions ).toEqual( [] );
	} );

	it( 'returns empty array on non-AbortError fetch failure', async () => {
		global.fetch.mockRejectedValue( new Error( 'Network failure' ) );

		const { result } = renderHook( () =>
			useSearchSuggestions( { query: 'fail', siteId: SITE_ID, enabled: true } )
		);

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.suggestions ).toEqual( [] );
	} );

	it( 'does NOT reset suggestions on AbortError', async () => {
		// First, seed some suggestions from a successful fetch
		global.fetch.mockReturnValueOnce(
			makeOkResponse( {
				query_suggestions: [ { text: 'initial result' } ],
				taxonomy_suggestions: [],
				title_suggestions: [],
			} )
		);

		const { result, rerender } = renderHook(
			( { query } ) => useSearchSuggestions( { query, siteId: SITE_ID, enabled: true } ),
			{ initialProps: { query: 'init' } }
		);

		await waitFor( () => expect( result.current.suggestions ).toHaveLength( 1 ) );

		// Now make fetch throw an AbortError
		const abortError = new Error( 'Aborted' );
		abortError.name = 'AbortError';
		global.fetch.mockRejectedValueOnce( abortError );

		rerender( { query: 'new query' } );

		await waitFor( () => expect( global.fetch ).toHaveBeenCalledTimes( 2 ) );

		// Suggestions should not have been cleared by the AbortError
		// (isLoading goes false via finally, but setSuggestions([]) is NOT called)
		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.suggestions ).toHaveLength( 1 );
	} );

	it( 'sets suggestions to empty when enabled is toggled to false', async () => {
		global.fetch.mockReturnValue(
			makeOkResponse( {
				query_suggestions: [ { text: 'result' } ],
				taxonomy_suggestions: [],
				title_suggestions: [],
			} )
		);

		const { result, rerender } = renderHook(
			( { enabled } ) => useSearchSuggestions( { query: 'test', siteId: SITE_ID, enabled } ),
			{ initialProps: { enabled: true } }
		);

		await waitFor( () => expect( result.current.suggestions ).toHaveLength( 1 ) );

		rerender( { enabled: false } );

		expect( result.current.suggestions ).toEqual( [] );
	} );
} );
