/**
 * Internal dependencies
 */
import { VALID_SORT_KEYS } from '../../lib/constants';
import { getFilterKeys } from '../../lib/filters';

/**
 * Reducer for keeping track of the user's inputted search query
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 *
 * @returns {object} Updated state.
 */
export function searchQuery( state = null, action ) {
	switch ( action.type ) {
		case 'SET_SEARCH_QUERY':
			return action.query;
		case 'SET_FILTER':
		case 'SET_SORT':
			return action.propagateToWindow ? '' : state;
		case 'CLEAR_QUERY_VALUES':
			return null;
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
	switch ( action.type ) {
		case 'SET_SORT': {
			if ( ! VALID_SORT_KEYS.includes( action.sort ) ) {
				return state;
			}
			return action.sort;
		}
		case 'CLEAR_QUERY_VALUES':
			return 'relevance';
	}

	return state;
}

/**
 * Reducer for keeping track of the user's selected filter value
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 *
 * @returns {object} Updated state.
 */
export function filters( state = {}, action ) {
	switch ( action.type ) {
		case 'CLEAR_FILTERS':
		case 'CLEAR_QUERY_VALUES':
			return {};
		case 'SET_FILTER':
			if (
				! getFilterKeys().includes( action.name ) ||
				( ! Array.isArray( action.value ) && typeof action.value !== 'string' )
			) {
				return state;
			}
			if ( action.value.length === 0 ) {
				const newState = { ...state };
				delete newState[ action.name ];
				return newState;
			}
			return {
				...state,
				[ action.name ]: typeof action.value === 'string' ? [ action.value ] : action.value,
			};
	}

	return state;
}
