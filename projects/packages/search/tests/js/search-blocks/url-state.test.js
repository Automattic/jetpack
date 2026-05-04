import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

describe( 'stateToUrlParams', () => {
	it( 'serializes search query', () => {
		const params = stateToUrlParams( {
			searchQuery: 'boots',
			sortOrder: 'relevance',
		} );
		expect( params.get( 's' ) ).toBe( 'boots' );
	} );

	it( 'preserves empty s= so a refresh stays on the search route', () => {
		// Dropping `s` entirely would push WP back to the front-page route on
		// refresh after the user clears the search input.
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
		} );
		expect( params.has( 's' ) ).toBe( true );
		expect( params.get( 's' ) ).toBe( '' );
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

	it( 'omits product-format sort orders until WooCommerce integration lands (RSM-1082)', () => {
		const params = stateToUrlParams( { searchQuery: '', sortOrder: 'price_asc' } );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );

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

	it( 'serializes priceRange bounds to min_price/max_price', () => {
		const params = stateToUrlParams( {
			searchQuery: 'shoes',
			sortOrder: 'relevance',
			priceRange: { min: 10, max: 50 },
		} );
		expect( params.get( 'min_price' ) ).toBe( '10' );
		expect( params.get( 'max_price' ) ).toBe( '50' );
	} );

	it( 'omits the absent bound when priceRange is half-open', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			priceRange: { min: 10, max: null },
		} );
		expect( params.get( 'min_price' ) ).toBe( '10' );
		expect( params.has( 'max_price' ) ).toBe( false );
	} );

	it( 'omits both price params when priceRange is null', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			priceRange: null,
		} );
		expect( params.has( 'min_price' ) ).toBe( false );
		expect( params.has( 'max_price' ) ).toBe( false );
	} );

	it( 'writes the search query under the configured param name (q on non-search pages)', () => {
		// Off the WP search route the inline blocks switch to `q`
		// so a refresh of `/about/?q=boots` doesn't trigger core's
		// singular 404 path. This verifies the URL writer honours the seed.
		const params = stateToUrlParams( {
			searchQuery: 'boots',
			sortOrder: 'relevance',
			searchParamName: 'q',
		} );
		expect( params.get( 'q' ) ).toBe( 'boots' );
		expect( params.has( 's' ) ).toBe( false );
	} );

	it( 'preserves empty search param so a refresh keeps the inline-search URL shape', () => {
		// Same rationale as the empty-`s` case: dropping the param entirely
		// when the user clears the input would drop the visible URL marker
		// that says "this page is hosting an inline search".
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			searchParamName: 'q',
		} );
		expect( params.has( 'q' ) ).toBe( true );
		expect( params.get( 'q' ) ).toBe( '' );
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

	it( 'collapses product-format URL sort to relevance until WooCommerce integration lands (RSM-1082)', () => {
		const state = urlParamsToState( new URLSearchParams( 'orderby=price_asc' ) );
		expect( state.sortOrder ).toBe( 'relevance' );
	} );

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

describe( 'urlParamsToState: priceRange', () => {
	it( 'returns null priceRange when neither bound is set', () => {
		const state = urlParamsToState( new URLSearchParams() );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'parses min and max into a numeric priceRange', () => {
		const state = urlParamsToState( new URLSearchParams( '?min_price=10&max_price=50' ) );
		expect( state.priceRange ).toEqual( { min: 10, max: 50 } );
	} );

	it( 'allows a half-open range when only one bound is set', () => {
		const state = urlParamsToState( new URLSearchParams( '?min_price=10' ) );
		expect( state.priceRange ).toEqual( { min: 10, max: null } );
	} );

	it( 'rejects garbage URL values so a bad URL cannot zero out results', () => {
		const state = urlParamsToState( new URLSearchParams( '?min_price=abc&max_price=-5' ) );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'rejects partial-numeric values that PHP would parse but JS would not', () => {
		// `(float)"1.5.3"` is 1.5 in PHP but `Number("1.5.3")` is NaN in JS;
		// without the explicit numeric gate on both sides the PHP initial
		// render and the JS hydration would disagree on the parsed value.
		const state = urlParamsToState( new URLSearchParams( '?min_price=1.5.3' ) );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'rejects inverted bounds (min > max) so an empty ES range clause is never sent', () => {
		const state = urlParamsToState( new URLSearchParams( '?min_price=100&max_price=10' ) );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'accepts equal bounds (min === max) as a single-value range', () => {
		const state = urlParamsToState( new URLSearchParams( '?min_price=42&max_price=42' ) );
		expect( state.priceRange ).toEqual( { min: 42, max: 42 } );
	} );

	it( 'accepts min_price=0 (free products are a valid lower bound)', () => {
		const state = urlParamsToState( new URLSearchParams( '?min_price=0' ) );
		expect( state.priceRange ).toEqual( { min: 0, max: null } );
	} );

	it( 'never treats min_price/max_price as filter keys', () => {
		const params = new URLSearchParams();
		params.append( 'min_price[]', '10' );
		params.append( 'max_price[]', '50' );
		const state = urlParamsToState( params );
		expect( state.activeFilters ).toEqual( {} );
	} );
} );

describe( 'urlParamsToState: scalar comma-joined URL fallback', () => {
	it( 'parses comma-joined values for filterConfigs whose urlFormat is `scalar`', () => {
		const state = urlParamsToState(
			new URLSearchParams( '?filter_stock_status=instock,outofstock' ),
			{
				filter_stock_status: { filterType: 'wc_stock_status', urlFormat: 'scalar' },
			}
		);
		expect( state.activeFilters ).toEqual( {
			filter_stock_status: [ 'instock', 'outofstock' ],
		} );
	} );

	it( 'ignores scalar URL form when the filterConfig does not opt in', () => {
		const state = urlParamsToState( new URLSearchParams( '?category=news,sports' ), {
			category: { filterType: 'taxonomy', taxonomy: 'category' },
		} );
		expect( state.activeFilters ).toEqual( {} );
	} );

	it( 'prefers array-form when both shapes are present for the same key', () => {
		const params = new URLSearchParams();
		params.append( 'filter_stock_status[]', 'onbackorder' );
		params.append( 'filter_stock_status', 'instock,outofstock' );
		const state = urlParamsToState( params, {
			filter_stock_status: { filterType: 'wc_stock_status', urlFormat: 'scalar' },
		} );
		expect( state.activeFilters ).toEqual( { filter_stock_status: [ 'onbackorder' ] } );
	} );

	it( 'de-duplicates within the scalar value list', () => {
		const state = urlParamsToState(
			new URLSearchParams( '?filter_stock_status=instock,instock,outofstock' ),
			{
				filter_stock_status: { filterType: 'wc_stock_status', urlFormat: 'scalar' },
			}
		);
		expect( state.activeFilters.filter_stock_status ).toEqual( [ 'instock', 'outofstock' ] );
	} );
} );
