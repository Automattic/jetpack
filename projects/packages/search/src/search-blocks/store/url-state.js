// Mirror `Results_Sort::BASE_SORT_KEYS` / `PRODUCT_SORT_KEYS`. Product keys
// are gated on `isWooCommerceBlocksEnabled` so a `?orderby=price_asc` deep
// link on a non-Woo site collapses to relevance.
const BASE_SORT_ORDERS = [ 'relevance', 'newest', 'oldest' ];
const PRODUCT_SORT_ORDERS = [ 'rating_desc', 'price_asc', 'price_desc' ];
const DEFAULT_SORT_ORDER = 'relevance';

/**
 * Sort keys this environment accepts. Mirrors `Results_Sort::get_all_option_keys()`.
 *
 * @param {boolean} isWooCommerceBlocksEnabled - True when WC is loaded.
 * @return {string[]} Ordered sort keys.
 */
function validSortOrders( isWooCommerceBlocksEnabled ) {
	return isWooCommerceBlocksEnabled
		? [ ...BASE_SORT_ORDERS, ...PRODUCT_SORT_ORDERS ]
		: BASE_SORT_ORDERS;
}

// Default search-query URL key. Mirrors `Search_Blocks::get_search_param_name()`
// — `s` on the WP search route, `q` on non-search pages.
const DEFAULT_SEARCH_PARAM = 's';

// Reserved params; not treated as filter keys. Mirrors PHP `RESERVED_QUERY_PARAMS`.
// Note: `post_type` is NOT reserved — it's read as a scalar alias for
// `?post_types[]=` (matches WP/WC convention) in `urlParamsToState` below.
const RESERVED_PARAMS = new Set( [ 's', 'q', 'orderby', 'min_price', 'max_price' ] );

// Per-filter AND/OR override prefix (`?query_type_category=and`). Mirrors
// WooCommerce's `product-filter-attribute` convention.
const QUERY_TYPE_PREFIX = 'query_type_';

// Scalar params Search *reads* but never *writes* (`urlParamsToState` consumes
// them; `stateToUrlParams` emits the array form instead). Listed so the close
// stripper can clear them — the writer-shape detection alone would miss them.
const READ_ALIAS_PARAMS = new Set( [ 'post_type' ] );

/**
 * Parse `min_price`/`max_price` into a finite non-negative number or null.
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
 * Serialize store state to URLSearchParams. See AGENTS.md § URL format.
 *
 * Per-filter AND/OR rides as `?query_type_<key>=and`. Emitted only when the
 * filter has selections AND the effective logic is `'and'` — effective = URL
 * override OR block-author config (`filterConfigs[key].queryType`), so a
 * block configured Logic = All still serializes the AND semantics into
 * shared deep links on first visitor interaction.
 *
 * @param {object}      state                              - Store state slice.
 * @param {string}      state.searchQuery                  - Current search query.
 * @param {string}      state.sortOrder                    - Current sort order.
 * @param {object}      [state.activeFilters]              - { [filterKey]: string[] }.
 * @param {object}      [state.filterLogic]                - { [filterKey]: 'or'|'and' } URL overrides.
 * @param {object}      [state.filterConfigs]              - { [filterKey]: FilterConfig }; supplies
 *                                                         block-author `queryType` + the static-filter gate.
 * @param {object|null} [state.priceRange]                 - `{ min, max }`; either may be null.
 * @param {object}      [state.staticFilterSelections]     - Scalar `?filter_id=value` (legacy contract).
 * @param {string}      [state.searchParamName]            - `s` or `q`. Defaults to `s`.
 * @param {boolean}     [state.isWooCommerceBlocksEnabled] - Gate for WC-only URL surface.
 * @return {URLSearchParams} URL-ready params.
 */
export function stateToUrlParams( {
	searchQuery,
	sortOrder,
	activeFilters = {},
	filterLogic = {},
	filterConfigs = {},
	priceRange = null,
	staticFilterSelections = {},
	searchParamName = DEFAULT_SEARCH_PARAM,
	isWooCommerceBlocksEnabled = false,
} ) {
	const params = new URLSearchParams();

	// Always emit the search key (even empty) so refresh stays on the same
	// route. Dropping it would punt `/?s=` to the front page and silently
	// change URL shape on `/about/?q=`.
	params.set( searchParamName, searchQuery ?? '' );

	const allowedSorts = validSortOrders( isWooCommerceBlocksEnabled );
	if ( sortOrder && sortOrder !== DEFAULT_SORT_ORDER && allowedSorts.includes( sortOrder ) ) {
		params.set( 'orderby', sortOrder );
	}

	for ( const [ key, values ] of Object.entries( activeFilters ) ) {
		if ( ! Array.isArray( values ) || values.length === 0 ) {
			continue;
		}
		values.forEach( value => params.append( `${ key }[]`, value ) );
		const effective = filterLogic?.[ key ] || filterConfigs?.[ key ]?.queryType;
		if ( effective === 'and' ) {
			params.set( `${ QUERY_TYPE_PREFIX }${ key }`, 'and' );
		}
	}

	// `min_price` / `max_price` are WC-only; skip the write so a stray
	// `priceRange` can't round-trip into a `range` clause for a non-existent ES field.
	if ( isWooCommerceBlocksEnabled ) {
		if ( priceRange?.min != null ) {
			params.set( 'min_price', String( priceRange.min ) );
		}
		if ( priceRange?.max != null ) {
			params.set( 'max_price', String( priceRange.max ) );
		}
	}

	// Static filters write scalar `?filter_id=value` (legacy overlay contract).
	// Gated on `kind === 'static'` so a stale selection for a since-unregistered
	// filter can't leak back. RESERVED_PARAMS check mirrors the reader.
	for ( const [ key, value ] of Object.entries( staticFilterSelections ) ) {
		if ( ! value || RESERVED_PARAMS.has( key ) || filterConfigs?.[ key ]?.kind !== 'static' ) {
			continue;
		}
		params.set( key, String( value ) );
	}

	return params;
}

/**
 * Parse URLSearchParams back into partial store state. Unknown `orderby`
 * collapses to default; filter keys must appear in `filterConfigs` (without
 * the gate, arbitrary `?foo[]=bar` from other plugins would round-trip).
 *
 * @param {URLSearchParams} params                       - URL search params.
 * @param {object}          [filterConfigs]              - Validate filter keys against this.
 * @param {string}          [searchParamName]            - `s` or `q`.
 * @param {boolean}         [isWooCommerceBlocksEnabled] - WC URL-surface gate.
 * @return {{ searchQuery: string, hasSearchParam: boolean, sortOrder: string, activeFilters: object, filterLogic: object, priceRange: object|null, staticFilterSelections: object }} Partial state.
 */
export function urlParamsToState(
	params,
	filterConfigs = {},
	searchParamName = DEFAULT_SEARCH_PARAM,
	isWooCommerceBlocksEnabled = false
) {
	const rawOrderby = params.get( 'orderby' );
	const allowedSorts = validSortOrders( isWooCommerceBlocksEnabled );
	const activeFilters = {};
	const filterLogic = {};
	const staticFilterSelections = {};
	const hasFilterConfigGate = filterConfigs && Object.keys( filterConfigs ).length > 0;

	for ( const [ rawKey, value ] of params.entries() ) {
		// `query_type_<key>` runs before the `[]` gate so the prefix can't be missed.
		if ( rawKey.startsWith( QUERY_TYPE_PREFIX ) ) {
			const filterKey = rawKey.slice( QUERY_TYPE_PREFIX.length );
			if ( ! filterKey || RESERVED_PARAMS.has( filterKey ) ) {
				continue;
			}
			if ( hasFilterConfigGate && ! ( filterKey in filterConfigs ) ) {
				continue;
			}
			// AND/OR is meaningful only for taxonomy filters — post_type/author
			// each carry one value per doc. Mirrors `Filter_Checkbox::normalize_query_type()`.
			if ( hasFilterConfigGate && filterConfigs[ filterKey ]?.filterType !== 'taxonomy' ) {
				continue;
			}
			// Drop `'or'` (default, never serialized) and anything that isn't literal `'and'`.
			if ( value === 'and' ) {
				filterLogic[ filterKey ] = 'and';
			}
			continue;
		}
		// Scalar param: a static-filter selection, the `?post_type=<slug>`
		// alias for `?post_types[]=<slug>` (WP/WC convention), or ignored noise.
		if ( ! rawKey.endsWith( '[]' ) ) {
			if ( rawKey === 'post_type' ) {
				const slug = String( value ?? '' ).trim();
				if ( ! slug ) {
					continue;
				}
				if ( hasFilterConfigGate && ! ( 'post_types' in filterConfigs ) ) {
					continue;
				}
				if ( ! activeFilters.post_types ) {
					activeFilters.post_types = [];
				}
				if ( ! activeFilters.post_types.includes( slug ) ) {
					activeFilters.post_types.push( slug );
				}
				continue;
			}
			if (
				hasFilterConfigGate &&
				! RESERVED_PARAMS.has( rawKey ) &&
				filterConfigs[ rawKey ]?.kind === 'static'
			) {
				// Last-write wins on `?section=a&section=b` (already malformed
				// for single-select; mirror the radio change handler).
				const normalized = String( value ?? '' ).trim();
				if ( normalized ) {
					staticFilterSelections[ rawKey ] = normalized;
				}
			}
			continue;
		}

		// Array-shaped dynamic facet.
		const filterKey = rawKey.slice( 0, -2 );
		if ( RESERVED_PARAMS.has( filterKey ) ) {
			continue;
		}
		if ( hasFilterConfigGate && ! ( filterKey in filterConfigs ) ) {
			continue;
		}
		const normalized = String( value ?? '' ).trim();
		if ( ! normalized ) {
			// `?category[]=` would otherwise build a term filter with empty value.
			continue;
		}
		if ( ! activeFilters[ filterKey ] ) {
			activeFilters[ filterKey ] = [];
		}
		if ( activeFilters[ filterKey ].includes( normalized ) ) {
			continue;
		}
		activeFilters[ filterKey ].push( normalized );
	}

	// Drop logic entries whose filter has no surviving selections.
	for ( const key of Object.keys( filterLogic ) ) {
		if ( ! activeFilters[ key ] || activeFilters[ key ].length === 0 ) {
			delete filterLogic[ key ];
		}
	}

	// `min_price`/`max_price` are WC-only; drop entirely on non-Woo sites so
	// a stray deep link can't re-emit the params on the next URL push.
	const minPrice = isWooCommerceBlocksEnabled ? parsePriceBound( params.get( 'min_price' ) ) : null;
	const maxPrice = isWooCommerceBlocksEnabled ? parsePriceBound( params.get( 'max_price' ) ) : null;
	// Inverted bounds build a zero-result ES range — treat as garbage.
	const hasInvertedBounds = minPrice !== null && maxPrice !== null && minPrice > maxPrice;
	const priceRange =
		! hasInvertedBounds && ( minPrice !== null || maxPrice !== null )
			? { min: minPrice, max: maxPrice }
			: null;

	return {
		searchQuery: params.get( searchParamName ) ?? '',
		// `params.has()` distinguishes `?s=` (present, empty) from a URL with
		// no `s` — the store gates the initial fetch on this.
		hasSearchParam: params.has( searchParamName ),
		sortOrder: allowedSorts.includes( rawOrderby ) ? rawOrderby : DEFAULT_SORT_ORDER,
		activeFilters,
		filterLogic,
		priceRange,
		staticFilterSelections,
	};
}

/**
 * Identify URL params owned by Search Blocks state. Used when leaving the
 * search experience (overlay close) to clear the URL the same way legacy
 * Instant Search's `restorePreviousHref()` does — strip everything Search
 * reads, not only what it writes. We identify those params by the reserved
 * set, the URL shapes the writer (`stateToUrlParams`) emits — array-suffixed
 * and `query_type_`-prefixed — and the read-only scalar aliases the reader
 * consumes (`post_type`), which together cover every key the store round-trips.
 *
 * Static filter scalars are not stripped here: they share `?key=value` shape
 * with arbitrary non-search params and the bootstrap has no filter registry to
 * disambiguate.
 *
 * @param {URLSearchParams} params - URL params to scan.
 * @return {string[]} Unique keys present in `params` that Search owns.
 */
export function getSearchOwnedParamKeys( params ) {
	const owned = new Set();
	for ( const rawKey of params.keys() ) {
		if (
			RESERVED_PARAMS.has( rawKey ) ||
			READ_ALIAS_PARAMS.has( rawKey ) ||
			rawKey.startsWith( QUERY_TYPE_PREFIX ) ||
			rawKey.endsWith( '[]' )
		) {
			owned.add( rawKey );
		}
	}
	return Array.from( owned );
}

/**
 * Sync state into the browser URL via `replaceState` so debounced typing
 * doesn't pile up history entries. Back navigates to the page before search.
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
 * @param {object}  [filterConfigs]              - Validate filter keys against this.
 * @param {string}  [searchParamName]            - `s` or `q`.
 * @param {boolean} [isWooCommerceBlocksEnabled] - WC URL-surface gate.
 * @return {{ searchQuery: string, hasSearchParam: boolean, sortOrder: string, activeFilters: object, filterLogic: object, priceRange: object|null, staticFilterSelections: object }} Partial state.
 */
export function readStateFromUrl(
	filterConfigs = {},
	searchParamName = DEFAULT_SEARCH_PARAM,
	isWooCommerceBlocksEnabled = false
) {
	return urlParamsToState(
		new URLSearchParams( window.location.search ),
		filterConfigs,
		searchParamName,
		isWooCommerceBlocksEnabled
	);
}
