/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	DASHBOARD_PROTECT_COUNT_FETCH,
	DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
	DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS
} from 'state/action-types';

export const fetchProtectCount = () => {
	return ( dispatch ) => {
		dispatch( {
			type: DASHBOARD_PROTECT_COUNT_FETCH
		} );
		return restApi.getProtectCount().then( protectCount => {
			dispatch( {
				type: DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS,
				protectCount: protectCount
			} );
		} ).catch( error => {
			dispatch( {
				type: DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
				error: error
			} );
		} );
	}
}