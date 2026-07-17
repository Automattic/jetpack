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
	MARK_RECORDS_AS_INVALID,
	CLEAR_INVALID_RECORDS,
	ADD_PENDING_ACTION,
	REMOVE_PENDING_ACTION,
	SET_FORM_STATUS_COUNTS,
	INVALIDATE_FORM_STATUS_COUNTS,
} from './action-types.js';

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
 * If filters have changed, clears invalid records and invalidates entity records resolution.
 *
 * @param {object} currentQuery - The current DataViews query.
 * @return {Function} Thunk action.
 */
export function setCurrentQuery( currentQuery ) {
	return ( { dispatch, select, registry } ) => {
		const previousQuery = select.getCurrentQuery();

		// Ensure fields_format is always included (for backwards compatibility with API)
		const queryWithFormat = {
			...currentQuery,
			fields_format: currentQuery.fields_format ?? previousQuery.fields_format ?? 'collection',
		};

		// Check if filters changed (not just pagination)
		const filtersChanged =
			previousQuery.status !== queryWithFormat.status ||
			previousQuery.search !== queryWithFormat.search ||
			previousQuery.is_unread !== queryWithFormat.is_unread ||
			previousQuery.parent !== queryWithFormat.parent ||
			previousQuery.source !== queryWithFormat.source ||
			previousQuery.before !== queryWithFormat.before ||
			previousQuery.after !== queryWithFormat.after;

		// If filters changed, clear invalid records and refetch
		if ( filtersChanged ) {
			dispatch( clearInvalidRecords() );
			// Only invalidate resolution if core store is available (it won't be in tests)
			if ( registry && registry.dispatch( 'core' ) ) {
				registry
					.dispatch( 'core' )
					.invalidateResolution( 'getEntityRecords', [ 'postType', 'feedback', queryWithFormat ] );
			}
		}

		dispatch( {
			type: SET_CURRENT_QUERY,
			currentQuery: queryWithFormat,
		} );
	};
}

/**
 * Set the status counts.
 *
 * @param {object} counts      - The counts object with inbox, spam, and trash.
 * @param {object} queryParams - The query parameters used to fetch these counts.
 * @return {object} Action object.
 */
export function setCounts( counts, queryParams = {} ) {
	return {
		type: SET_COUNTS,
		counts,
		queryParams,
	};
}

/**
 * Optimistically update counts when status changes.
 *
 * @param {string} fromStatus  - The status items are moving from.
 * @param {string} toStatus    - The status items are moving to.
 * @param {number} count       - Number of items being moved.
 * @param {object} queryParams - The query parameters for the current view.
 * @return {object} Action object.
 */
export function updateCountsOptimistically( fromStatus, toStatus, count = 1, queryParams = {} ) {
	return {
		type: UPDATE_COUNTS_OPTIMISTICALLY,
		fromStatus,
		toStatus,
		count,
		queryParams,
	};
}

/**
 * Mark records as invalid/stale without removing them from view.
 *
 * @param {number[]} recordIds - IDs of records to mark as invalid.
 * @return {object} Action object.
 */
export function markRecordsAsInvalid( recordIds ) {
	return {
		type: MARK_RECORDS_AS_INVALID,
		recordIds,
	};
}

/**
 * Clear all invalid record markers.
 *
 * @return {object} Action object.
 */
export function clearInvalidRecords() {
	return {
		type: CLEAR_INVALID_RECORDS,
	};
}

/**
 * Add a pending action to track optimistic updates in progress.
 *
 * @param {string} actionId - Unique identifier for the action.
 * @return {object} Action object.
 */
export function addPendingAction( actionId ) {
	return {
		type: ADD_PENDING_ACTION,
		actionId,
	};
}

/**
 * Remove a pending action when it completes.
 *
 * @param {string} actionId - Unique identifier for the action.
 * @return {object} Action object.
 */
export function removePendingAction( actionId ) {
	return {
		type: REMOVE_PENDING_ACTION,
		actionId,
	};
}

/**
 * Set the form status counts.
 *
 * @param {object} formStatusCounts - Per-status counts for the jetpack_form post type.
 * @return {object} Action object.
 */
export function setFormStatusCounts( formStatusCounts ) {
	return {
		type: SET_FORM_STATUS_COUNTS,
		formStatusCounts,
	};
}

/**
 * Invalidate the form status counts so the resolver re-fetches them.
 *
 * @return {object} Action object.
 */
export const invalidateFormStatusCounts = () => {
	return { type: INVALIDATE_FORM_STATUS_COUNTS };
};

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
