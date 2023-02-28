import apiFetch from '@wordpress/api-fetch';
import {
	JETPACK_FORMS_RESPONSES_FETCH,
	JETPACK_FORMS_RESPONSES_FETCH_FAIL,
	JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
} from './action-types';
import { dispatchAsync } from './actions';

const fetchResponses = ( query, limit = 20, offset = 0 ) => {
	const queryString = new URLSearchParams( {
		...query,
		limit,
		offset,
	} ).toString();

	return apiFetch( { path: `/wpcom/v2/formss/responses?${ queryString }` } );
};

/**
 *
 */
function* getResponses() {
	try {
		yield { type: JETPACK_FORMS_RESPONSES_FETCH };
		const response = yield dispatchAsync( fetchResponses, [] );
		yield {
			type: JETPACK_FORMS_RESPONSES_FETCH_RECEIVE,
			responses: response.responses,
			total: response.total,
		};
	} catch ( error ) {
		yield {
			type: JETPACK_FORMS_RESPONSES_FETCH_FAIL,
			error,
		};
		console.error( error );
	}
}

export default {
	getResponses,
};
