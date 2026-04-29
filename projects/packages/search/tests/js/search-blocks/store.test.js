// The Interactivity API store cannot be easily unit-tested in Jest because
// `@wordpress/interactivity` relies on a browser DOM. These tests verify
// the api.js and url-state.js helpers that back the store actions.
// Full store action testing is covered by E2E tests.

const captured = {
	state: {},
	actions: {},
};
const originalFetch = global.fetch;

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: ( _namespace, config ) => {
			if ( config ) {
				const descriptors = Object.getOwnPropertyDescriptors( config.state || {} );
				for ( const key of Object.keys( descriptors ) ) {
					Object.defineProperty( captured.state, key, descriptors[ key ] );
				}
				Object.assign( captured.actions, config.actions || {} );
			}
			return { state: captured.state, actions: captured.actions };
		},
	} ),
	{ virtual: true }
);

import { actions, state } from '../../../src/search-blocks/store';
import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

/**
 * Create a mock fetch response whose promise can be resolved after another action runs.
 *
 * @return {{promise: Promise<object>, resolve: Function}} Deferred response.
 */
function createDeferredResponse() {
	let resolve;
	const promise = new Promise( res => {
		resolve = res;
	} );
	return { promise, resolve };
}

/**
 * Create a minimal fetch Response mock.
 *
 * @param {object} data - Parsed JSON body.
 * @return {{json: Function}} Response-like object.
 */
function createResponse( data ) {
	return {
		json: jest.fn().mockResolvedValue( data ),
	};
}

/**
 * Create a raw API result for store normalization.
 *
 * @param {string} title - Result title.
 * @return {object} Raw search result.
 */
function createResult( title ) {
	return {
		result_id: title.toLowerCase().replaceAll( ' ', '-' ),
		fields: {
			'title.default': title,
			'permalink.url.raw': `example.com/${ title.toLowerCase().replaceAll( ' ', '-' ) }/`,
			date: '2026-04-01T00:00:00',
		},
	};
}

/**
 * Resolve each promise yielded by an Interactivity API action generator.
 *
 * @param {Generator} generator - Action generator.
 * @return {Promise<*>} Final generator return value.
 */
async function runGenerator( generator ) {
	let step = generator.next();
	while ( ! step.done ) {
		step = generator.next( await step.value );
	}
	return step.value;
}

describe( 'store helpers round-trip', () => {
	it( 'serializes and deserializes state without loss', () => {
		const original = {
			searchQuery: 'winter boots',
			sortOrder: 'newest',
		};
		const params = stateToUrlParams( original );
		const restored = urlParamsToState( params );
		expect( restored.searchQuery ).toBe( original.searchQuery );
		expect( restored.sortOrder ).toBe( original.sortOrder );
	} );

	it( 'collapses unknown `orderby` URL values to the default', () => {
		// A crafted URL like `?orderby=drop-tables` must not leak into the
		// `<select>` binding or the API request; parse_url_sort() applies
		// the same whitelist on the PHP side.
		const restored = urlParamsToState( new URLSearchParams( '?s=boots&orderby=drop-tables' ) );
		expect( restored.sortOrder ).toBe( 'relevance' );
	} );

	it( 'drops an invalid `sortOrder` from serialized output', () => {
		const params = stateToUrlParams( { searchQuery: 'boots', sortOrder: 'bogus' } );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );
} );

describe( 'store actions', () => {
	beforeEach( () => {
		Object.assign( state, {
			siteId: 123,
			searchQuery: 'old query',
			sortOrder: 'relevance',
			pageHandle: 'old-page',
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
			homeUrl: 'https://example.com',
			activeFilters: {},
			filterConfigs: {},
			results: [ { title: 'Existing result' } ],
			locale: 'en-US',
			isLoading: false,
			isLoadingMore: false,
			hasError: false,
			totalResults: 1,
			aggregations: {},
		} );
		Object.defineProperty( global, 'fetch', {
			configurable: true,
			writable: true,
			value: jest.fn(),
		} );
	} );

	afterEach( () => {
		if ( originalFetch ) {
			Object.defineProperty( global, 'fetch', {
				configurable: true,
				writable: true,
				value: originalFetch,
			} );
		} else {
			delete global.fetch;
		}
	} );

	it( 'drops load-more responses superseded by a new search', async () => {
		const loadMoreResponse = createDeferredResponse();
		global.fetch.mockReturnValueOnce( loadMoreResponse.promise ).mockResolvedValueOnce(
			createResponse( {
				results: [ createResult( 'Fresh result' ) ],
				total: 1,
				page_handle: null,
				aggregations: {},
			} )
		);

		const loadMorePromise = runGenerator( actions.loadMore() );
		expect( state.isLoadingMore ).toBe( true );

		state.searchQuery = 'fresh query';
		await runGenerator( actions.search( { syncUrl: false } ) );

		loadMoreResponse.resolve(
			createResponse( {
				results: [ createResult( 'Stale page result' ) ],
				page_handle: 'stale-next-page',
			} )
		);
		await loadMorePromise;

		expect( state.results ).toHaveLength( 1 );
		expect( state.results[ 0 ].title ).toBe( 'Fresh result' );
		expect( state.pageHandle ).toBeNull();
		expect( state.isLoadingMore ).toBe( false );
	} );
} );
