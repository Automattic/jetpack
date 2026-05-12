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

	it( 'omits product-format sort orders on non-WooCommerce sites (RSM-1082)', () => {
		const params = stateToUrlParams( { searchQuery: '', sortOrder: 'price_asc' } );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );

	it( 'serializes product-format sort orders when isWooCommerceActive is true (RSM-1082)', () => {
		for ( const key of [ 'rating_desc', 'price_asc', 'price_desc' ] ) {
			const params = stateToUrlParams( {
				searchQuery: '',
				sortOrder: key,
				isWooCommerceActive: true,
			} );
			expect( params.get( 'orderby' ) ).toBe( key );
		}
	} );

	it( 'omits unknown sort orders', () => {
		const params = stateToUrlParams( { searchQuery: '', sortOrder: 'bogus' } );
		expect( params.has( 'orderby' ) ).toBe( false );
	} );

	it( 'still rejects unknown sort orders even when isWooCommerceActive is true', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'bogus',
			isWooCommerceActive: true,
		} );
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

	it( 'serializes priceRange bounds to min_price/max_price on Woo sites', () => {
		const params = stateToUrlParams( {
			searchQuery: 'shoes',
			sortOrder: 'relevance',
			priceRange: { min: 10, max: 50 },
			isWooCommerceActive: true,
		} );
		expect( params.get( 'min_price' ) ).toBe( '10' );
		expect( params.get( 'max_price' ) ).toBe( '50' );
	} );

	it( 'omits the absent bound when priceRange is half-open', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			priceRange: { min: 10, max: null },
			isWooCommerceActive: true,
		} );
		expect( params.get( 'min_price' ) ).toBe( '10' );
		expect( params.has( 'max_price' ) ).toBe( false );
	} );

	it( 'omits both price params when priceRange is null', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			priceRange: null,
			isWooCommerceActive: true,
		} );
		expect( params.has( 'min_price' ) ).toBe( false );
		expect( params.has( 'max_price' ) ).toBe( false );
	} );

	it( 'omits min_price/max_price entirely on non-Woo sites (RSM-2805)', () => {
		// `filter-wc-price` isn't registered on non-Woo sites, so a stray
		// `priceRange` in store state must not leak into the URL — otherwise
		// the next API request would carry a `range` clause for a field the
		// index doesn't have. Mirrors the PHP-side gate in
		// Search_Blocks::parse_url_price_range().
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			priceRange: { min: 10, max: 50 },
			isWooCommerceActive: false,
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
		expect( state.hasSearchParam ).toBe( true );
	} );

	it( 'reports hasSearchParam=true for `?s=` (empty value) — distinguishes a blank search from a missing param (SEARCH-183)', () => {
		const state = urlParamsToState( new URLSearchParams( 's=' ) );
		expect( state.searchQuery ).toBe( '' );
		expect( state.hasSearchParam ).toBe( true );
	} );

	it( 'reports hasSearchParam=false when the search key is absent', () => {
		const state = urlParamsToState( new URLSearchParams( '' ) );
		expect( state.searchQuery ).toBe( '' );
		expect( state.hasSearchParam ).toBe( false );
	} );

	it( 'reads hasSearchParam against the threaded `searchParamName` (`q` off the search route)', () => {
		const present = urlParamsToState( new URLSearchParams( 'q=' ), {}, 'q' );
		expect( present.hasSearchParam ).toBe( true );
		// Stray `s` on a non-search route doesn't satisfy the `q` gate.
		const absent = urlParamsToState( new URLSearchParams( 's=stray' ), {}, 'q' );
		expect( absent.hasSearchParam ).toBe( false );
	} );

	it( 'reads sort order from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 'orderby=newest' ) );
		expect( state.sortOrder ).toBe( 'newest' );
	} );

	it( 'defaults sort order to relevance when absent', () => {
		const state = urlParamsToState( new URLSearchParams( '' ) );
		expect( state.sortOrder ).toBe( 'relevance' );
	} );

	it( 'collapses product-format URL sort to relevance on non-WooCommerce sites (RSM-1082)', () => {
		const state = urlParamsToState( new URLSearchParams( 'orderby=price_asc' ) );
		expect( state.sortOrder ).toBe( 'relevance' );
	} );

	it( 'admits product-format URL sort when isWooCommerceActive is true (RSM-1082)', () => {
		for ( const key of [ 'rating_desc', 'price_asc', 'price_desc' ] ) {
			const state = urlParamsToState( new URLSearchParams( `orderby=${ key }` ), {}, 's', true );
			expect( state.sortOrder ).toBe( key );
		}
	} );

	it( 'still collapses unknown sort to relevance even when isWooCommerceActive is true', () => {
		const state = urlParamsToState( new URLSearchParams( 'orderby=bogus' ), {}, 's', true );
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

	it( 'rejects array-shaped `s` and `q` even when a real filter sits alongside them', () => {
		// Both URL keys the inline blocks may use (`s` on the search route,
		// `q` off it) must be reserved on the JS side so a hostile or
		// malformed `?s[]=…&q[]=…` can't smuggle the search query into
		// `activeFilters` (where it would be re-emitted as a filter clause
		// to the API and round-tripped back into the URL on every keystroke).
		// The real filter alongside them proves the rest of the parser is
		// still working — i.e. the reservation gate is surgical, not a
		// side effect of an unrelated rejection earlier in the loop.
		const params = new URLSearchParams();
		params.append( 's[]', 'ignored' );
		params.append( 'q[]', 'ignored' );
		params.append( 'category[]', 'news' );
		const state = urlParamsToState( params, {
			category: { filterType: 'taxonomy', taxonomy: 'category' },
		} );
		expect( state.activeFilters ).toEqual( { category: [ 'news' ] } );
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

describe( 'filterLogic round-trip (RSM-2815)', () => {
	const taxonomyConfig = { filterType: 'taxonomy', taxonomy: 'category' };

	it( 'stateToUrlParams emits query_type_<key>=and when the filter has selections and logic is `and`', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			activeFilters: { category: [ 'news', 'sports' ] },
			filterLogic: { category: 'and' },
		} );
		expect( params.get( 'query_type_category' ) ).toBe( 'and' );
	} );

	it( 'stateToUrlParams emits query_type_<key>=and when filterConfigs has queryType `and` (block-author config)', () => {
		// filterLogic is only seeded from the URL; the block-author choice
		// lives in filterConfigs. Without this source the URL would never
		// emit query_type_* for a block configured with Logic = All, so a
		// shared deep link couldn't carry the AND semantics across pages.
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			activeFilters: { category: [ 'news', 'sports' ] },
			filterLogic: {},
			filterConfigs: {
				category: { filterType: 'taxonomy', taxonomy: 'category', queryType: 'and' },
			},
		} );
		expect( params.get( 'query_type_category' ) ).toBe( 'and' );
	} );

	it( 'stateToUrlParams omits query_type_<key> when logic is the default `or`', () => {
		// `or` is the default; serializing it would only bloat URLs and
		// invite encoded-URL diff churn in tests of unrelated features.
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			activeFilters: { category: [ 'news', 'sports' ] },
			filterLogic: { category: 'or' },
		} );
		expect( params.has( 'query_type_category' ) ).toBe( false );
	} );

	it( 'stateToUrlParams omits query_type_<key> when the filter has no active selections', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			sortOrder: 'relevance',
			activeFilters: {},
			filterLogic: { category: 'and' },
		} );
		expect( params.has( 'query_type_category' ) ).toBe( false );
	} );

	it( 'urlParamsToState parses ?category[]=…&query_type_category=and into both slices', () => {
		const params = new URLSearchParams();
		params.append( 'category[]', 'news' );
		params.append( 'query_type_category', 'and' );
		const state = urlParamsToState( params, { category: taxonomyConfig } );
		expect( state.activeFilters ).toEqual( { category: [ 'news' ] } );
		expect( state.filterLogic ).toEqual( { category: 'and' } );
	} );

	it( 'urlParamsToState drops query_type_<key> when <key> is not registered', () => {
		const params = new URLSearchParams();
		params.append( 'category[]', 'news' );
		params.append( 'query_type_mystery', 'and' );
		const state = urlParamsToState( params, { category: taxonomyConfig } );
		expect( state.filterLogic ).toEqual( {} );
	} );

	it( 'urlParamsToState drops query_type_<key> when <key> targets a non-taxonomy filter', () => {
		// post_type / author have one value per document, so AND combination
		// is semantically meaningless. Without this gate a stray
		// `query_type_post_types=and` would linger in filterLogic and re-emit
		// on every URL push.
		const params = new URLSearchParams();
		params.append( 'post_types[]', 'post' );
		params.append( 'query_type_post_types', 'and' );
		const state = urlParamsToState( params, { post_types: { filterType: 'post_type' } } );
		expect( state.activeFilters ).toEqual( { post_types: [ 'post' ] } );
		expect( state.filterLogic ).toEqual( {} );
	} );

	it( 'urlParamsToState drops query_type_<key> with a non-`and` value (only `and` is honoured)', () => {
		const params = new URLSearchParams();
		params.append( 'category[]', 'news' );
		params.append( 'query_type_category', 'banana' );
		const state = urlParamsToState( params, { category: taxonomyConfig } );
		expect( state.filterLogic ).toEqual( {} );
	} );

	it( 'urlParamsToState drops query_type_<key> when its filter has no surviving active selections', () => {
		// Without this gate a `?query_type_category=and` without `?category[]=…`
		// would leak through and re-emit on the next URL push.
		const params = new URLSearchParams();
		params.append( 'query_type_category', 'and' );
		const state = urlParamsToState( params, { category: taxonomyConfig } );
		expect( state.filterLogic ).toEqual( {} );
	} );

	it( 'urlParamsToState ignores query_type_<key> targeting a reserved param', () => {
		const params = new URLSearchParams( 'query_type_orderby=and' );
		const state = urlParamsToState( params );
		expect( state.filterLogic ).toEqual( {} );
	} );
} );

describe( 'urlParamsToState: priceRange', () => {
	// All priceRange-parsing tests opt into `isWooCommerceActive=true` to
	// exercise the parsing logic; the WC-off behaviour (price params are
	// dropped entirely) is covered separately in the next describe block.
	const wcOn = ( params, filterConfigs = {} ) =>
		urlParamsToState( params, filterConfigs, 's', true );

	it( 'returns null priceRange when neither bound is set', () => {
		const state = wcOn( new URLSearchParams() );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'parses min and max into a numeric priceRange', () => {
		const state = wcOn( new URLSearchParams( '?min_price=10&max_price=50' ) );
		expect( state.priceRange ).toEqual( { min: 10, max: 50 } );
	} );

	it( 'allows a half-open range when only one bound is set', () => {
		const state = wcOn( new URLSearchParams( '?min_price=10' ) );
		expect( state.priceRange ).toEqual( { min: 10, max: null } );
	} );

	it( 'rejects garbage URL values so a bad URL cannot zero out results', () => {
		const state = wcOn( new URLSearchParams( '?min_price=abc&max_price=-5' ) );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'rejects partial-numeric values that PHP would parse but JS would not', () => {
		// `(float)"1.5.3"` is 1.5 in PHP but `Number("1.5.3")` is NaN in JS;
		// without the explicit numeric gate on both sides the PHP initial
		// render and the JS hydration would disagree on the parsed value.
		const state = wcOn( new URLSearchParams( '?min_price=1.5.3' ) );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'rejects inverted bounds (min > max) so an empty ES range clause is never sent', () => {
		const state = wcOn( new URLSearchParams( '?min_price=100&max_price=10' ) );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'accepts equal bounds (min === max) as a single-value range', () => {
		const state = wcOn( new URLSearchParams( '?min_price=42&max_price=42' ) );
		expect( state.priceRange ).toEqual( { min: 42, max: 42 } );
	} );

	it( 'accepts min_price=0 (free products are a valid lower bound)', () => {
		const state = wcOn( new URLSearchParams( '?min_price=0' ) );
		expect( state.priceRange ).toEqual( { min: 0, max: null } );
	} );

	it( 'never treats min_price/max_price as filter keys', () => {
		const params = new URLSearchParams();
		params.append( 'min_price[]', '10' );
		params.append( 'max_price[]', '50' );
		const state = wcOn( params );
		expect( state.activeFilters ).toEqual( {} );
	} );
} );

describe( 'urlParamsToState: priceRange WooCommerce gate (RSM-2805)', () => {
	it( 'drops min_price/max_price entirely on non-Woo sites', () => {
		// A stray `?min_price=10&max_price=50` deep link must not seed the
		// `priceRange` slice on a non-Woo site — `filter-wc-price` isn't
		// registered there, so admitting the params would build a `range`
		// clause against an index field that doesn't exist, *and* round-
		// trip the params back into the URL on every URL push.
		const state = urlParamsToState( new URLSearchParams( '?min_price=10&max_price=50' ) );
		expect( state.priceRange ).toBeNull();
	} );

	it( 'still admits price params when isWooCommerceActive is true', () => {
		const state = urlParamsToState(
			new URLSearchParams( '?min_price=10&max_price=50' ),
			{},
			's',
			true
		);
		expect( state.priceRange ).toEqual( { min: 10, max: 50 } );
	} );
} );
