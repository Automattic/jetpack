/**
 * Internal dependencies
 */
import { JETPACK_LICENSING_ERROR_UPDATE } from 'state/action-types';
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
