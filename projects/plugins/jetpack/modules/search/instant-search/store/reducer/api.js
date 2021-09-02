/**
 * Internal Dependencies
 */
import { isEmpty } from 'lodash';

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
			}

			// To prevent our interface from erroneously rendering a "no result" search results page when
			// we actually have results, override the total if the size of our results exceed the `response.total` value.
			if ( Array.isArray( newState.results ) && newState.results.length > newState.total ) {
				newState.total = newState.results.length;
			}
			if ( ! action.options.pageHandle ) {
				// cachedAggregations is used to cache the aggregations object.
				newState.cachedAggregations = mergeCachedAggregations(
					state.cachedAggregations,
					newState.aggregations
				);
				// If there is no result to show and there are filter keys in URL, we show the cached aggregations.
				if ( isEmpty( newState.results ) ) {
					//&& doesUrlContainFilterKeys( location.href )
					newState.aggregations = newState.cachedAggregations || {};
				}
			}

			return newState;
		}
	}

	return state;
}

/**
 * Reducer for clearing cached aggregations.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export function cachedAggregations( state = {}, action ) {
	switch ( action.type ) {
		case 'CLEAR_AGGREGATIONS_CACHE':
			return { ...state, cachedAggregations: {} };
	}
	return state;
}

/**
 * The function only merge on the top level, it doesn't merge the buckets.
 * Tried to merge the buckets, but which seems a bit bumpy.
 * Note: doc_count of cached aggregations is always set to 0.
 *
 * @param {object} previousCachedAggregations - Cached aggregations.
 * @param {object} newAggregations - New aggregations to merge.
 * @returns {object} Merged aggregations.
 */
function mergeCachedAggregations( previousCachedAggregations, newAggregations ) {
	return {
		...previousCachedAggregations,
		...Object.fromEntries(
			Object.entries( newAggregations )
				.filter( ( [ , aggregation ] ) => aggregation?.buckets?.length > 0 )
				.map( ( [ aggregationKey, aggregation ] ) => {
					const buckets = aggregation.buckets.map( bucket => ( {
						...bucket,
						doc_count: 0,
					} ) );
					return [ aggregationKey, { ...aggregation, buckets } ];
				} )
		),
	};
}
