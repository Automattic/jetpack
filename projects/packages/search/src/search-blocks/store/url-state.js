// Valid UI/URL values for `orderby`. Must mirror `Search_Blocks::parse_url_sort()`
// on the PHP side so deep links round-trip the same sort on first paint and
// hydration.
const VALID_SORT_ORDERS = [ 'relevance', 'newest', 'oldest' ];
const DEFAULT_SORT_ORDER = 'relevance';

/**
 * Serialize store state to URLSearchParams.
 *
 * @param {object} state             - Store state slice.
 * @param {string} state.searchQuery - Current search query.
 * @param {string} state.sortOrder   - Current sort order.
 * @return {URLSearchParams} URL-ready params.
 */
export function stateToUrlParams( { searchQuery, sortOrder } ) {
	const params = new URLSearchParams();

	if ( searchQuery ) {
		params.set( 's', searchQuery );
	}

	if ( sortOrder && sortOrder !== DEFAULT_SORT_ORDER && VALID_SORT_ORDERS.includes( sortOrder ) ) {
		params.set( 'orderby', sortOrder );
	}

	return params;
}

/**
 * Parse URLSearchParams back into partial store state. Unknown `orderby`
 * values collapse to the default so a garbage URL can't leak into the
 * `<select>` binding or the API request.
 *
 * @param {URLSearchParams} params - URL search params.
 * @return {{ searchQuery: string, sortOrder: string }} Partial state.
 */
export function urlParamsToState( params ) {
	const rawOrderby = params.get( 'orderby' );
	return {
		searchQuery: params.get( 's' ) ?? '',
		sortOrder: VALID_SORT_ORDERS.includes( rawOrderby ) ? rawOrderby : DEFAULT_SORT_ORDER,
	};
}

/**
 * Push current store state to browser URL without triggering a page reload.
 *
 * @param {object} state - Relevant state slice.
 */
export function pushStateToUrl( state ) {
	const params = stateToUrlParams( state );
	const newUrl = window.location.pathname + ( params.toString() ? `?${ params.toString() }` : '' );
	window.history.pushState( {}, '', newUrl );
}

/**
 * Read initial state from the current URL.
 *
 * @return {{ searchQuery: string, sortOrder: string }} Partial state.
 */
export function readStateFromUrl() {
	return urlParamsToState( new URLSearchParams( window.location.search ) );
}
