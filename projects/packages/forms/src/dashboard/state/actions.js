import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import { SET_SELECTED_RESPONSES, RECEIVE_FILTERS, SET_CURRENT_QUERY } from './action-types';

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
export const doBulkAction =
	( ids, action ) =>
	// TODO: check if I should handle multiple dispatched actions here to avoid multiple same requests.
	// This is handled okay in bulk actions from DataViews, but not for single item actions..
	async ( { registry } ) => {
		// TODO: try/catch and possible notifications.
		// Check notifications in each action too..
		await apiFetch( {
			path: `wp/v2/feedback/bulk_actions`,
			method: 'POST',
			data: {
				action,
				post_ids: ids,
			},
		} );
		// TODO: Can I batch this?? Can I fine tune this?
		[ 'getEntityRecords', 'getEntityRecordsTotalItems', 'getEntityRecordsTotalPages' ].forEach(
			selector => registry.dispatch( coreStore ).invalidateResolutionForStoreSelector( selector )
		);
	};
