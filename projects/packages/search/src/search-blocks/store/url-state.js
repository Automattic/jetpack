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

	if ( sortOrder && sortOrder !== 'relevance' ) {
		params.set( 'orderby', sortOrder );
	}

	return params;
}

/**
 * Parse URLSearchParams back into partial store state.
 *
 * @param {URLSearchParams} params - URL search params.
 * @return {{ searchQuery: string, sortOrder: string }} Partial state.
 */
export function urlParamsToState( params ) {
	return {
		searchQuery: params.get( 's' ) ?? '',
		sortOrder: params.get( 'orderby' ) ?? 'relevance',
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
