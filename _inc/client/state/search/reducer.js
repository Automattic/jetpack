
/**
 * External dependencies
 */
import get from 'lodash/get';
import find from 'lodash/find';
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_SEARCH_TERM
} from 'state/action-types';

const searchTerm = ( state = '', action ) => {
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

/**
 * Returns the module found status
 *
 * @param  {Object} state  Global state tree
 * @param  {String} module The module slug
 * @return {Boolean}       Whether the module should be in the search results
 */
export function isModuleFound( state, module ) {
	let result = get( state, [ 'jetpack', 'modules', 'items' ], {} );

	result = find( result, [ 'module', module ] );

	if ( 'undefined' === typeof result ) {
		return false;
	}

	let text = [
		result.module,
		result.name,
		result.description,
		result.learn_more_button,
		result.long_description,
		result.search_terms,
		result.additional_search_queries,
		result.short_description,
		result.feature ? result.feature.toString() : ''
	].join( ' ' );

	let searchTerm = get( state, [ 'jetpack', 'search', 'searchTerm' ], false );

	if ( ! searchTerm ) {
		return true;
	}

	return text.toLowerCase().indexOf( searchTerm.toLowerCase() ) > -1;
}
