/**
 * Internal dependencies
 */
import { fetchResponses as fetchResponsesFromApi } from '../data/responses';
import {
	ASYNC_ROUTINE_DISPATCH,
	RESPONSES_CURRENT_PAGE_SET,
	RESPONSES_FETCH,
	RESPONSES_FETCH_FAIL,
	RESPONSES_FETCH_RECEIVE,
	RESPONSES_LOADING_SET,
	RESPONSES_QUERY_MONTH_UPDATE,
	RESPONSES_QUERY_RESET,
	RESPONSES_QUERY_SEARCH_UPDATE,
	RESPONSES_QUERY_SOURCE_UPDATE,
	RESPONSES_QUERY_STATUS_UPDATE,
} from './action-types';

/**
 * One dispatch async to rule them all.
 *
 * @param {Function} apply - The function to apply the dispatch to.
 * @param {Array}    args  - Arguments to be passed onto the function.
 * @returns {object} Action object.
 */
export const dispatchAsync = ( apply, args = [] ) => ( {
	type: ASYNC_ROUTINE_DISPATCH,
	apply,
	args,
} );

/**
 * Handles the entire flow for fetching responses asynchronously.
 *
 * @param {object} query - Query.
 * @yields {object} Action object.
 * @returns {object} Action object.
 */
export function* fetchResponses( query ) {
	yield { type: RESPONSES_FETCH };

	try {
		const data = yield dispatchAsync( fetchResponsesFromApi, [ query ] );

		return {
			type: RESPONSES_FETCH_RECEIVE,
			responses: data.responses,
			total: data.totals[ query.status || 'inbox' ],
			filters: data.filters_available,
		};
	} catch ( error ) {
		return {
			type: RESPONSES_FETCH_FAIL,
			error,
		};
	}
}

/**
 * Sets the current page.
 *
 * @param {number} page - Current page number. Starting from 1.
 * @returns {object} Action object.
 */
export const setCurrentPage = page => ( {
	type: RESPONSES_CURRENT_PAGE_SET,
	page,
} );

/**
 * Reset the current query.
 *
 * @returns {object} Action object.
 */
export const resetQuery = () => ( {
	type: RESPONSES_QUERY_RESET,
} );

/**
 * Update the month filter in the current query.
 *
 * @param {string} month - Month filter.
 * @returns {object} Action object.
 */
export const setMonthQuery = month => ( {
	type: RESPONSES_QUERY_MONTH_UPDATE,
	month,
} );

/**
 * Update the search term in the current query.
 *
 * @param {string} search - Search term.
 * @returns {object} Action object.
 */
export const setSearchQuery = search => ( {
	type: RESPONSES_QUERY_SEARCH_UPDATE,
	search,
} );

/**
 * Update the source filter in the current query.
 *
 * @param {string} source - Source filter.
 * @returns {object} Action object.
 */
export const setSourceQuery = source => ( {
	type: RESPONSES_QUERY_SOURCE_UPDATE,
	source,
} );

/**
 * Update the status in the current query.
 *
 * @param {string} status - Feedback status.
 * @returns {object} Action object.
 */
export const setStatusQuery = status => ( {
	type: RESPONSES_QUERY_STATUS_UPDATE,
	status,
} );

/**
 * Set the application loading state.
 *
 * @param {boolean} loading - The loading state.
 * @returns {object} Action object.
 */
export const setLoading = loading => ( {
	type: RESPONSES_LOADING_SET,
	loading,
} );
