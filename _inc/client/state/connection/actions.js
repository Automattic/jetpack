/**
 * Internal dependencies
 */
import {
	JETPACK_CONNECTION_STATUS_FETCH,
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS
} from 'state/action-types';
import restApi from 'rest-api';

export const fetchSiteConnectionStatus = () => {
	return ( dispatch ) => {
		return restApi.fetchSiteConnectionStatus().then( siteConnected => {
			dispatch( {
				type: JETPACK_CONNECTION_STATUS_FETCH,
				siteConnected: siteConnected
			} );
		} );
	}
}

export const disconnectSite = () => {
	return ( dispatch ) => {
		dispatch( {
			type: DISCONNECT_SITE
		} );
		return restApi.disconnectSite().then( disconnect => {
			dispatch( {
				type: DISCONNECT_SITE_SUCCESS,
				disconnect: disconnect
			} );
		} )['catch']( error => {
			dispatch( {
				type: DISCONNECT_SITE_FAIL,
				error: error
			} );
		} );
	}
}