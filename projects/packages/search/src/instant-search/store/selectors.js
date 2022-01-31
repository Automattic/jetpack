/**
 * Internal dependencies
 */
import { RELEVANCE_SORT_KEY } from '../lib/constants';
import { getUnselectableFilterKeys, mapFilterKeyToFilter } from '../lib/filters';

/**
 * Get the stored API response.
 *
 * @param {object} state - Current state.
 * @returns {object} Response object.
 */
export function getResponse( state ) {
	return state.response;
}

/**
 * Get the hasError flag.
 *
 * @param {object} state - Current state.
 * @returns {boolean} hasError - Whether the API returned an erroneous response.
 */
export function hasError( state ) {
	return state.hasError;
}

/**
 * Get the hasNextPage flag.
 *
 * @param {object} state - Current state.
 * @returns {boolean} hasNextPage - Whether the API contains a page handle for a subsequent page.
 */
export function hasNextPage( state ) {
	return ! hasError( state ) && getResponse( state )?.page_handle;
}

/**
 * Get the isLoading flag.
 *
 * @param {object} state - Current state.
 * @returns {boolean} isLoading - Whether the API request is still loading.
 */
export function isLoading( state ) {
	return state.isLoading;
}

/**
 * Get the search query.
 *
 * @param {object} state - Current state.
 * @returns {string} searchQuery - The search query entered by the user.
 */
export function getSearchQuery( state ) {
	return state.searchQuery;
}

/**
 * Get the sort key.
 *
 * @param {object} state - Current state.
 * @param {string?} defaultSort - Default sort order specified via the Customizer.
 * @returns {string} sort - The selected sort key for the search interface.
 */
export function getSort( state, defaultSort ) {
	// Default non-string defaultSort to 'relevance'
	if ( typeof defaultSort !== 'string' ) {
		defaultSort = RELEVANCE_SORT_KEY;
	}
	return typeof state.sort === 'string' ? state.sort : defaultSort;
}

/**
 * Get the filters.
 *
 * @param {object} state - Current state.
 * @returns {object} filters - An object mapping filter keys and its selected values.
 */
export function getFilters( state ) {
	return state.filters;
}

/**
 * Get the selected static filters.
 *
 * @param {object} state - Current state.
 * @returns {object} filters - An object mapping filter keys and its selected values.
 */
export function getStaticFilters( state ) {
	return state.staticFilters;
}

/**
 * Checks if any filters have been selected.
 *
 * @param {object} state - Current state.
 * @returns {object} hasFilters - true if any filter has been selected.
 */
export function hasFilters( state ) {
	return Object.keys( state.filters ).length > 0;
}

/**
 * Checks if any static filters have been selected.
 *
 * @param {object} state - Current state.
 * @returns {object} hasStaticFilters - true if any filter has been selected.
 */
function hasStaticFilters( state ) {
	return Object.keys( state.staticFilters ).length > 0;
}

/**
 * Checks if there is an active search-related query values.
 *
 * @param {object} state - Current state.
 * @returns {object} hasActiveQuery - true if any search-related query value has been defined.
 */
export function hasActiveQuery( state ) {
	return (
		getSearchQuery( state ) !== null ||
		hasFilters( state ) ||
		hasStaticFilters( state ) ||
		state.sort !== null
	);
}

/**
 * This selector combines multiple widgets outside overlay into a single widget consisting only of the `filters` key.
 * After combining the widgets, we the filter out all unselected filter values.
 *
 * This is used to render a single SearchFilters component for all filters selected outside the search overlay.
 *
 * @param {object} state - Redux state tree.
 * @returns {{ filters: object[] }} pseudoWidget - contains `filters`, an array of filter objects selected outside the search overlay.
 */
export function getWidgetOutsideOverlay( state ) {
	// Both of these values should default to [] when empty; they should never be falsy.
	if ( ! state.serverOptions.widgets || ! state.filters ) {
		return {};
	}
	const keys = getUnselectableFilterKeys( state.serverOptions.widgets );
	const filters = Object.keys( state.filters )
		.filter( key => keys.includes( key ) )
		.map( mapFilterKeyToFilter );

	return { filters };
}

/**
 * Returns true if the query string change was performed by a history navigation.
 *
 * @param {object} state - Current state.
 * @returns {boolean} isHistoryNavigation.
 */
export function isHistoryNavigation( state ) {
	return state.isHistoryNavigation;
}
