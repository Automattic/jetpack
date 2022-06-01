import restApi from '@automattic/jetpack-api';
import {
	SCAN_STATUS_FETCH,
	SCAN_STATUS_FETCH_RECEIVE,
	SCAN_STATUS_FETCH_FAIL,
} from 'state/action-types';

export const fetchScanStatus = () => {
	return dispatch => {
		dispatch( {
			type: SCAN_STATUS_FETCH,
		} );
		return restApi
			.fetchScanStatus()
			.then( status => {
				dispatch( {
					type: SCAN_STATUS_FETCH_RECEIVE,
					status: status,
				} );
				return status;
			} )
			.catch( error => {
				dispatch( {
					type: SCAN_STATUS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};
