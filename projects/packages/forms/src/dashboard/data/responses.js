import apiFetch from '@wordpress/api-fetch';
import { pick } from 'lodash';

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
		pick( query, [ 'limit', 'offset', 'search', 'status' ] )
	).toString();

	return apiFetch( { path: `/wpcom/v2/forms/responses?${ queryString }` } );
};

/**
 * Updates posts status
 *
 * @param {Array}  responseIdList - The list of responses to be updated.
 * @param {string} action  - The action to be executed.
 * @returns {Promise} Request promise.
 */
export const updateResponseStatus = ( responseIdList, action ) => {
	return apiFetch( {
		path: `/wpcom/v2/forms/responses`,
		method: 'POST',
		headers: {
			'Content-Type': `application/json;bulk_action=${ action }`,
		},
		body: JSON.stringify( { post_ids: responseIdList } ),
	} );
};
