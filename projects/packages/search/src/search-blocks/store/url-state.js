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

// Per-filter URL prefix that controls AND/OR combination for a given filter
// key (e.g. `?query_type_category=and`). Mirrors WooCommerce's
// product-filter-attribute convention so Search 3.0 blocks on a Woo
// storefront stay URL-interoperable with native WC filters.
const QUERY_TYPE_PREFIX = 'query_type_';

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
 * Per-filter AND/OR logic rides alongside as a scalar
 * `?query_type_<filterKey>=and` param — mirrors WC's
 * `woocommerce/product-filter-attribute` URL surface. Only emitted when
 * the filter has selections AND the effective logic is `'and'`; `'or'` is
 * the default and never serialized so URLs stay short. Effective logic is
 * the union of `filterLogic[key]` (URL-derived) and `filterConfigs[key].queryType`
 * (the block author's choice) — without the second source, a block configured
 * with Logic = All would silently never get `query_type_*` into the address
 * bar on visitor interaction, so cross-page shared links would lose the AND
 * semantics.
 *
 * @param {object}      state                       - Store state slice.
 * @param {string}      state.searchQuery           - Current search query.
 * @param {string}      state.sortOrder             - Current sort order.
 * @param {object}      [state.activeFilters]       - { [filterKey]: string[] } selected filters.
 * @param {object}      [state.filterLogic]         - { [filterKey]: 'or' | 'and' } per-filter
 *                                                  AND/OR override. Entries without active
 *                                                  selections are dropped on write.
 * @param {object}      [state.filterConfigs]       - { [filterKey]: FilterConfig } used to
 *                                                  read the block-author-configured `queryType`
 *                                                  so the URL also reflects block config when
 *                                                  `filterLogic` has no override for that key.
 * @param {object|null} [state.priceRange]          - { min, max } price range; either bound may be null.
 * @param {string}      [state.searchParamName]     - URL key the search query is written under
 *                                                  (`s` on the WP search route, `q`
 *                                                  on non-search pages). Defaults to `s`.
 * @param {boolean}     [state.isWooCommerceActive] - Gate for WC-only URL surface
 *                                                  (product-format sort keys + `min_price` /
 *                                                  `max_price` range params). Falsy on non-Woo
 *                                                  sites drops both from the emitted URL.
 * @return {URLSearchParams} URL-ready params.
 */
export function stateToUrlParams( {
	searchQuery,
	sortOrder,
	activeFilters = {},
	filterLogic = {},
	filterConfigs = {},
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
		// Only emit query_type when this filter has selections AND the
		// effective logic is 'and'. Effective = URL override (filterLogic)
		// OR block-author config (filterConfigs[key].queryType). Without the
		// second source a block saved with Logic = All would never get
		// query_type_<key>=and into the URL on visitor interaction, so a
		// shared deep link wouldn't carry the AND semantics.
		const effective = filterLogic?.[ key ] || filterConfigs?.[ key ]?.queryType;
		if ( effective === 'and' ) {
			params.set( `${ QUERY_TYPE_PREFIX }${ key }`, 'and' );
		}
	}

	// `min_price` / `max_price` are WC-only; the price filter block
	// (`filter-wc-price`) isn't registered on non-Woo sites. Skip the
	// write so a stray `priceRange` in store state can't leak into the
	// URL and round-trip back into the next API request as a `range`
	// clause for a field the index doesn't have.
	if ( isWooCommerceActive ) {
		if ( priceRange?.min != null ) {
			params.set( 'min_price', String( priceRange.min ) );
		}
		if ( priceRange?.max != null ) {
			params.set( 'max_price', String( priceRange.max ) );
		}
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
 * @param {boolean}         [isWooCommerceActive] - Gate for WC-only URL surface
 *                                                (product-format sort keys + `min_price` /
 *                                                `max_price` range params). Falsy on non-Woo
 *                                                sites ignores both rather than hydrating
 *                                                them into store state.
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object, filterLogic: object, priceRange: object|null }} Partial state.
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
	const filterLogic = {};
	const hasFilterConfigGate = filterConfigs && Object.keys( filterConfigs ).length > 0;

	for ( const [ rawKey, value ] of params.entries() ) {
		// query_type_<filterKey>=or|and rides alongside the array-shaped
		// filter params. Parse it before the `[]` gate below so the prefix
		// branch can't be missed.
		if ( rawKey.startsWith( QUERY_TYPE_PREFIX ) ) {
			const filterKey = rawKey.slice( QUERY_TYPE_PREFIX.length );
			if ( ! filterKey || RESERVED_PARAMS.has( filterKey ) ) {
				continue;
			}
			if ( hasFilterConfigGate && ! ( filterKey in filterConfigs ) ) {
				continue;
			}
			// AND/OR combination is only meaningful for taxonomy filters —
			// post_type / author each have one value per document, so
			// `query_type_post_types=and` is semantically a no-op. Skipping
			// it here keeps the param from sticking in filterLogic and
			// re-emitting on every URL push thereafter. Mirrors the
			// `filterType === 'taxonomy'` gate in `Filter_Checkbox::normalize_query_type()`.
			if ( hasFilterConfigGate && filterConfigs[ filterKey ]?.filterType !== 'taxonomy' ) {
				continue;
			}
			// 'or' is the default — silently drop it so the gate matches the
			// serializer (which never emits 'or'). Anything that isn't the
			// literal 'and' is treated as garbage and skipped, mirroring
			// `Filter_Checkbox::normalize_query_type()`.
			if ( value === 'and' ) {
				filterLogic[ filterKey ] = 'and';
			}
			continue;
		}
		if ( ! rawKey.endsWith( '[]' ) ) {
			continue;
		}
		const filterKey = rawKey.slice( 0, -2 );
		if ( RESERVED_PARAMS.has( filterKey ) ) {
			continue;
		}
		if ( hasFilterConfigGate && ! ( filterKey in filterConfigs ) ) {
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

	// Drop filterLogic entries whose filter has no active selections.
	// A stray `?query_type_category=and` without `?category[]=...` would
	// otherwise leak back through the next serializer call.
	for ( const key of Object.keys( filterLogic ) ) {
		if ( ! activeFilters[ key ] || activeFilters[ key ].length === 0 ) {
			delete filterLogic[ key ];
		}
	}

	// Mirror `Search_Blocks::parse_url_price_range()`: drop `min_price` /
	// `max_price` entirely on non-Woo sites so a stray deep link can't
	// hydrate `priceRange` into the store and re-emit the params on the
	// next URL push.
	const minPrice = isWooCommerceActive ? parsePriceBound( params.get( 'min_price' ) ) : null;
	const maxPrice = isWooCommerceActive ? parsePriceBound( params.get( 'max_price' ) ) : null;
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
		filterLogic,
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
 * @param {boolean} [isWooCommerceActive] - Gate for WC-only URL surface (product-format
 *                                        sort keys + `min_price` / `max_price` range params);
 *                                        forwarded to `urlParamsToState`.
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object, filterLogic: object, priceRange: object|null }} Partial state.
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
