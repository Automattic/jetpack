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
