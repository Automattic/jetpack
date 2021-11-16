/**
 * Internal dependencies
 */
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_USER_LICENSE_COUNTS_UPDATE,
	JETPACK_LICENSING_ACTIVATION_NOTICE_DISMISS_UPDATE,
} from 'state/action-types';
import restApi from '@automattic/jetpack-api';

export const clearLicensingError = () => {
	return dispatch => {
		const error = '';

		dispatch( {
			type: JETPACK_LICENSING_ERROR_UPDATE,
			error,
		} );
		return restApi.updateLicensingError( { error } );
	};
};

export const updateUserLicensesCounts = () => {
	return dispatch => {
		return restApi
			.getUserLicensesCounts()
			.then( counts => {
				dispatch( {
					type: JETPACK_LICENSING_USER_LICENSE_COUNTS_UPDATE,
					counts,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_LICENSING_ERROR_UPDATE,
					error,
				} );
			} );
	};
};

export const updateLicensingActivationNoticeDismiss = () => {
	return ( dispatch, getState ) => {
		const currentDetachedLicenseCount = getState().jetpack.licensing.userCounts?.detached;
		return restApi
			.updateLicensingActivationNoticeDismiss( currentDetachedLicenseCount )
			.then( dismissData => {
				dispatch( {
					type: JETPACK_LICENSING_ACTIVATION_NOTICE_DISMISS_UPDATE,
					dismissData,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_LICENSING_ERROR_UPDATE,
					error,
				} );
			} );
	};
};
