export const DEFAULT_STATE = {
	connections: [],
	tweets: [],
};

/**
 * Reducer managing Publicize connection test results.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 *
 * @returns {object} Updated state.
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
				tweets: action.tweets,
			};
	}

	return state;
}
