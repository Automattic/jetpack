/**
 * Reducer managing Publicize connection test results.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 *
 * @returns {object} Updated state.
 */
export default function ( state = [], action ) {
	switch ( action.type ) {
		case 'SET_SEARCH_RESULTS':
			return action.results;
		case 'GET_SEARCH_RESULTS':
			return [];
	}

	return state;
}
