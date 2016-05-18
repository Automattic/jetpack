/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import assign from 'lodash/assign';

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

const status = ( state = { siteConnected: window.Initial_State.connectionStatus }, action ) => {
	switch ( action.type ) {
		case JETPACK_CONNECTION_STATUS_FETCH:
			return assign( {}, state, { siteConnected: action.siteConnected } );
		case DISCONNECT_SITE_SUCCESS:
			return assign( {}, state, { siteConnected: action.siteConnected } );

		default:
			return state;
	}
};

const connectUrl = ( state = {}, action ) => {
	switch ( action.type ) {
		case CONNECT_URL_FETCH_SUCCESS:
			return action.connectUrl;

		default:
			return state;
	}
};

const user = ( state = window.Initial_State.userData, action ) => {
	switch ( action.type ) {
		case USER_CONNECTION_DATA_FETCH_SUCCESS:
			return assign( {}, state, action.userConnectionData );

		case UNLINK_USER_SUCCESS:
			let currentUser = assign( {}, state.currentUser, { isConnected: false } );
			return assign( {}, state, { currentUser } );

		default:
			return state;
	}
};

const connectionRequests = {
	disconnectingSite: false,
	unlinkingUser: false,
	fetchingConnectUrl: false,
	fetchingUserData: false
};

const requests = ( state = connectionRequests, action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE:
			return assign( {}, state, { disconnectingSite: true } );
		case UNLINK_USER:
			return assign( {}, state, { unlinkingUser: true } );
		case CONNECT_URL_FETCH:
			return assign( {}, state, { fetchingConnectUrl: true } );
		case USER_CONNECTION_DATA_FETCH:
			return assign( {}, state, { fetchingUserData: true } );

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

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	connectUrl,
	status,
	user,
	requests
} );

/**
 * Returns true if site is connected to WordPress.com
 *
 * @param  {Object} state Global state tree
 * @return {bool}         True if site is connected, False if it is not.
 */
export function getSiteConnectionStatus( state ) {
	return state.jetpack.connection.status.siteConnected;
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
