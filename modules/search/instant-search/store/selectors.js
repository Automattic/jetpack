/**
 * Internal dependencies
 */
import { getUnselectableFilterKeys, mapFilterToFilterKey } from '../lib/filters';

export function getResponse( state ) {
	return state.response;
}

export function hasError( state ) {
	return state.hasError;
}

export function hasNextPage( state ) {
	return ! hasError( state ) && getResponse( state )?.page_handle;
}

export function isLoading( state ) {
	return state.isLoading;
}

export function getSearchQuery( state ) {
	return state.searchQuery;
}

export function getSort( state ) {
	return state.sort;
}

export function getFilters( state ) {
	return state.filters;
}

export function hasFilters( state ) {
	return Object.keys( state.filters ).length > 0;
}

// This selector combines multiple widgets outside overlay into a single widget consisting only of the `filters` key.
// After combining the widgets, we the filter out all unselected filter values.
//
// This is used to render a single SearchFilters component for all filters selected outside the search overlay.
export function getWidgetOutsideOverlay( state ) {
	// Both of these values should default to [] when empty; they should never be falsy.
	if ( ! state.serverOptions.widgetsOutsideOverlay || ! state.serverOptions.widgets ) {
		return {};
	}
	const keys = getUnselectableFilterKeys(
		state.serverOptions.widgets,
		state.serverOptions.widgetsOutsideOverlay
	);
	const selectedKeys = Object.keys( state.filters ).filter( key => keys.includes( key ) );
	const filters = state.serverOptions.widgetsOutsideOverlay
		.map( widget => widget.filters )
		.reduce( ( prev, current ) => prev.concat( current ), [] )
		// Server-side filter keys are named differently than client-side; conversion is required.
		.filter( serverFilter => selectedKeys.includes( mapFilterToFilterKey( serverFilter ) ) );

	return { filters };
}
