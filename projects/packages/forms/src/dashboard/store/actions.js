import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	SET_SELECTED_RESPONSES,
	RECEIVE_FILTERS,
	SET_CURRENT_QUERY,
	INVALIDATE_FILTERS,
} from './action-types';

/**
 * Receive the available filters for the responses.
 *
 * @param {object} filters - Filters for the responses.
 * @return {object} Action object.
 */
export function receiveFilters( filters ) {
	return {
		type: RECEIVE_FILTERS,
		filters,
	};
}

// When we permanently delete some responses, we need to invalidate
// the filters in the dashboard to reflect the changes.
export const invalidateFilters = () => {
	return { type: INVALIDATE_FILTERS };
};

/**
 * Set the selected responses from current data set.
 *
 * @param {Array} selectedResponses - Selected responses.
 * @return {object}                   Action object.
 */
export const setSelectedResponses = selectedResponses => ( {
	type: SET_SELECTED_RESPONSES,
	selectedResponses,
} );

/**
 * Set the current DataViews query.
 *
 * @param {object} currentQuery - The current DataViews query.
 * @return {object} Action object.
 */
export function setCurrentQuery( currentQuery ) {
	return {
		type: SET_CURRENT_QUERY,
		currentQuery,
	};
}

/**
 * Performs a bulk action on responses.
 *
 * @param {number[]} ids    - The list of responses' ids to be updated.
 * @param {string}   action - The action to be executed.
 * @return {Promise} Request promise.
 */
export const doBulkAction = ( ids, action ) => async () => {
	try {
		await apiFetch( {
			path: `wp/v2/feedback/bulk_actions`,
			method: 'POST',
			data: {
				action,
				post_ids: ids,
			},
		} );
		// eslint-disable-next-line no-empty
	} catch {}
};
