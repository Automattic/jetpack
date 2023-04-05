import apiFetch from '@wordpress/api-fetch';
import { isNil, omitBy, pick } from 'lodash';

/**
 * Fetches responses from backend (API)
 *
 * @param {object} query        - Query params.
 * @param {string} query.search - Text search term.
 * @param {string} query.status - Post status.
 * @param {number} query.limit  - Maximum results limit.
 * @param {number} query.offset - Offset for results paging.
 * @returns {Promise} Request promise.
 */
export const fetchResponses = query => {
	const queryString = new URLSearchParams(
		pick( omitBy( query, isNil ), [ 'limit', 'offset', 'search', 'status', 'parent_id', 'month' ] )
	).toString();

	return apiFetch( { path: `/wpcom/v2/forms/responses?${ queryString }` } );
};

/**
 * Performs a bulk action on responses.
 *
 * @param {Array} responseIds - The list of responses to be updated.
 * @param {string} action  - The action to be executed.
 * @returns {Promise} Request promise.
 */
export const doBulkAction = ( responseIds, action ) => {
	return apiFetch( {
		path: `/wpcom/v2/forms/responses/bulk_actions`,
		method: 'POST',
		data: {
			action,
			post_ids: responseIds,
		},
	} );
};
