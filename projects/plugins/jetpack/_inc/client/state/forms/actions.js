/**
 * Internal dependencies
 */
import {
	JETPACK_FORMS_RESPONSES_FETCH,
	JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
	JETPACK_FORMS_RESPONSES_FETCH_FAIL,
} from '../action-types';

export const fetchResponses = ( query, limit = 20, offset = 0 ) => {
	return dispatch => {
		dispatch( {
			type: JETPACK_FORMS_RESPONSES_FETCH,
			query,
			limit,
			offset,
		} );

		const queryString = new URLSearchParams( query ).toString();

		return fetch( `/wp-json/jetpack/v4/form-responses?${ queryString }` )
			.then( response => {
				return response.json();
			} )
			.then( responses => {
				dispatch( {
					type: JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
					responses,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_FORMS_RESPONSES_FETCH_FAIL,
					error,
				} );
			} );
	};
};
