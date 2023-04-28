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
	RESPONSES_REMOVE,
	RESPONSES_SELECTION_SET,
	RESPONSES_TAB_TOTALS_ADD,
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
 * @param {object} options - Options.
 * @param {boolean} options.append - Whether to append the responses to the existing set or replace it. Defaults to false.
 * @yields {object} Action object.
 * @returns {object} Action object.
 */
export function* fetchResponses( query, options = {} ) {
	yield { type: RESPONSES_FETCH, append: options.append };

	try {
		const data = yield dispatchAsync( fetchResponsesFromApi, [ query ] );

		return {
			type: RESPONSES_FETCH_RECEIVE,
			responses: data.responses,
			total: data.totals[ query.status || 'inbox' ],
			tabTotals: data.totals,
			filters: data.filters_available,
			append: options.append,
		};
	} catch ( error ) {
		return {
			type: RESPONSES_FETCH_FAIL,
			error,
		};
	}
}

/**
 * Removes the given responses from the current set.
 *
 * @param {Array} responseIds - Response IDs to remove.
 * @param {string} status - Current of the responses to be removed.
 * @returns {object} Action object.
 */
export const removeResponses = ( responseIds, status ) => ( {
	type: RESPONSES_REMOVE,
	responseIds,
	status,
} );

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
 * Updates the currently selected responses.
 *
 * @param  {Array} selectedResponses - Selected responses.
 * @returns {object}                   Action object.
 */
export const selectResponses = selectedResponses => ( {
	type: RESPONSES_SELECTION_SET,
	selectedResponses,
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

/**
 * Add to current tab total numbers.
 *
 * @param {object} tabTotals - Totals to add.
 * @returns {object} Action object,
 */
export const addTabTotals = tabTotals => ( {
	type: RESPONSES_TAB_TOTALS_ADD,
	tabTotals,
} );
