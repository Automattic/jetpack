/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_CONNECTION_STATUS_FETCH,
	DISCONNECT_SITE,
	DISCONNECT_SITE_FAIL,
	DISCONNECT_SITE_SUCCESS
} from 'state/action-types';

const status = ( state = { siteConnected: window.Initial_State.isSiteConnected }, action ) => {
	switch ( action.type ) {
		case JETPACK_CONNECTION_STATUS_FETCH:
			return Object.assign( {}, state, { siteConnected: action.siteConnected } );
		case DISCONNECT_SITE_SUCCESS:
			return Object.assign( {}, state, { siteConnected: action.siteConnected } );

		default:
			return state;
	}
};

const requests = ( state = { disconnectingSite: false }, action ) => {
	switch ( action.type ) {
		case DISCONNECT_SITE:
			return Object.assign( {}, state, { disconnectingSite: true } );
		case DISCONNECT_SITE_FAIL:
		case DISCONNECT_SITE_SUCCESS:
			return Object.assign( {}, state, { disconnectingSite: false } );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
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
	return state.jetpack.connection.status.siteConnected ? true : false;
}