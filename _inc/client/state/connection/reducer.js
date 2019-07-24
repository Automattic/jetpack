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
	JETPACK_CONNECTION_STATUS_FETCH_SUCCESS,
	JETPACK_CONNECTION_STATUS_FETCH_FAIL,
	AUTHORIZE_URL_FETCH,
	AUTHORIZE_URL_FETCH_SUCCESS,
	AUTHORIZE_URL_FETCH_FAIL,
	JETPACK_SET_INITIAL_STATE,
	USER_CONNECTION_DATA_FETCH,
	USER_CONNECTION_DATA_FETCH_FAIL,
	USER_CONNECTION_DATA_FETCH_SUCCESS,
	REGISTER_SITE,
	REGISTER_SITE_FAIL,
	REGISTER_SITE_SUCCESS,
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS,
	UNLINK_USER,
	UNLINK_USER_FAIL,
	UNLINK_USER_SUCCESS,
	MOCK_SWITCH_USER_PERMISSIONS,
} from 'state/action-types';
import { getModulesThatRequireConnection } from 'state/modules';

export const status = (
	state = { siteConnectionData: window.Initial_State.connectionStatus },
	action
) => {
	switch ( action.type ) {
		case JETPACK_CONNECTION_STATUS_FETCH_SUCCESS:
			return assign( {}, state, { siteConnectionData: action.siteConnectionData } );
		case DISCONNECT_SITE_SUCCESS:
			return assign( {}, state, { siteConnectionData: action.siteConnectionData } );
		default:
			return state;
	}
};

export const connectUrl = ( state = '', action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return get( action, 'initialState.connectUrl', state );
		default:
			return state;
	}
};

export const authorizeUrl = ( state = '', action ) => {
	switch ( action.type ) {
		case AUTHORIZE_URL_FETCH_SUCCESS:
			return get( action, 'authorizeUrl', state );
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
	unlinkingUser: false,
	fetchingUserData: false,
	fetchingConnectionStatus: false,
	registeringSite: false,
	fetchingAuthorizeUrl: false,
};

export const requests = ( state = connectionRequests, action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE:
			return assign( {}, state, { disconnectingSite: true } );
		case UNLINK_USER:
			return assign( {}, state, { unlinkingUser: true } );
		case USER_CONNECTION_DATA_FETCH:
			return assign( {}, state, { fetchingUserData: true } );
		case JETPACK_CONNECTION_STATUS_FETCH:
			return assign( {}, state, { fetchingConnectionStatus: true } );
		case REGISTER_SITE:
			return assign( {}, state, { registeringSite: true } );
		case AUTHORIZE_URL_FETCH:
			return assign( {}, state, { fetchingAuthorizeUrl: true } );

		case DISCONNECT_SITE_FAIL:
		case DISCONNECT_SITE_SUCCESS:
			return assign( {}, state, { disconnectingSite: false } );

		case UNLINK_USER_FAIL:
		case UNLINK_USER_SUCCESS:
			return assign( {}, state, { unlinkingUser: false } );

		case USER_CONNECTION_DATA_FETCH_FAIL:
		case USER_CONNECTION_DATA_FETCH_SUCCESS:
			return assign( {}, state, { fetchingUserData: false } );

		case JETPACK_CONNECTION_STATUS_FETCH_FAIL:
		case JETPACK_CONNECTION_STATUS_FETCH_SUCCESS:
			return assign( {}, state, { fetchingConnectionStatus: false } );

		case REGISTER_SITE_FAIL:
		case REGISTER_SITE_SUCCESS:
			return assign( {}, state, { registeringSite: false } );

		case AUTHORIZE_URL_FETCH_FAIL:
		case AUTHORIZE_URL_FETCH_SUCCESS:
			return assign( {}, state, { fetchingAuthorizeUrl: false } );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	connectUrl,
	authorizeUrl,
	status,
	user,
	requests,
} );

/**
 * Returns true if site is connected to WordPress.com
 *
 * @param  {Object}      state Global state tree
 * @return {bool|string} True if site is connected, False if it is not, 'dev' if site is in development mode.
 */
export function getSiteConnectionStatus( state ) {
	if ( 'object' !== typeof state.jetpack.connection.status.siteConnectionData ) {
		return false;
	}
	if ( state.jetpack.connection.status.siteConnectionData.devMode.isActive ) {
		return 'dev';
	}
	return state.jetpack.connection.status.siteConnectionData.isActive;
}

/**
 * Returns true if site is registered with WordPress.com, but may or may not be fully connected
 *
 * @param  {Object}      state Global state tree
 * @return {bool|string} True if site is registered, False if it is not
 */
export function isSiteRegistered( state ) {
	if ( 'object' !== typeof state.jetpack.connection.status.siteConnectionData ) {
		return false;
	}
	return state.jetpack.connection.status.siteConnectionData.isRegistered;
}

export function isSiteRegistering( state ) {
	return !! state.jetpack.connection.requests.registeringSite;
}

/**
 * Returns true if currently fetching connection status
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if currently fetching connection status, false otherwise
 */
export function isFetchingConnectionStatus( state ) {
	return !! state.jetpack.connection.requests.fetchingConnectionStatus;
}

/**
 * Returns true if currently fetching connection status
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if currently fetching connection status, false otherwise
 */
export function isFetchingAuthorizeUrl( state ) {
	return !! state.jetpack.connection.requests.fetchingAuthorizeUrl;
}

/**
 * Checks if the site is connected to WordPress.com. Unlike getSiteConnectionStatus, this one returns only a boolean.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is connected to WordPress.com. False if site is in Dev Mode or there's no connection data.
 */
export function isSiteConnected( state ) {
	if (
		'object' !== typeof state.jetpack.connection.status.siteConnectionData ||
		true === state.jetpack.connection.status.siteConnectionData.devMode.isActive
	) {
		return false;
	}
	return state.jetpack.connection.status.siteConnectionData.isActive;
}

/**
 * Returns an object with information about the Dev Mode.
 *
 * @param  {Object}      state Global state tree
 * @return {bool|object} False if site is not in Dev Mode. If it is, returns an object with information about the Dev Mode.
 */
export function getSiteDevMode( state ) {
	if ( get( state.jetpack.connection.status, [ 'siteConnectionData', 'devMode', 'isActive' ] ) ) {
		return get( state.jetpack.connection.status, [ 'siteConnectionData', 'devMode' ] );
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
 * Returns string/URL to authorize to WordPress.com
 *
 * @param  {Object} state Global state tree
 * @return {String}       URL for connecting to WordPress.com
 */
export function getAuthorizeUrl( state ) {
	return state.jetpack.connection.authorizeUrl;
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
 * Returns true if currently unlinking the user
 *
 * @param  {Object} state Global state tree
 * @return {bool} true if currently unlinking a user, false otherwise
 */
export function isUnlinkingUser( state ) {
	return !! state.jetpack.connection.requests.unlinkingUser;
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
 * Checks if the site is currently in development mode.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is in dev mode. False otherwise.
 */
export function isDevMode( state ) {
	return 'dev' === getSiteConnectionStatus( state );
}

/**
 * Checks if the site is currently in staging.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is in staging. False otherwise.
 */
export function isStaging( state ) {
	return get( state.jetpack.connection.status, [ 'siteConnectionData', 'isStaging' ], false );
}

/**
 * Checks if the site is currently in an Identity Crisis.
 *
 * @param  {Object}  state Global state tree
 * @return {boolean} True if site is in IDC. False otherwise.
 */
export function isInIdentityCrisis( state ) {
	return get(
		state.jetpack.connection.status,
		[ 'siteConnectionData', 'isInIdentityCrisis' ],
		false
	);
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
 * Checks if the current module is unavailable in development mode.
 *
 * @param  {Object}  state Global state tree
 * @param  {String}  module Module slug.
 * @return {boolean} True if site is in dev mode and module requires connection. False otherwise.
 */
export function isUnavailableInDevMode( state, module ) {
	return isDevMode( state ) && requiresConnection( state, module );
}

/**
 * Checks if the JETPACK__SANDBOX_DOMAIN is set
 *
 * @param  {Object} state Global state tree
 * @return {string} Value of the JETPACK__SANDBOX_DOMAIN constant. Empty string if not sandboxed - url if so.
 */
export function getSandboxDomain( state ) {
	return get( state.jetpack.connection.status, [ 'siteConnectionData', 'sandboxDomain' ], '' );
}
