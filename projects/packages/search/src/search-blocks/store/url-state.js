// Mirror `Sort_Control::get_all_option_keys()`. Product-format keys rejoin in RSM-1082.
const VALID_SORT_ORDERS = [ 'relevance', 'newest', 'oldest' ];
const DEFAULT_SORT_ORDER = 'relevance';

// Reserved query params — not treated as filter keys on parse. Mirrors the
// allow-list on the PHP side in Search_Blocks::parse_url_filters().
const RESERVED_PARAMS = new Set( [ 's', 'orderby', 'min_price', 'max_price' ] );

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
 * Filter keys are written as flat top-level array params (`?category[]=news`),
 * matching the shape instant-search already writes so deep links are
 * interchangeable between the two surfaces.
 *
 * @param {object}      state                 - Store state slice.
 * @param {string}      state.searchQuery     - Current search query.
 * @param {string}      state.sortOrder       - Current sort order.
 * @param {object}      [state.activeFilters] - { [filterKey]: string[] } selected filters.
 * @param {object|null} [state.priceRange]    - { min, max } price range; either bound may be null.
 * @return {URLSearchParams} URL-ready params.
 */
export function stateToUrlParams( {
	searchQuery,
	sortOrder,
	activeFilters = {},
	priceRange = null,
} ) {
	const params = new URLSearchParams();

	// Always emit `s` (even empty) so a refresh keeps WP routed to the
	// search template. Dropping the param entirely when the user clears
	// the input would push the page back to the front-page route.
	params.set( 's', searchQuery ?? '' );

	if ( sortOrder && sortOrder !== DEFAULT_SORT_ORDER && VALID_SORT_ORDERS.includes( sortOrder ) ) {
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
 * @param {URLSearchParams} params          - URL search params.
 * @param {object}          [filterConfigs] - { [filterKey]: FilterConfig } map used to validate filter keys.
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object, priceRange: object|null }} Partial state.
 */
export function urlParamsToState( params, filterConfigs = {} ) {
	const rawOrderby = params.get( 'orderby' );
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

	// Scalar comma-joined fallback for filterConfigs whose `urlFormat` is
	// `scalar` (e.g. `?filter_stock_status=instock,outofstock`). Used by
	// product filters whose URL contract is a single key with comma-joined
	// values rather than the array-form `?key[]=v` default.
	for ( const [ filterKey, config ] of Object.entries( filterConfigs ?? {} ) ) {
		if ( config?.urlFormat !== 'scalar' || activeFilters[ filterKey ] ) {
			continue;
		}
		const raw = params.get( filterKey );
		if ( ! raw ) {
			continue;
		}
		const values = String( raw )
			.split( ',' )
			.map( v => v.trim() )
			.filter( Boolean );
		if ( values.length > 0 ) {
			activeFilters[ filterKey ] = Array.from( new Set( values ) );
		}
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
		searchQuery: params.get( 's' ) ?? '',
		sortOrder: VALID_SORT_ORDERS.includes( rawOrderby ) ? rawOrderby : DEFAULT_SORT_ORDER,
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
 * @param {object} [filterConfigs] - { [filterKey]: FilterConfig } map used to validate filter keys.
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object, priceRange: object|null }} Partial state.
 */
export function readStateFromUrl( filterConfigs = {} ) {
	return urlParamsToState( new URLSearchParams( window.location.search ), filterConfigs );
}
