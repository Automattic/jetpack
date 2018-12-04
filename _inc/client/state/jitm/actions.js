/**
 * Internal dependencies
 */
import {
	JITM_FETCH,
	JITM_FETCH_RECEIVE,
	JITM_FETCH_FAIL,
	JITM_DISMISS,
	JITM_DISMISS_SUCCESS,
	JITM_DISMISS_FAIL,
} from 'state/action-types';
import restApi from 'rest-api';

export const fetchJitm = ( message_path = '', query_url = 'page=jetpack' ) => {
	return dispatch => {
		dispatch( {
			type: JITM_FETCH
		} );
		return restApi
			.fetchJitm( message_path, query_url )
			.then( message => {
				dispatch( {
					type: JITM_FETCH_RECEIVE,
					message: message
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JITM_FETCH_FAIL,
					error: error
				} );
			} );
	};
};

export const dismissJitm = ( id, feature_class ) => {
	return dispatch => {
		dispatch( {
			type: JITM_DISMISS
		} );
		return restApi
			.dismissJitm( id, feature_class )
				.then( response => {
					dispatch( {
						type: JITM_DISMISS_SUCCESS,
						response: response
					} );
				} )
				.catch( error => {
					dispatch( {
						type: JITM_DISMISS_FAIL,
						error: error
					} );
				} );
	};
};
