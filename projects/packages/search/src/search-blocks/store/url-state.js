/**
 * Serialize store state to URLSearchParams.
 *
 * @param {object} state               - Store state slice.
 * @param {string} state.searchQuery   - Current search query.
 * @param {object} state.activeFilters - Map of filterKey → string[].
 * @param {string} state.sortOrder     - Current sort order.
 * @return {URLSearchParams} URL-ready params.
 */
export function stateToUrlParams( { searchQuery, activeFilters, sortOrder } ) {
	const params = new URLSearchParams();

	if ( searchQuery ) {
		params.set( 's', searchQuery );
	}

	if ( sortOrder && sortOrder !== 'relevance' ) {
		params.set( 'orderby', sortOrder );
	}

	for ( const [ key, values ] of Object.entries( activeFilters ?? {} ) ) {
		if ( Array.isArray( values ) ) {
			values.forEach( v => params.append( `filter[${ key }][]`, v ) );
		}
	}

	return params;
}

/**
 * Parse URLSearchParams back into partial store state.
 *
 * @param {URLSearchParams} params - URL search params.
 * @return {{ searchQuery: string, activeFilters: object, sortOrder: string }} Partial state.
 */
export function urlParamsToState( params ) {
	const searchQuery = params.get( 's' ) ?? '';
	const sortOrder = params.get( 'orderby' ) ?? 'relevance';
	const activeFilters = {};

	for ( const [ key, value ] of params.entries() ) {
		const match = key.match( /^filter\[(.+)\]\[\]$/ );
		if ( match ) {
			const filterKey = match[ 1 ];
			if ( ! activeFilters[ filterKey ] ) {
				activeFilters[ filterKey ] = [];
			}
			activeFilters[ filterKey ].push( value );
		}
	}

	return { searchQuery, activeFilters, sortOrder };
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
 * @return {{ searchQuery: string, activeFilters: object, sortOrder: string }} Partial state.
 */
export function readStateFromUrl() {
	return urlParamsToState( new URLSearchParams( window.location.search ) );
}
