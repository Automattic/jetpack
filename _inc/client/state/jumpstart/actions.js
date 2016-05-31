/**
 * External dependencies
 */
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import {
	JUMPSTART_ACTIVATE,
	JUMPSTART_ACTIVATE_FAIL,
	JUMPSTART_ACTIVATE_SUCCESS,
	JUMPSTART_SKIP,
	JUMPSTART_SKIP_SUCCESS,
	JUMPSTART_SKIP_FAIL
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
		analytics.tracks.recordEvent( 'jetpack_jumpstart_skip', {} );
		return restApi.jumpStart( 'deactivate' ).then( () => {
			dispatch( {
				type: JUMPSTART_SKIP_SUCCESS,
				jumpStart: false
			} );
		} )['catch']( error => {
			dispatch( {
				type: JUMPSTART_SKIP_FAIL,
				error: error
			} );
		} );
	}
}
