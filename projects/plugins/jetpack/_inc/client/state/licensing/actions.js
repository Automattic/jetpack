/**
 * Internal dependencies
 */
import {
	JETPACK_LICENSING_ERROR_UPDATE,
	JETPACK_LICENSING_LICENSES_FETCH,
	JETPACK_LICENSING_LICENSES_FETCH_FAIL,
	JETPACK_LICENSING_LICENSES_FETCH_RECEIVE,
} from 'state/action-types';
import restApi from '../../rest-api';

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

export const fetchLicenses = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_LICENSING_LICENSES_FETCH,
		} );
		return restApi
			.fetchLicenses()
			.then( licenses => {
				dispatch( {
					type: JETPACK_LICENSING_LICENSES_FETCH_RECEIVE,
					licenses: licenses,
				} );
				return licenses;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_LICENSING_LICENSES_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};
