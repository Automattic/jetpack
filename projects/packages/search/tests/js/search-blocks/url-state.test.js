import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

describe( 'stateToUrlParams', () => {
	it( 'serializes search query', () => {
		const params = stateToUrlParams( {
			searchQuery: 'boots',
			sortOrder: 'relevance',
		} );
		expect( params.get( 's' ) ).toBe( 'boots' );
	} );

	it( 'omits empty search query', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
		} );
		expect( params.has( 's' ) ).toBe( false );
	} );

	it( 'serializes non-default sort order', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'date',
		} );
		expect( params.get( 'orderby' ) ).toBe( 'date' );
	} );

	it( 'omits default sort order', () => {
		const params = stateToUrlParams( {
			searchQuery: 'cats',
			sortOrder: 'relevance',
		} );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );
} );

describe( 'urlParamsToState', () => {
	it( 'reads search query from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 's=cats' ) );
		expect( state.searchQuery ).toBe( 'cats' );
	} );

	it( 'reads sort order from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 'orderby=date' ) );
		expect( state.sortOrder ).toBe( 'date' );
	} );

	it( 'defaults sort order to relevance when absent', () => {
		const state = urlParamsToState( new URLSearchParams( '' ) );
		expect( state.sortOrder ).toBe( 'relevance' );
	} );
} );
