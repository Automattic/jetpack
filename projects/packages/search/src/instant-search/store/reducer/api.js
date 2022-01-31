/**
 * Internal dependencies
 */
import { setDocumentCountsToZero } from '../../lib/api';

let cachedAggregations = {};
/**
 * Reducer for recording if the previous search request yielded an error.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function hasError( state = false, action ) {
	switch ( action.type ) {
		case 'MAKE_SEARCH_REQUEST':
		case 'RECORD_SUCCESSFUL_SEARCH_REQUEST':
			return false;
		case 'RECORD_FAILED_SEARCH_REQUEST':
			return true;
	}

	return state;
}

/**
 * Reducer for recording search request state.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function isLoading( state = false, action ) {
	switch ( action.type ) {
		case 'MAKE_SEARCH_REQUEST':
			return true;
		case 'RECORD_SUCCESSFUL_SEARCH_REQUEST':
		case 'RECORD_FAILED_SEARCH_REQUEST':
			return false;
	}

	return state;
}

/**
 * Reducer for recording search results.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function response( state = {}, action ) {
	switch ( action.type ) {
		case 'RECORD_SUCCESSFUL_SEARCH_REQUEST': {
			// A more recent response has already been saved.
			if (
				'requestId' in state &&
				'requestId' in action.response &&
				state.requestId > action.response.requestId
			) {
				return state;
			}

			const newState = { ...action.response };
			// For paginated results, merge previous search results with new search results.
			if ( action.options.pageHandle ) {
				newState.aggregations = {
					...( 'aggregations' in state && ! Array.isArray( state ) ? state.aggregations : {} ),
					...( ! Array.isArray( newState.aggregations ) ? newState.aggregations : {} ),
				};
				newState.results = [ ...( 'results' in state ? state.results : [] ), ...newState.results ];
				cachedAggregations = {};
			}

			// To prevent our interface from erroneously rendering a "no result" search results page when
			// we actually have results, override the total if the size of our results exceed the `response.total` value.
			if ( Array.isArray( newState.results ) && newState.results.length > newState.total ) {
				newState.total = newState.results.length;
			}

			// For a new search requests (i.e. not pagination requests):
			// - Cache aggregations if query yields results
			// - Show previously cached aggregations if query does not yield any results
			if ( ! action.options.pageHandle ) {
				if ( newState.results?.length > 0 ) {
					// cachedAggregations is used to cache the most recent aggregations object when results is not empty.
					cachedAggregations = setDocumentCountsToZero( newState.aggregations );
				} else {
					// If there is no result to show, we show the cached aggregations.
					newState.aggregations = cachedAggregations;
				}
			}

			return newState;
		}
	}

	return state;
}
