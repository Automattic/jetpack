/**
 * Tests for SEARCH-311: getSearchTitle() must not fall through to
 * "No results found" while a query is pending (isQueryPending) or actually
 * loading (isLoading), regardless of a stale/empty response.total.
 */

// getSearchTitle() doesn't touch any of these; mocked to avoid pulling in
// unrelated module-level dependencies (e.g. jetpack-colophon's PALETTE, which
// is only defined via webpack DefinePlugin at build time, not under Jest).
jest.mock( '../answers-panel', () => () => null );
jest.mock( '../gridicon', () => () => null );
jest.mock( '../jetpack-colophon', () => () => null );
jest.mock( '../notice', () => () => null );
jest.mock( '../scroll-button', () => () => null );
jest.mock( '../search-controls', () => () => null );
jest.mock( '../search-form', () => () => null );
jest.mock( '../search-result', () => () => null );
jest.mock( '../sidebar', () => () => null );
jest.mock( '../tabbed-search-filters', () => () => null );

import SearchResults from '../search-results';

const baseProps = {
	response: {},
	searchQuery: '',
	staticFilters: {},
	hasError: false,
	isLoading: false,
	isQueryPending: false,
};

const titleFor = props => new SearchResults( { ...baseProps, ...props } ).getSearchTitle();

describe( 'SearchResults#getSearchTitle — isQueryPending', () => {
	it( 'shows "No results found" when nothing is loading or pending and total is 0', () => {
		expect( titleFor( {} ) ).toBe( 'No results found' );
	} );

	it( 'shows "Searching…" while isQueryPending is true, even with a stale empty response', () => {
		expect( titleFor( { searchQuery: 'hello', isQueryPending: true } ) ).toBe( 'Searching…' );
	} );

	it( 'shows "Loading popular results…" while isQueryPending is true with no query', () => {
		expect( titleFor( { searchQuery: '', isQueryPending: true } ) ).toBe(
			'Loading popular results…'
		);
	} );

	it( 'still shows "Searching…" while isLoading is true (existing behavior)', () => {
		expect( titleFor( { searchQuery: 'hello', isLoading: true } ) ).toBe( 'Searching…' );
	} );

	it( 'falls through to "No results found" once neither pending nor loading, with a stale empty response', () => {
		expect( titleFor( { searchQuery: 'hello', isQueryPending: false, isLoading: false } ) ).toBe(
			'No results found'
		);
	} );
} );
