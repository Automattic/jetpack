/**
 * Internal dependencies
 */
import {
	JETPACK_ACTION_NOTICES_DISMISS,
	JETPACK_NOTICES_DISMISS,
	JETPACK_NOTICES_DISMISS_FAIL,
	JETPACK_NOTICES_DISMISS_SUCCESS,
} from 'state/action-types';
import restApi from '@automattic/jetpack-api';

export const dismissJetpackNotice = notice => {
	return dispatch => {
		dispatch( {
			type: JETPACK_NOTICES_DISMISS,
			notice: notice,
		} );
		return restApi
			.dismissJetpackNotice( notice )
			.then( dismissedNotices => {
				dispatch( {
					type: JETPACK_NOTICES_DISMISS_SUCCESS,
					dismissedNotices: dismissedNotices,
					success: true,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_NOTICES_DISMISS_FAIL,
					error: error,
				} );
			} );
	};
};

export const dismissJetpackActionNotice = notice => {
	return dispatch => {
		dispatch( {
			type: JETPACK_ACTION_NOTICES_DISMISS,
			notice: notice,
		} );
	};
};
