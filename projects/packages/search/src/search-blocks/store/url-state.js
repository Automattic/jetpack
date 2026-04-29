// Mirror `Sort_Control::get_all_option_keys()`. Product-format keys rejoin in RSM-1082.
const VALID_SORT_ORDERS = [ 'relevance', 'newest', 'oldest' ];
const DEFAULT_SORT_ORDER = 'relevance';

// Reserved query params — not treated as filter keys on parse. Mirrors the
// allow-list on the PHP side in Search_Blocks::parse_url_filters().
const RESERVED_PARAMS = new Set( [ 's', 'orderby' ] );

/**
 * Serialize store state to URLSearchParams.
 *
 * Filter keys are written as flat top-level array params (`?category[]=news`),
 * matching the shape instant-search already writes so deep links are
 * interchangeable between the two surfaces.
 *
 * @param {object} state                 - Store state slice.
 * @param {string} state.searchQuery     - Current search query.
 * @param {string} state.sortOrder       - Current sort order.
 * @param {object} [state.activeFilters] - { [filterKey]: string[] } selected filters.
 * @return {URLSearchParams} URL-ready params.
 */
export function stateToUrlParams( { searchQuery, sortOrder, activeFilters = {} } ) {
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
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object }} Partial state.
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

	return {
		searchQuery: params.get( 's' ) ?? '',
		sortOrder: VALID_SORT_ORDERS.includes( rawOrderby ) ? rawOrderby : DEFAULT_SORT_ORDER,
		activeFilters,
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
 * @return {{ searchQuery: string, sortOrder: string, activeFilters: object }} Partial state.
 */
export function readStateFromUrl( filterConfigs = {} ) {
	return urlParamsToState( new URLSearchParams( window.location.search ), filterConfigs );
}
