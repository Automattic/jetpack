import { find, get } from 'lodash';
import { combineReducers } from 'redux';
import { JETPACK_SEARCH_TERM } from 'state/action-types';

const searchTerm = ( state = '', action ) => {
	switch ( action.type ) {
		case JETPACK_SEARCH_TERM:
			return action.term;

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	searchTerm,
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
	const result = find( get( state.jetpack, [ 'modules', 'items' ], {} ), [ 'module', module ] );

	if ( 'undefined' === typeof result ) {
		return false;
	}

	const currentSearchTerm = get( state.jetpack, [ 'search', 'searchTerm' ], false );

	if ( ! currentSearchTerm ) {
		return true;
	}

	return (
		[
			result.module,
			result.name,
			result.description,
			result.learn_more_button,
			result.long_description,
			result.search_terms,
			result.additional_search_queries,
			result.short_description,
			result.feature ? result.feature.toString() : '',
		]
			.join( ' ' )
			.toLowerCase()
			.indexOf( currentSearchTerm.toLowerCase() ) > -1
	);
}
