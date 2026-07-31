/**
 * Tests for SEARCH-311: getSearchTitle() must not fall through to
 * "No results found" while a query is pending (isQueryPending) or actually
 * loading (isLoading), regardless of a stale/empty response.total — nor
 * while no search has completed yet at all (e.g. the initial empty response
 * object before any request has been dispatched).
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

describe( 'SearchResults#getSearchTitle — isQueryPending / isLoading', () => {
	it( 'shows "No results found" when a search has actually completed with total 0', () => {
		expect( titleFor( { response: { total: 0 } } ) ).toBe( 'No results found' );
	} );

	// These four use a completed `{ total: 0 }` response (rather than the
	// default `{}`) so the loading branch is exercised only via the flag
	// under test, not incidentally via hasCompletedSearch being false too.
	it( 'shows "Searching…" while isQueryPending is true, even with a stale zero-result response', () => {
		expect(
			titleFor( { searchQuery: 'hello', response: { total: 0 }, isQueryPending: true } )
		).toBe( 'Searching…' );
	} );

	it( 'shows "Loading popular results…" while isQueryPending is true with no query', () => {
		expect( titleFor( { searchQuery: '', response: { total: 0 }, isQueryPending: true } ) ).toBe(
			'Loading popular results…'
		);
	} );

	it( 'still shows "Searching…" while isLoading is true (existing behavior)', () => {
		expect( titleFor( { searchQuery: 'hello', response: { total: 0 }, isLoading: true } ) ).toBe(
			'Searching…'
		);
	} );

	it( 'falls through to "No results found" once neither pending nor loading, with a completed empty response', () => {
		expect(
			titleFor( {
				searchQuery: 'hello',
				response: { total: 0 },
				isQueryPending: false,
				isLoading: false,
			} )
		).toBe( 'No results found' );
	} );
} );

describe( 'SearchResults#getSearchTitle — no search has completed yet', () => {
	it( 'shows "Loading popular results…" for the initial empty response, not "No results found"', () => {
		expect(
			titleFor( { searchQuery: '', response: {}, isQueryPending: false, isLoading: false } )
		).toBe( 'Loading popular results…' );
	} );

	it( 'shows "Searching…" for the initial empty response with a query, not "No results found"', () => {
		expect(
			titleFor( { searchQuery: 'hello', response: {}, isQueryPending: false, isLoading: false } )
		).toBe( 'Searching…' );
	} );

	it( 'shows "Loading popular results…", not "Searching…", when searchQuery is null (its real initial value, not "")', () => {
		expect(
			titleFor( { searchQuery: null, response: {}, isQueryPending: false, isLoading: false } )
		).toBe( 'Loading popular results…' );
	} );

	it( 'still shows "No results found" for an empty response when hasError is true', () => {
		expect(
			titleFor( {
				searchQuery: 'hello',
				response: {},
				hasError: true,
				isQueryPending: false,
				isLoading: false,
			} )
		).toBe( 'No results found' );
	} );
} );
