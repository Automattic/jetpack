/**
 * Internal dependencies
 */
import {
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS
} from 'state/action-types';
import restApi from 'rest-api';

export const disconnectSite = () => {
	return ( dispatch ) => {
		console.log( 'disconnecting site' );
		dispatch( {
			type: DISCONNECT_SITE
		} );
		return restApi.disconnectSite().then( disconnect => {
			dispatch( {
				type: DISCONNECT_SITE_SUCCESS,
				disconnect: disconnect
			} );
		} ).catch( error => {
			dispatch( {
				type: DISCONNECT_SITE_FAIL,
				error: error
			} );
		} );
	}
}