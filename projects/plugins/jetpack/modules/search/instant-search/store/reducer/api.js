/**
 * Internal Dependencies
 */
import { doesUrlContainFilters } from '../../lib/query-string';

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

			// cachedAggregations is used to cache the aggregations object.
			newState.cachedAggregations = mergeCachedAggregations(
				state.cachedAggregations,
				newState.aggregations
			);

			// If there is no result to show, we show the cached aggregations.
			// TODO: replace true with a flag indicating whether there are filters in URL
			if ( ! newState.results?.length > 0 && doesUrlContainFilters( location.href ) ) {
				newState.aggregations = state.cachedAggregations ? state.cachedAggregations : {};
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
		case 'CLEAR_RESPONSE_AGGREGATIONS_CACHE':
			return { ...state, cachedAggregations: {} };
	}
	return state;
}

/**
 * Note: doc_count of cached aggregations is always 0.
 *
 * @param {object} previousAggregations - Cached aggregations.
 * @param {object} newAggregations - New aggregations to merge.
 * @returns {object} Merged aggregations.
 */
function mergeCachedAggregations( previousAggregations, newAggregations ) {
	return {
		...previousAggregations,
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
