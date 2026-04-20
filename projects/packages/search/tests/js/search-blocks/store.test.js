// The Interactivity API store cannot be easily unit-tested in Jest because
// `@wordpress/interactivity` relies on a browser DOM. These tests verify
// the api.js and url-state.js helpers that back the store actions.
// Full store action testing is covered by E2E tests.

import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

describe( 'store helpers round-trip', () => {
	it( 'serializes and deserializes state without loss', () => {
		const original = {
			searchQuery: 'winter boots',
			activeFilters: { category: [ 'products' ], post_tag: [ 'sale' ] },
			sortOrder: 'date',
		};
		const params = stateToUrlParams( original );
		const restored = urlParamsToState( params );
		expect( restored.searchQuery ).toBe( original.searchQuery );
		expect( restored.activeFilters.category ).toEqual( original.activeFilters.category );
		expect( restored.activeFilters.post_tag ).toEqual( original.activeFilters.post_tag );
		expect( restored.sortOrder ).toBe( original.sortOrder );
	} );
} );
