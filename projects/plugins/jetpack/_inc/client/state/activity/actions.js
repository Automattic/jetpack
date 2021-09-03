/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import {
	ACTIVITY_STATUS_FETCH,
	ACTIVITY_STATUS_FETCH_RECEIVE,
	ACTIVITY_STATUS_FETCH_FAIL,
} from 'state/action-types';

export const fetchSiteActivity = () => {
	return dispatch => {
		dispatch( {
			type: ACTIVITY_STATUS_FETCH,
		} );
		return restApi
			.fetchSiteActivity()
			.then( data => {
				dispatch( {
					type: ACTIVITY_STATUS_FETCH_RECEIVE,
					data,
				} );
				return data;
			} )
			.catch( () => {
				dispatch( {
					type: ACTIVITY_STATUS_FETCH_FAIL,
				} );
			} );
	};
};
