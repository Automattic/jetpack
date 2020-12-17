/**
 * Returns an action object used to make a search result request.
 *
 * @param {object} options - Search options.
 *
 * @returns {object} Action object.
 */
export function makeSearchRequest( options ) {
	return {
		type: 'MAKE_SEARCH_REQUEST',
		options,
	};
}

/**
 * Returns an action object used to record a successful search request.
 *
 * @param {object} params - Input parameters.
 * @param {object} params.options - Action options that generated this API response.
 * @param {object} params.response - API response.
 *
 * @returns {object} Action object.
 */
export function recordSuccessfulSearchRequest( { options, response } ) {
	return {
		type: 'RECORD_SUCCESSFUL_SEARCH_REQUEST',
		options,
		response,
	};
}

/**
 * Returns an action object used to record a failed search request.
 *
 * @param {object} error - Error from the failed search request.
 *
 * @returns {object} Action object.
 */
export function recordFailedSearchRequest( error ) {
	return {
		type: 'RECORD_FAILED_SEARCH_REQUEST',
		error,
	};
}

/**
 * Returns an action object used to initialize query value related reducers.
 *
 * @param {object} params - Input parameters.
 * @param {object} params.defaultSort - Default sort value configured in the customizer.
 *
 * @returns {object} Action object.
 */
export function initializeQueryValues( { defaultSort } ) {
	return {
		type: 'INITIALIZE_QUERY_VALUES',
		defaultSort,
	};
}

/**
 * Returns an action object used to set a search query value.
 *
 * @param {string} query - Inputted user query.
 * @param {boolean} propagateToWindow - If true, will tell the effects handler to set the search query in the location bar.
 *
 * @returns {object} Action object.
 */
export function setSearchQuery( query, propagateToWindow = true ) {
	return {
		type: 'SET_SEARCH_QUERY',
		query,
		propagateToWindow,
	};
}

/**
 * Returns an action object used to set a search sort value.
 *
 * @param {string} sort - Sort value.
 * @param {boolean} propagateToWindow - If true, will tell the effects handler to set the search query in the location bar.
 *
 * @returns {object} Action object.
 */
export function setSort( sort, propagateToWindow = true ) {
	return {
		type: 'SET_SORT',
		sort,
		propagateToWindow,
	};
}
