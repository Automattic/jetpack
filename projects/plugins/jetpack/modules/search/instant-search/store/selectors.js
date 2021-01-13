/**
 * Internal dependencies
 */
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
 * @returns {string} sort - The selected sort key for the search interface.
 */
export function getSort( state ) {
	return state.sort;
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
 * Checks if any filters have been selected.
 *
 * @param {object} state - Current state.
 * @returns {object} hasFilters - true if any filter has been selected.
 */
export function hasFilters( state ) {
	return Object.keys( state.filters ).length > 0;
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
