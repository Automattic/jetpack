
/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_SEARCH_TERM
} from 'state/action-types';

const searchTerm = ( state = false, action ) => {
	switch ( action.type ) {
		case JETPACK_SEARCH_TERM:
			return action.term;

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	searchTerm
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
