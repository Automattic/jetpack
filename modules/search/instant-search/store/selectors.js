/**
 * Get response.
 *
 * @param {object} state - Current state.
 * @returns {object} Response object.
 */
export function getResponse( state ) {
	return state.response;
}

/**
 * Get hasError flag.
 *
 * @param {object} state - Current state.
 * @returns {boolean} Flag.
 */
export function hasError( state ) {
	return state.hasError;
}

/**
 * Get hasNextPage flag.
 *
 * @param {object} state - Current state.
 * @returns {boolean} Flag.
 */
export function hasNextPage( state ) {
	return ! hasError( state ) && getResponse( state )?.page_handle;
}

/**
 * Get isLoading flag.
 *
 * @param {object} state - Current state.
 * @returns {boolean} Flag.
 */
export function isLoading( state ) {
	return state.isLoading;
}

/**
 * Get search query.
 *
 * @param {object} state - Current state.
 * @returns {string} Search query.
 */
export function getSearchQuery( state ) {
	return state.searchQuery;
}

/**
 * Get sort key.
 *
 * @param {object} state - Current state.
 * @returns {string} Sort key.
 */
export function getSort( state ) {
	return state.sort;
}

/**
 * Get filters.
 *
 * @param {object} state - Current state.
 * @returns {Array} Filters.
 */
export function getFilters( state ) {
	return state.filters;
}

/**
 * Get hasFilters flag.
 *
 * @param {object} state - Current state.
 * @returns {boolean} Flag.
 */
export function hasFilters( state ) {
	return Object.keys( state.filters ).length > 0;
}
