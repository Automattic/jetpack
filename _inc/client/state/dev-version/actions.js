/**
 * Internal dependencies
 */
import {
	RESET_OPTIONS,
	RESET_OPTIONS_FAIL,
	RESET_OPTIONS_SUCCESS
} from 'state/action-types';
import restApi from 'rest-api';

export const resetOptions = ( options ) => {
	return ( dispatch ) => {
		dispatch( {
			type: RESET_OPTIONS
		} );
		return restApi.resetOptions( options ).then( () => {
			dispatch( {
				type: RESET_OPTIONS_SUCCESS
			} );
		} )['catch']( error => {
			dispatch( {
				type: RESET_OPTIONS_FAIL,
				error: error
			} );
		} );
	}
}
