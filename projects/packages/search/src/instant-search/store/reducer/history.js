/**
 * Returns true if the query string change was performed by a history navigation.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function isHistoryNavigation( state = false, action ) {
	switch ( action.type ) {
		case 'INITIALIZE_QUERY_VALUES':
			// Triggered by SearchApp.handleHistoryNavigation.
			return action.isHistoryNavigation;
		case 'SET_SEARCH_QUERY':
		case 'SET_SORT':
		case 'CLEAR_FILTERS':
		case 'SET_FILTER':
			// A query string update is invoked to the window, creating a history state.
			// In other words, the query string change was performed by UI interaction.
			// It was *not* performed by a history navigation.
			return action.propagateToWindow ? false : state;
	}

	return state;
}
