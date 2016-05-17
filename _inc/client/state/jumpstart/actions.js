/**
 * Internal dependencies
 */
import {
	JUMPSTART_ACTIVATE,
	JUMPSTART_ACTIVATE_FAIL,
	JUMPSTART_ACTIVATE_SUCCESS,
	JUMPSTART_SKIP
} from 'state/action-types';
import restApi from 'rest-api';

export const jumpStartActivate = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JUMPSTART_ACTIVATE
		} );
		return restApi.jumpStart( 'activate' ).then( () => {
			dispatch( {
				type: JUMPSTART_ACTIVATE_SUCCESS,
				jumpStart: true
			} );
		} )['catch']( error => {
			dispatch( {
				type: JUMPSTART_ACTIVATE_FAIL,
				error: error
			} );
		} );
	}
}

export const jumpStartSkip = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JUMPSTART_SKIP
		} );
		return restApi.jumpStart( 'deactivate' ).then( () => {
			dispatch( {
				type: JUMPSTART_SKIP_SUCCESS,
				jumpStart: false
			} );
		} )['catch']( error => {
			dispatch( {
				type: JUMPSTART_SKIP_FAIL,
				jumpStart: false
			} );
		} );
	}
}
