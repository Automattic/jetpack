/**
 * Internal dependencies
 */
import { VALID_SORT_KEYS } from '../../lib/constants';

/**
 * Reducer for keeping track of the user's inputted search query
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 *
 * @returns {object} Updated state.
 */
export function searchQuery( state = '', action ) {
	switch ( action.type ) {
		case 'SET_SEARCH_QUERY':
			return action.query;
	}

	return state;
}

/**
 * Reducer for keeping track of the user's selected sort type
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 *
 * @returns {object} Updated state.
 */
export function sort( state = 'relevance', action ) {
	if ( ! VALID_SORT_KEYS.includes( action.sort ) ) {
		return state;
	}

	switch ( action.type ) {
		case 'SET_SORT':
			return action.sort;
	}

	return state;
}
