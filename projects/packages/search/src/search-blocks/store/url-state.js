// Mirror `Results_Sort::BASE_SORT_KEYS` / `PRODUCT_SORT_KEYS`. Product
// keys are gated on WooCommerce — only accepted when the caller threads
// `isWooCommerceActive=true` through, so a `?orderby=price_asc` deep link
// on a non-Woo site collapses to relevance instead of being forwarded to
// an API surface that can't honour it.
const BASE_SORT_ORDERS = [ 'relevance', 'newest', 'oldest' ];
const PRODUCT_SORT_ORDERS = [ 'rating_desc', 'price_asc', 'price_desc' ];
const DEFAULT_SORT_ORDER = 'relevance';

/**
 * Sort keys this environment will accept. Mirrors
 * `Results_Sort::get_all_option_keys()` on the PHP side.
 *
 * @param {boolean} isWooCommerceActive - True when WooCommerce is loaded.
 * @return {string[]} Ordered sort keys.
 */
function validSortOrders( isWooCommerceActive ) {
	return isWooCommerceActive ? [ ...BASE_SORT_ORDERS, ...PRODUCT_SORT_ORDERS ] : BASE_SORT_ORDERS;
}

// Default search-query URL key. Used when no per-request name is threaded
// through (tests, callers that don't care about the singular-page case).
// Mirrors `Search_Blocks::get_search_param_name()` on the PHP side: `s` on
// the WP search route, `q` on non-search pages.
const DEFAULT_SEARCH_PARAM = 's';

// Reserved query params — not treated as filter keys on parse. Mirrors the
// allow-list on the PHP side in Search_Blocks::parse_url_filters(). Includes
// both possible search-query keys so neither leaks into `activeFilters`.
const RESERVED_PARAMS = new Set( [ 's', 'q', 'orderby', 'min_price', 'max_price' ] );

/**
 * Parse a `min_price` / `max_price` URL value into a finite number.
 * Returns null on missing, non-numeric, or negative input so a garbage
 * URL can't drive the API into producing zero results.
 *
 * @param {string|null} raw - Raw URL param value.
 * @return {number|null} Parsed number or null.
 */
function parsePriceBound( raw ) {
	if ( raw === null || raw === undefined || raw === '' ) {
		return null;
	}
	const num = Number( raw );
	if ( ! Number.isFinite( num ) || num < 0 ) {
		return null;
	}
	return num;
}

/**
 * Serialize store state to URLSearchParams.
 *
 * Filter keys are written as flat top-level array params
 * (`?category[]=news`), matching the shape instant-search already writes
 * so deep links are interchangeable between the two surfaces and the
 * PHP-side `parse_url_filters()` reads the same contract.
 *
 * @param {object}      state                       - Store state slice.
 * @param {string}      state.searchQuery           - Current search query.
 * @param {string}      state.sortOrder             - Current sort order.
 * @param {object}      [state.activeFilters]       - { [filterKey]: string[] } selected filters.
 * @param {object|null} [state.priceRange]          - { min, max } price range; either bound may be null.
 * @param {string}      [state.searchParamName]     - URL key the search query is written under
 *                                                  (`s` on the WP search route, `q`
 *                                                  on non-search pages). Defaults to `s`.
 * @param {boolean}     [state.isWooCommerceActive] - Gate for product-format sort keys.
 * @return {URLSearchParams} URL-ready params.
 */
export function stateToUrlParams( {
	searchQuery,
	sortOrder,
	activeFilters = {},
	priceRange = null,
	searchParamName = DEFAULT_SEARCH_PARAM,
	isWooCommerceActive = false,
} ) {
	const params = new URLSearchParams();

	// Always emit the search key (even empty) so a refresh keeps WP routed
	// to the search template (or the singular host page on non-search pages).
	// Dropping the param entirely when the user clears the input would push
	// the page back to the front-page route on `/?s=` and silently change
	// URL shape on `/about/?q=`.
	params.set( searchParamName, searchQuery ?? '' );

	const allowedSorts = validSortOrders( isWooCommerceActive );
	if ( sortOrder && sortOrder !== DEFAULT_SORT_ORDER && allowedSorts.includes( sortOrder ) ) {
		params.set( 'orderby', sortOrder );
	}

	for ( const [ key, values ] of Object.entries( activeFilters ) ) {
		if ( ! Array.isArray( values ) || values.length === 0 ) {
			continue;
		}
		values.forEach( value => params.append( `${ key }[]`, value ) );
	}

	if ( priceRange?.min != null ) {
		params.set( 'min_price', String( priceRange.min ) );
	}
	if ( priceRange?.max != null ) {
		params.set( 'max_price', String( priceRange.max ) );
	}

	return params;
}

/**
 * Parse URLSearchParams back into partial store state. Unknown `orderby`
 * values collapse to the default so a garbage URL can't leak into the
 * `<select>` binding or the API request.
 *
 * Filter keys must appear in `filterConfigs` — an unfamiliar `?foo[]=bar` is
 * ignored rather than stored. Without this gate, arbitrary array-shaped query
 * params (e.g. from other plugins) would end up in `activeFilters` and be
 * forwarded to ES with no matching config, so they'd silently drop but still
 * round-trip through the browser URL on every keystroke.
 *
 * @param {URLSearchParams} params                - URL search params.
 * @param {object}          [filterConfigs]       - { [filterKey]: FilterConfig } map used to validate filter keys.
 * @param {string}          [searchParamName]     - URL key to read the search query from
 *                                                (`s` or `q`). Defaults to `s`.
 * @param {boolean}         [isWooCommerceActive] - Gate for product-format sort keys.
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object, priceRange: object|null }} Partial state.
 */
export function urlParamsToState(
	params,
	filterConfigs = {},
	searchParamName = DEFAULT_SEARCH_PARAM,
	isWooCommerceActive = false
) {
	const rawOrderby = params.get( 'orderby' );
	const allowedSorts = validSortOrders( isWooCommerceActive );
	const activeFilters = {};

	for ( const [ rawKey, value ] of params.entries() ) {
		if ( ! rawKey.endsWith( '[]' ) ) {
			continue;
		}
		const filterKey = rawKey.slice( 0, -2 );
		if ( RESERVED_PARAMS.has( filterKey ) ) {
			continue;
		}
		if (
			filterConfigs &&
			Object.keys( filterConfigs ).length > 0 &&
			! ( filterKey in filterConfigs )
		) {
			continue;
		}
		const normalized = String( value ?? '' ).trim();
		if ( ! normalized ) {
			// A bare `?category[]=` round-trips as an empty string and would
			// otherwise produce a term filter with an empty value, effectively
			// zeroing the result set. Drop it before it reaches the store.
			continue;
		}
		if ( ! activeFilters[ filterKey ] ) {
			activeFilters[ filterKey ] = [];
		}
		if ( activeFilters[ filterKey ].includes( normalized ) ) {
			// De-dup within a filter key so `?category[]=news&category[]=news`
			// doesn't double-OR into the ES clause.
			continue;
		}
		activeFilters[ filterKey ].push( normalized );
	}

	const minPrice = parsePriceBound( params.get( 'min_price' ) );
	const maxPrice = parsePriceBound( params.get( 'max_price' ) );
	// Inverted bounds (min > max) build an ES range clause that always
	// matches zero documents, so a URL like `?min_price=100&max_price=10`
	// would render an empty page. Treat that as garbage and drop the range
	// entirely; mirrors parse_url_price_range() on the PHP side.
	const hasInvertedBounds = minPrice !== null && maxPrice !== null && minPrice > maxPrice;
	const priceRange =
		! hasInvertedBounds && ( minPrice !== null || maxPrice !== null )
			? { min: minPrice, max: maxPrice }
			: null;

	return {
		searchQuery: params.get( searchParamName ) ?? '',
		sortOrder: allowedSorts.includes( rawOrderby ) ? rawOrderby : DEFAULT_SORT_ORDER,
		activeFilters,
		priceRange,
	};
}

/**
 * Sync current store state into the browser URL without triggering a page
 * reload. Uses `replaceState` so a debounced search doesn't leave a history
 * entry for every keystroke-group — pressing back goes to the page before
 * search, which matches how most live-search UIs behave. Bookmarking or
 * sharing the URL still captures the current query.
 *
 * @param {object} state - Relevant state slice.
 */
export function pushStateToUrl( state ) {
	const params = stateToUrlParams( state );
	const newUrl = window.location.pathname + ( params.toString() ? `?${ params.toString() }` : '' );
	window.history.replaceState( {}, '', newUrl );
}

/**
 * Read initial state from the current URL.
 *
 * @param {object}  [filterConfigs]       - { [filterKey]: FilterConfig } map used to validate filter keys.
 * @param {string}  [searchParamName]     - URL key the search query lives under (`s` or
 *                                        `q`). Defaults to `s`.
 * @param {boolean} [isWooCommerceActive] - Gate for product-format sort keys.
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object, priceRange: object|null }} Partial state.
 */
export function readStateFromUrl(
	filterConfigs = {},
	searchParamName = DEFAULT_SEARCH_PARAM,
	isWooCommerceActive = false
) {
	return urlParamsToState(
		new URLSearchParams( window.location.search ),
		filterConfigs,
		searchParamName,
		isWooCommerceActive
	);
}
