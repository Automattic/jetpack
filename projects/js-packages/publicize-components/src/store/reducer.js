/**
 * Reducer managing Publicize connection test results.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export default function ( state = {}, action ) {
	switch ( action.type ) {
		case 'REFRESH_CONNECTION_TEST_RESULTS':
			return state;

		case 'TOGGLE_CONNECTION_BY_ID':
			return state;

		case 'TOGGLE_PUBLICIZE_FEATURE':
			return state;
	}

	return state;
}
