/**
 * Returns an action object used in signalling that
 * we're setting the Publicize connection test results.
 *
 * @param {Array} results - Connection test results.
 *
 * @returns {object} Action object.
 */
export function setSearchResults( results ) {
	return {
		type: 'SET_SEARCH_RESULTS',
		results,
	};
}

/**
 * Returns an action object used to make a search result request.
 *
 * @param {object} options - Search options.
 *
 * @returns {object} Action object.
 */
export function getSearchResults( options ) {
	return {
		type: 'GET_SEARCH_RESULTS',
		aggregations: options.aggregations ?? {},
		query: options.query,
		resultFormat: options.resultFormat,
		siteId: options.siteId,
	};
}
