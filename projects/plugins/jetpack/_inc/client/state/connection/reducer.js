/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, get, includes, merge } from 'lodash';

/**
 * Internal dependencies
 */
import {
	JETPACK_CONNECTION_STATUS_FETCH,
	JETPACK_SET_INITIAL_STATE,
	CONNECT_URL_FETCH,
	CONNECT_URL_FETCH_FAIL,
	CONNECT_URL_FETCH_SUCCESS,
	USER_CONNECTION_DATA_FETCH,
	USER_CONNECTION_DATA_FETCH_FAIL,
	USER_CONNECTION_DATA_FETCH_SUCCESS,
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS,
	AUTH_USER_IN_PLACE,
	AUTH_USER_IN_PLACE_SUCCESS,
	UNLINK_USER,
	UNLINK_USER_FAIL,
	UNLINK_USER_SUCCESS,
	MOCK_SWITCH_USER_PERMISSIONS,
	SITE_RECONNECT,
	SITE_RECONNECT_FAIL,
	SITE_RECONNECT_SUCCESS,
} from 'state/action-types';
import { getModulesThatRequireConnection } from 'state/modules';

export const status = (
	state = { siteConnected: window.Initial_State.connectionStatus },
	action
) => {
	switch ( action.type ) {
		case JETPACK_CONNECTION_STATUS_FETCH:
			return assign( {}, state, { siteConnected: action.siteConnected } );
		case DISCONNECT_SITE_SUCCESS:
			return assign( {}, state, { siteConnected: action.siteConnected } );

		default:
			return state;
	}
};

export const connectUrl = ( state = '', action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return get( action, 'initialState.connectUrl', state );
		case CONNECT_URL_FETCH_SUCCESS:
			return action.connectUrl;
		default:
			return state;
	}
};

export const user = ( state = window.Initial_State.userData, action ) => {
	switch ( action.type ) {
		case USER_CONNECTION_DATA_FETCH_SUCCESS:
			return assign( {}, state, action.userConnectionData );

		case UNLINK_USER_SUCCESS:
			const currentUser = assign( {}, state.currentUser, { isConnected: false } );
			return assign( {}, state, { currentUser } );

		case MOCK_SWITCH_USER_PERMISSIONS:
			return merge( {}, state, action.initialState );

		default:
			return state;
	}
};

export const connectionRequests = {
	disconnectingSite: false,
	authorizingUserInPlace: false,
	unlinkingUser: false,
	fetchingConnectUrl: false,
	fetchingUserData: false,
	reconnectingSite: false,
};

export const requests = ( state = connectionRequests, action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE:
			return assign( {}, state, { disconnectingSite: true } );
		case UNLINK_USER:
			return assign( {}, state, { unlinkingUser: true } );
		case AUTH_USER_IN_PLACE:
			return assign( {}, state, { authorizingUserInPlace: true } );
		case AUTH_USER_IN_PLACE_SUCCESS:
			return assign( {}, state, { authorizingUserInPlace: false } );
		case CONNECT_URL_FETCH:
			return assign( {}, state, { fetchingConnectUrl: true } );
		case USER_CONNECTION_DATA_FETCH:
			return assign( {}, state, { fetchingUserData: true } );
		case SITE_RECONNECT:
			return assign( {}, state, { reconnectingSite: true } );

		case DISCONNECT_SITE_FAIL:
		case DISCONNECT_SITE_SUCCESS:
			return assign( {}, state, { disconnectingSite: false } );

		case UNLINK_USER_FAIL:
		case UNLINK_USER_SUCCESS:
			return assign( {}, state, { unlinkingUser: false } );

		case CONNECT_URL_FETCH_FAIL:
		case CONNECT_URL_FETCH_SUCCESS:
			return assign( {}, state, { fetchingConnectUrl: false } );
		case USER_CONNECTION_DATA_FETCH_FAIL:
		case USER_CONNECTION_DATA_FETCH_SUCCESS:
			return assign( {}, state, { fetchingUserData: false } );

		case SITE_RECONNECT_FAIL:
		case SITE_RECONNECT_SUCCESS:
			return assign( {}, state, { reconnectingSite: false } );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	connectUrl,
	status,
	user,
	requests,
} );

/**
 * Returns true if site is connected to WordPress.com
 *
 * @param  {Object}      state Global state tree
 * @return {bool|string} True if site is connected, False if it is not, 'offline' if site is in offline mode.
 */
export function getSiteConnectionStatus( state ) {
	if ( 'object' !== typeof state.jetpack.connection.status.siteConnected ) {
		return false;
	}
	if ( state.jetpack.connection.status.siteConnected.offlineMode.isActive ) {
		return 'offline';
	}
	return state.jetpack.connection.status.siteConnected.isActive;
}

/**
 * Checks if the site is connected to WordPress.com. Unlike getSiteConnectionStatus, this one returns only a boolean.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is connected to WordPress.com. False if site is in Offline Mode or there's no connection data.
 */
export function isSiteConnected( state ) {
	if (
		'object' !== typeof state.jetpack.connection.status.siteConnected ||
		true === state.jetpack.connection.status.siteConnected.offlineMode.isActive
	) {
		return false;
	}
	return state.jetpack.connection.status.siteConnected.isActive;
}

/**
 * Returns an object with information about the Offline Mode.
 *
 * @param  {Object}      state Global state tree
 * @return {bool|object} False if site is not in Offline Mode. If it is, returns an object with information about the Offline Mode.
 */
export function getSiteOfflineMode( state ) {
	if ( get( state.jetpack.connection.status, [ 'siteConnected', 'offlineMode', 'isActive' ] ) ) {
		return get( state.jetpack.connection.status, [ 'siteConnected', 'offlineMode' ] );
	}
	return false;
}

/**
 * Returns string/URL to make a connection to WordPress.com
 *
 * @param  {Object} state Global state tree
 * @return {String}       URL for connecting to WordPress.com
 */
export function getConnectUrl( state ) {
	return state.jetpack.connection.connectUrl;
}

/**
 * Returns an object with information about the WP.com connected user
 *
 * @param  {Object} state Global state tree
 * @return {object}       Returns an object with information about the connected user
 */
export function getConnectedWpComUser( state ) {
	return state.jetpack.connection.user.currentUser.wpcomUser;
}

/**
 * Returns true if currently disconnecting the site
 *
 * @param  {Object} state Global state tree
 * @return {bool}         True if site is being disconnected
 */
export function isDisconnectingSite( state ) {
	return !! state.jetpack.connection.requests.disconnectingSite;
}

/**
 * Returns true if currently fetching connectUrl
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if currently fetching connectUrl, false otherwise
 */
export function isFetchingConnectUrl( state ) {
	return !! state.jetpack.connection.requests.fetchingConnectUrl;
}

/**
 * Returns true if currently unlinking the user
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if currently unlinking a user, false otherwise
 */
export function isUnlinkingUser( state ) {
	return !! state.jetpack.connection.requests.unlinkingUser;
}

/**
 * Returns true if currently linking the user
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if currently linking a user, false otherwise
 */
export function isAuthorizingUserInPlace( state ) {
	return !! state.jetpack.connection.requests.authorizingUserInPlace;
}

/**
 * Returns true if currently fetching user data
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if currently fetching user data, false otherwise
 */
export function isFetchingUserData( state ) {
	return !! state.jetpack.connection.requests.fetchingUserData;
}

/**
 * Returns true if current user is linked to WordPress.com
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if the current user is connected to WP.com, false otherwise
 */
export function isCurrentUserLinked( state ) {
	return !! state.jetpack.connection.user.currentUser.isConnected;
}

/**
 * Returns true if current user is connection owner.
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if the current user is connection owner, false otherwise
 */
export function isConnectionOwner( state ) {
	return !! state.jetpack.connection.user.currentUser.isMaster;
}

/**
 * Checks if the site is currently in offline mode.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is in offline mode. False otherwise.
 */
export function isOfflineMode( state ) {
	return 'offline' === getSiteConnectionStatus( state );
}

/**
 * Checks if the site is currently in staging.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is in staging. False otherwise.
 */
export function isStaging( state ) {
	return get( state.jetpack.connection.status, [ 'siteConnected', 'isStaging' ], false );
}

/**
 * Checks if the site is currently in an Identity Crisis.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is in IDC. False otherwise.
 */
export function isInIdentityCrisis( state ) {
	return get( state.jetpack.connection.status, [ 'siteConnected', 'isInIdentityCrisis' ], false );
}

/**
 * Checks if the module requires connection.
 *
 * @param  {Object}  state Global state tree
 * @param  {String}  slug Module slug.
 * @return {boolean} True if module requires connection.
 */
export function requiresConnection( state, slug ) {
	return includes( getModulesThatRequireConnection( state ).concat( [ 'backups', 'scan' ] ), slug );
}

/**
 * Checks if the current module is unavailable in offline mode.
 *
 * @param  {Object}  state Global state tree
 * @param  {String}  module Module slug.
 * @return {boolean} True if site is in offline mode and module requires connection. False otherwise.
 */
export function isUnavailableInOfflineMode( state, module ) {
	return isOfflineMode( state ) && requiresConnection( state, module );
}

/**
 * Checks if the JETPACK__SANDBOX_DOMAIN is set
 *
 * @param  {Object} state Global state tree
 * @return {string} Value of the JETPACK__SANDBOX_DOMAIN constant. Empty string if not sandboxed - url if so.
 */
export function getSandboxDomain( state ) {
	return get( state.jetpack.connection.status, [ 'siteConnected', 'sandboxDomain' ], '' );
}

/**
 * Check if the reconnect requested.
 *
 * @param  {Object} state Global state tree.
 * @return {boolean} True if the reconnecting is required, false otherwise.
 */
export function isReconnectingSite( state ) {
	return !! state.jetpack.connection.requests.reconnectingSite;
}
