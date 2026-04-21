// The Interactivity API store cannot be easily unit-tested in Jest because
// `@wordpress/interactivity` relies on a browser DOM. These tests verify
// the api.js and url-state.js helpers that back the store actions.
// Full store action testing is covered by E2E tests.

import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

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
