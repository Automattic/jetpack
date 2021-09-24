/**
 * Reducer for recording if the previous search request yielded an error.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function hasError( state = false, action ) {
	switch ( action.type ) {
		case 'MAKE_SEARCH_REQUEST':
		case 'RECORD_SUCCESSFUL_SEARCH_REQUEST':
			return false;
		case 'RECORD_FAILED_SEARCH_REQUEST':
			return true;
	}

	return state;
}

/**
 * Reducer for recording search request state.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function isLoading( state = false, action ) {
	switch ( action.type ) {
		case 'MAKE_SEARCH_REQUEST':
			return true;
		case 'RECORD_SUCCESSFUL_SEARCH_REQUEST':
		case 'RECORD_FAILED_SEARCH_REQUEST':
			return false;
	}

	return state;
}

/**
 * Reducer for recording search results.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function response( state = {}, action ) {
	switch ( action.type ) {
		case 'RECORD_SUCCESSFUL_SEARCH_REQUEST': {
			// A more recent response has already been saved.
			if (
				'requestId' in state &&
				'requestId' in action.response &&
				state.requestId > action.response.requestId
			) {
				return state;
			}

			const newState = { ...action.response };
			// For paginated results, merge previous search results with new search results.
			if ( action.options.pageHandle ) {
				newState.aggregations = {
					...( 'aggregations' in state && ! Array.isArray( state ) ? state.aggregations : {} ),
					...( ! Array.isArray( newState.aggregations ) ? newState.aggregations : {} ),
				};
				newState.results = [ ...( 'results' in state ? state.results : [] ), ...newState.results ];
			}

			// To prevent our interface from erroneously rendering a "no result" search results page when
			// we actually have results, override the total if the size of our results exceed the `response.total` value.
			if ( Array.isArray( newState.results ) && newState.results.length > newState.total ) {
				newState.total = newState.results.length;
			}
			return newState;
		}
	}

	return state;
}
