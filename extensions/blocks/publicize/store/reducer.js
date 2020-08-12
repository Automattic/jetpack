const DEFAULT_STATE = {
	connections: [],
	tweets: [],
};

/**
 * Reducer managing Publicize connection test results.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export default function ( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'SET_CONNECTION_TEST_RESULTS':
			return {
				...state,
				connections: action.results,
			};
		case 'REFRESH_CONNECTION_TEST_RESULTS':
			return {
				...state,
				connections: [],
			};
		case 'SET_TWEETS':
			return {
				...state,
				tweets: action.results,
			};
	}

	return state;
}
