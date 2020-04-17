/**
 * Internal dependencies
 */
import {
	JETPACK_SYNC_PROGRESS_FETCH,
	JETPACK_SYNC_PROGRESS_FETCH_FAIL,
	JETPACK_SYNC_PROGRESS_FETCH_RECEIVE,
} from 'state/action-types';
import restApi from 'rest-api';

export const fetchSyncProgress = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SYNC_PROGRESS_FETCH,
		} );
		return restApi
			.fetchSyncProgress()
			.then( response => {
				dispatch( {
					type: JETPACK_SYNC_PROGRESS_FETCH_RECEIVE,
					syncProgress: response.data,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SYNC_PROGRESS_FETCH_FAIL,
					error,
				} );
			} );
	};
};
