import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	SET_SELECTED_RESPONSES,
	RECEIVE_FILTERS,
	SET_CURRENT_QUERY,
	INVALIDATE_FILTERS,
	SET_COUNTS,
	UPDATE_COUNTS_OPTIMISTICALLY,
	INVALIDATE_COUNTS,
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
 * Invalidate the counts when responses are deleted.
 *
 * @return {object} Action object.
 */
export const invalidateCounts = () => {
	return { type: INVALIDATE_COUNTS };
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
 * Set the status counts.
 *
 * @param {object} counts - The counts object with inbox, spam, and trash.
 * @return {object} Action object.
 */
export function setCounts( counts ) {
	return {
		type: SET_COUNTS,
		counts,
	};
}

/**
 * Optimistically update counts when status changes.
 *
 * @param {string} fromStatus - The status items are moving from.
 * @param {string} toStatus   - The status items are moving to.
 * @param {number} count      - Number of items being moved.
 * @return {object} Action object.
 */
export function updateCountsOptimistically( fromStatus, toStatus, count = 1 ) {
	return {
		type: UPDATE_COUNTS_OPTIMISTICALLY,
		fromStatus,
		toStatus,
		count,
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
