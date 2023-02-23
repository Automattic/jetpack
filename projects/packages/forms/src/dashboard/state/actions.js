/**
 * Internal dependencies
 */
import {
	JETPACK_FORMS_RESPONSES_FETCH,
	JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
	JETPACK_FORMS_RESPONSES_FETCH_FAIL,
} from './action-types';
import responses from './fixtures/responses';

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
			const data = await apiFake( { path: `/wpcom/v2/forms/responses?${ queryString }` } );

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

// TODO: This only here while we get the endpoints merged in. Replace with import apiFetch from '@wordpress/api-fetch';
const delay = ms => new Promise( resolve => setTimeout( resolve, ms ) );
const apiFake = async params => {
	const method = params.method ? params.method.toUpperCase() : 'GET';
	// eslint-disable-next-line -- this is debugging code
	console.log( `Faking request to: ${ method } ${ params.path }` );
	await delay( 500 );
	switch ( `${ method } ${ params.path }` ) {
		case 'GET /wpcom/v2/forms/responses?limit=10&offset=0':
			return responses;
		default:
			return '';
	}
};
