
/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_SEARCH_TERM,
	JETPACK_SEARCH_FOCUS,
	JETPACK_SEARCH_BLUR
} from 'state/action-types';

const searchTerm = ( state = false, action ) => {
	switch ( action.type ) {
		case JETPACK_SEARCH_TERM:
			return action.term;

		default:
			return state;
	}
};

const searchFocus = ( state = false, action ) => {
	switch ( action.type ) {
		case JETPACK_SEARCH_FOCUS:
			return true;

		case JETPACK_SEARCH_BLUR:
			return false;

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	searchTerm,
	searchFocus
} );

/**
 * Returns the Search Term
 *
 * @param  {Object} state  Global state tree
 * @return {string}        The current term being searched
 */
export function getSearchTerm( state ) {
	return state.jetpack.search.searchTerm;
}

/**
 * Returns the Search Focus state
 *
 * @param  {Object} state  Global state tree
 * @return {Boolean}       Whether the search input has focus
 */
export function getSearchFocus( state ) {
	return state.jetpack.search.searchFocus;
}
