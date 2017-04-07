/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { translate as __ } from 'i18n-calypso';

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
	};
};

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
		} ).catch( error => {
			dispatch( {
				type: CONNECT_URL_FETCH_FAIL,
				error: error
			} );
		} );
	};
};

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
		} ).catch( error => {
			dispatch( {
				type: USER_CONNECTION_DATA_FETCH_FAIL,
				error: error
			} );
		} );
	};
};

export const disconnectSite = () => {
	return ( dispatch ) => {
		dispatch( {
			type: DISCONNECT_SITE
		} );
		dispatch( createNotice( 'is-info', __( 'Disconnecting Jetpack' ), { id: 'disconnect-jetpack' } ) );
		return restApi.disconnectSite().then( disconnectingSite => {
			dispatch( {
				type: DISCONNECT_SITE_SUCCESS,
				disconnectingSite: disconnectingSite
			} );
			dispatch( removeNotice( 'disconnect-jetpack' ) );
		} ).catch( error => {
			dispatch( {
				type: DISCONNECT_SITE_FAIL,
				error: error
			} );
			dispatch( removeNotice( 'disconnect-jetpack' ) );
			dispatch( createNotice(
				'is-error',
				__( 'There was an error disconnecting Jetpack. Error: %(error)s', {
					args: {
						error: error
					}
				} ),
				{ id: 'disconnect-jetpack' }
			) );
		} );
	};
};

export const unlinkUser = () => {
	return ( dispatch ) => {
		dispatch( {
			type: UNLINK_USER
		} );
		dispatch( createNotice( 'is-info', __( 'Unlinking from WordPress.com' ), { id: 'unlink-user' } ) );
		return restApi.unlinkUser().then( userUnlinked => {
			dispatch( {
				type: UNLINK_USER_SUCCESS,
				userUnlinked: userUnlinked
			} );
			dispatch( removeNotice( 'unlink-user' ) );
			dispatch( createNotice( 'is-success', __( 'Unlinked from WordPress.com.' ), { id: 'unlink-user', duration: 2000 } ) );
		} ).catch( error => {
			dispatch( {
				type: UNLINK_USER_FAIL,
				error: error
			} );
			dispatch( removeNotice( 'unlink-user' ) );
			dispatch( createNotice(
				'is-error',
				__( 'Error unlinking from WordPress.com. %(error)s', {
					args: {
						error: error
					}
				} ),
				{ id: 'unlink-user' }
			) );
		} );
	};
};
