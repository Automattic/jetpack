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
	CONNECT_URL_FETCH_SUCCESS,
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS
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

const requests = ( state = { disconnectingSite: false }, action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE:
			return assign( {}, state, { disconnectingSite: true } );
		case DISCONNECT_SITE_FAIL:
		case DISCONNECT_SITE_SUCCESS:
			return assign( {}, state, { disconnectingSite: false } );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	connectUrl,
	status,
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
