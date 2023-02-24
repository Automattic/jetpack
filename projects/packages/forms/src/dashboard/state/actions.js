/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	JETPACK_FORMS_RESPONSES_FETCH,
	JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
	JETPACK_FORMS_RESPONSES_FETCH_FAIL,
} from './action-types';

export const fetchResponses = ( query, limit = 20, offset = 0 ) => {
	return async dispatch => {
		dispatch( {
			type: JETPACK_FORMS_RESPONSES_FETCH,
			query,
			limit,
			offset,
		} );

		const queryString = new URLSearchParams( {
			...query,
			limit,
			offset,
		} ).toString();

		try {
			const data = await apiFetch( { path: `/wpcom/v2/forms/responses?${ queryString }` } );

			dispatch( {
				type: JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
				append: 0 < offset,
				responses: data.responses,
				total: data.total,
			} );
		} catch ( error ) {
			dispatch( {
				type: JETPACK_FORMS_RESPONSES_FETCH_FAIL,
				error,
			} );
		}
	};
};
