/**
 * Internal dependencies
 */
import {
	JETPACK_CONNECTION_STATUS_FETCH,
	CONNECT_URL_FETCH,
	CONNECT_URL_FETCH_FAIL,
	CONNECT_URL_FETCH_SUCCESS,
	USER_CONNECTION_DATA_FETCH,
	USER_CONNECTION_DATA_FETCH_FAIL,
	USER_CONNECTION_DATA_FETCH_SUCCESS,
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS,
	UNLINK_USER,
	UNLINK_USER_FAIL,
	UNLINK_USER_SUCCESS
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

export const fetchConnectUrl = () => {
	return ( dispatch ) => {
		dispatch( {
			type: CONNECT_URL_FETCH
		} );
		return restApi.fetchConnectUrl().then( connectUrl => {
			dispatch( {
				type: CONNECT_URL_FETCH_SUCCESS,
				connectUrl: connectUrl
			} );
		} )['catch']( error => {
			dispatch( {
				type: CONNECT_URL_FETCH_FAIL,
				error: error
			} );
		} );
	}
}

export const fetchUserConnectionData = () => {
	return ( dispatch ) => {
		dispatch( {
			type: USER_CONNECTION_DATA_FETCH
		} );
		return restApi.fetchUserConnectionData().then( userConnectionData => {
			dispatch( {
				type: USER_CONNECTION_DATA_FETCH_SUCCESS,
				userConnectionData: userConnectionData
			} );
		} )['catch']( error => {
			dispatch( {
				type: USER_CONNECTION_DATA_FETCH_FAIL,
				error: error
			} );
		} );
	}
}

export const disconnectSite = () => {
	return ( dispatch ) => {
		dispatch( {
			type: DISCONNECT_SITE
		} );
		return restApi.disconnectSite().then( disconnectingSite => {
			dispatch( {
				type: DISCONNECT_SITE_SUCCESS,
				disconnectingSite: disconnectingSite
			} );
		} )['catch']( error => {
			dispatch( {
				type: DISCONNECT_SITE_FAIL,
				error: error
			} );
		} );
	}
}

export const unlinkUser = () => {
	return ( dispatch ) => {
		dispatch( {
			type: UNLINK_USER
		} );
		return restApi.unlinkUser().then( userUnlinked => {
			dispatch( {
				type: UNLINK_USER_SUCCESS,
				userUnlinked: userUnlinked
			} );
		} )['catch']( error => {
			dispatch( {
				type: UNLINK_USER_FAIL,
				error: error
			} );
		} );
	}
}
