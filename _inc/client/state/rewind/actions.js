/**
 * Internal dependencies
 */
import {
	REWIND_STATUS_FETCH,
	REWIND_STATUS_FETCH_RECEIVE,
	REWIND_STATUS_FETCH_FAIL,
} from 'state/action-types';
import restApi from 'rest-api';

export const fetchRewindStatus = () => {
	return ( dispatch ) => {
		dispatch( {
			type: REWIND_STATUS_FETCH
		} );
		return restApi.fetchRewindStatus().then( status => {
			dispatch( {
				type: REWIND_STATUS_FETCH_RECEIVE,
				status: status
			} );
			return status;
		} ).catch( error => {
			dispatch( {
				type: REWIND_STATUS_FETCH_FAIL,
				error: error
			} );
		} );
	};
};
