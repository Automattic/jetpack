/**
 * External dependencies
 */
import { get, assign } from 'lodash';
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import {
	JETPACK_CONNECTION_STATUS_FETCH,
	USER_CONNECTION_DATA_FETCH_SUCCESS,
} from 'state/action-types';

/**
 * Returns true if site is connected to WordPress.com
 *
 * @param  {object}      state -  Global state tree
 * @param state
 * @returns {bool|string} True if site is connected, False if it is not, 'offline' if site is in offline mode.
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
 * Checks if the site is currently in offline mode.
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @returns {boolean} True if site is in offline mode. False otherwise.
 */
export function isOfflineMode( state ) {
	return 'offline' === getSiteConnectionStatus( state );
}

/**
 * Returns true if current user is linked to WordPress.com
 *
 * @param  {object} state -  Global state tree
 * @param state
 * @returns {bool} true if the current user is connected to WP.com, false otherwise
 */
export function isCurrentUserLinked( state ) {
	return !! state.jetpack.connection.user.currentUser.isConnected;
}

/**
 * Checks if the current module is unavailable in offline mode.
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @param  {string}  module- -  Module slug.
 * @param module
 * @returns {boolean} True if site is in offline mode and module requires connection. False otherwise.
 */
export function isUnavailableInOfflineMode( state, module ) {
	return isOfflineMode( state ) && module === 'search';
}

/**
 * Checks if the current module is unavailable in Site Connection mode.
 *
 * @param  {object} state - Global state tree
 * @param  {string} module - Module slug.
 * @returns {boolean} True if site is in Site Connection mode and module requires connection. False otherwise.
 */
export function isUnavailableInSiteConnectionMode( state, module ) {
	return ! hasConnectedOwner( state ) && module === 'search';
}

/**
 * Returns true if the site has a connected owner.
 *
 * @param  {object} state - Global state tree
 * @returns {boolean} true if the site has an owner connected, false otherwise
 */
export function hasConnectedOwner( state ) {
	return get( state.jetpack.connection.status, [ 'siteConnected', 'hasConnectedOwner' ], false );
}

export const status = (
	state = { siteConnected: window.Initial_State.connectionStatus },
	action
) => {
	switch ( action.type ) {
		case JETPACK_CONNECTION_STATUS_FETCH:
			return assign( {}, state, { siteConnected: action.siteConnected } );
		case USER_CONNECTION_DATA_FETCH_SUCCESS:
			if ( true === action.userConnectionData?.currentUser?.isConnected ) {
				return assign( {}, state, {
					siteConnected: {
						...state.siteConnected,
						hasConnectedOwner: true,
					},
				} );
			}

			return state;
		default:
			return state;
	}
};

export const user = ( state = window.Initial_State.userData, action ) => {
	switch ( action.type ) {
		case USER_CONNECTION_DATA_FETCH_SUCCESS:
			return assign( {}, state, action.userConnectionData );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	status,
	user,
} );
