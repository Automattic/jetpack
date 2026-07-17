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
 * @param {object} state - Global state tree
 * @return {string}        The current term being searched
 */
export function getSearchTerm( state ) {
	return state.jetpack.search.searchTerm;
}

/**
 * Returns the module found status
 *
 * @param {object} state  - Global state tree
 * @param {string} module - The module slug
 * @return {boolean}       Whether the module should be in the search results
 */
export function isModuleFound( state, module ) {
	const result = Object.values( state.jetpack?.modules?.items ?? {} ).find(
		v => v?.module === module
	);

	if ( 'undefined' === typeof result ) {
		return false;
	}

	const currentSearchTerm = state.jetpack?.search?.searchTerm ?? false;

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

/**
 * Returns whether any module matches the current search term.
 *
 * @param {object} state - Global state tree
 * @return {boolean}      True only when there is an active search term and at least one module matches it.
 */
export function hasAnyMatchingModule( state ) {
	if ( ! getSearchTerm( state ) ) {
		return false;
	}

	const items = state.jetpack?.modules?.items ?? {};
	return Object.values( items ).some( item => item?.module && isModuleFound( state, item.module ) );
}
