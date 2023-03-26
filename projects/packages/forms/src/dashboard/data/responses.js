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
