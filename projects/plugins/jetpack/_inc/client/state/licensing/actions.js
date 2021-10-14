/**
 * Internal dependencies
 */
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_UNATTACHED_USER_LICENSES_COUNT_FETCH,
	JETPACK_LICENSING_UNATTACHED_USER_LICENSES_COUNT_RECIEVE,
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

export const fetchUnattachedUserLicensesCount = () => {
	return dispatch => {
		dispatch( { type: JETPACK_LICENSING_UNATTACHED_USER_LICENSES_COUNT_FETCH } );
		return restApi
			.getUnattachedUserLicensesCount()
			.then( count => {
				dispatch( {
					type: JETPACK_LICENSING_UNATTACHED_USER_LICENSES_COUNT_RECIEVE,
					count,
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
