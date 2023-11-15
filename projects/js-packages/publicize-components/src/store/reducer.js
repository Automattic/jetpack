/**
 * Reducer managing Publicize connection test results.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export default function ( state = {}, action ) {
	switch ( action.type ) {
		case 'TOGGLE_PUBLICIZE_FEATURE':
			return state;
	}

	return state;
}
