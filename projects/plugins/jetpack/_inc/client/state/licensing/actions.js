/**
 * Internal dependencies
 */
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_USER_LICENSE_COUNTS_UPDATE,
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
			.updateUserLicensesCounts()
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
