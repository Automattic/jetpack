import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

describe( 'stateToUrlParams', () => {
	it( 'serializes search query', () => {
		const params = stateToUrlParams( {
			searchQuery: 'boots',
			activeFilters: {},
			sortOrder: 'relevance',
		} );
		expect( params.get( 's' ) ).toBe( 'boots' );
	} );

	it( 'omits empty search query', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			activeFilters: {},
			sortOrder: 'relevance',
		} );
		expect( params.has( 's' ) ).toBe( false );
	} );

	it( 'serializes active filters', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			activeFilters: { category: [ 'news' ] },
			sortOrder: 'relevance',
		} );
		expect( params.get( 'filter[category][]' ) ).toBe( 'news' );
	} );
} );

describe( 'urlParamsToState', () => {
	it( 'reads search query from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 's=cats' ) );
		expect( state.searchQuery ).toBe( 'cats' );
	} );

	it( 'reads filter from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 'filter%5Bcategory%5D%5B%5D=news' ) );
		expect( state.activeFilters.category ).toContain( 'news' );
	} );
} );
