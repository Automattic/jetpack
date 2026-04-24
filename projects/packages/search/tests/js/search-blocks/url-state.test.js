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
			sortOrder: 'newest',
		} );
		expect( params.get( 'orderby' ) ).toBe( 'newest' );
	} );

	it( 'omits default sort order', () => {
		const params = stateToUrlParams( {
			searchQuery: 'cats',
			sortOrder: 'relevance',
		} );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );

	it.each( [ 'rating_desc', 'price_asc', 'price_desc' ] )(
		'omits product-format sort order %s until WooCommerce integration lands',
		sortOrder => {
			// Product-format keys are tracked for reintroduction in RSM-1082.
			// Until then they are *not* in `VALID_SORT_ORDERS`, so the store
			// must not serialize them — a shared link carrying one should
			// collapse to relevance on the receiver.
			const params = stateToUrlParams( { searchQuery: '', sortOrder } );
			expect( params.has( 'orderby' ) ).toBe( false );
		}
	);

	it( 'omits unknown sort orders', () => {
		const params = stateToUrlParams( { searchQuery: '', sortOrder: 'bogus' } );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );

	it( 'serializes active filters as flat top-level array params', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			activeFilters: { category: [ 'news', 'sports' ], post_types: [ 'post' ] },
		} );
		expect( params.getAll( 'category[]' ) ).toEqual( [ 'news', 'sports' ] );
		expect( params.getAll( 'post_types[]' ) ).toEqual( [ 'post' ] );
	} );

	it( 'skips filters with empty value arrays', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			activeFilters: { category: [], authors: [ 'jane' ] },
		} );
		expect( params.has( 'category[]' ) ).toBe( false );
		expect( params.getAll( 'authors[]' ) ).toEqual( [ 'jane' ] );
	} );
} );

describe( 'urlParamsToState', () => {
	it( 'reads search query from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 's=cats' ) );
		expect( state.searchQuery ).toBe( 'cats' );
	} );

	it( 'reads sort order from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 'orderby=newest' ) );
		expect( state.sortOrder ).toBe( 'newest' );
	} );

	it( 'defaults sort order to relevance when absent', () => {
		const state = urlParamsToState( new URLSearchParams( '' ) );
		expect( state.sortOrder ).toBe( 'relevance' );
	} );

	it.each( [ 'rating_desc', 'price_asc', 'price_desc' ] )(
		'collapses product-format sort order %s to relevance until WooCommerce integration lands',
		sortOrder => {
			// Mirror of the serializer guard — see RSM-1082. A deep link carrying
			// one of these keys today must not hydrate into the store; the PR
			// that adds WooCommerce support will flip both checks back.
			const state = urlParamsToState( new URLSearchParams( `orderby=${ sortOrder }` ) );
			expect( state.sortOrder ).toBe( 'relevance' );
		}
	);

	it( 'collapses unknown sort order to relevance', () => {
		const state = urlParamsToState( new URLSearchParams( 'orderby=bogus' ) );
		expect( state.sortOrder ).toBe( 'relevance' );
	} );

	it( 'parses filter array params into activeFilters when filterConfigs gate allows them', () => {
		const params = new URLSearchParams();
		params.append( 'category[]', 'news' );
		params.append( 'category[]', 'sports' );
		params.append( 'post_types[]', 'post' );
		const state = urlParamsToState( params, {
			category: { filterType: 'taxonomy', taxonomy: 'category' },
			post_types: { filterType: 'post_type' },
		} );
		expect( state.activeFilters ).toEqual( {
			category: [ 'news', 'sports' ],
			post_types: [ 'post' ],
		} );
	} );

	it( 'drops filter keys that are not registered in filterConfigs', () => {
		// Without a gate, an unfamiliar `?foo[]=bar` (e.g. from an unrelated
		// plugin) would slip into activeFilters, be forwarded to ES with no
		// matching config, and silently round-trip through the browser URL.
		const params = new URLSearchParams();
		params.append( 'mystery[]', 'x' );
		params.append( 'category[]', 'news' );
		const state = urlParamsToState( params, {
			category: { filterType: 'taxonomy', taxonomy: 'category' },
		} );
		expect( state.activeFilters ).toEqual( { category: [ 'news' ] } );
	} );

	it( 'accepts all keys when no filterConfigs gate is supplied', () => {
		const params = new URLSearchParams();
		params.append( 'foo[]', 'bar' );
		const state = urlParamsToState( params );
		expect( state.activeFilters ).toEqual( { foo: [ 'bar' ] } );
	} );

	it( 'never treats reserved params like `s` or `orderby` as filters', () => {
		const params = new URLSearchParams();
		params.append( 's[]', 'boots' );
		params.append( 'orderby[]', 'newest' );
		const state = urlParamsToState( params );
		expect( state.activeFilters ).toEqual( {} );
	} );

	it( 'drops empty and whitespace-only filter values', () => {
		// A bare `?category[]=` (or a stray trailing space) would otherwise
		// produce a term filter with an empty value and zero out the result
		// set. The mix here keeps the valid value so the key still surfaces.
		const params = new URLSearchParams();
		params.append( 'category[]', '' );
		params.append( 'category[]', '   ' );
		params.append( 'category[]', 'news' );
		const state = urlParamsToState( params );
		expect( state.activeFilters ).toEqual( { category: [ 'news' ] } );
	} );

	it( 'omits a filter key entirely when every value is empty', () => {
		const params = new URLSearchParams();
		params.append( 'category[]', '' );
		const state = urlParamsToState( params );
		expect( state.activeFilters ).toEqual( {} );
	} );

	it( 'de-duplicates repeated values within a single filter key', () => {
		const params = new URLSearchParams();
		params.append( 'category[]', 'news' );
		params.append( 'category[]', 'news' );
		params.append( 'category[]', 'sports' );
		const state = urlParamsToState( params );
		expect( state.activeFilters ).toEqual( { category: [ 'news', 'sports' ] } );
	} );
} );
