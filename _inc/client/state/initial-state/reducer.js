/**
 * External dependencies
 */
import assign from 'lodash/assign';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE } from 'state/action-types';

export const initialState = ( state = window.Initial_State, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return assign( {}, state, action.initialState );

		default:
			return state;
	}
};

/**
 * Returns an array of HE gravatar ID's
 *
 * @param  {Object}  state  Global state tree
 * @return {array}          array of IDs
 */
export function getHappinessGravatarIds( state ) {
	return state.jetpack.initialState.happinessGravIds;
}

/**
 * Returns bool if current version is Dev version
 * Which means -alpha, -beta, etc...
 *
 * @param  {Object}  state  Global state tree
 * @return {bool} true if dev version
 */
export function isDevVersion( state ) {
	return state.jetpack.initialState.isDevVersion;
}

/**
 * Returns a string of the current Jetpack version defined
 * by JETPACK__VERSION
 *
 * @param  {Object}  state  Global state tree
 * @return {string}         Version number
 */
export function getCurrentVersion( state ) {
	return state.jetpack.initialState.currentVersion;
}


export function getSiteRoles( state ) {
	return get( state.jetpack.initialState.stats, 'roles', {} );
}

export function getInitialStateStatsData( state ) {
	return get( state.jetpack.initialState.stats, 'data' );
}

export function getAdminEmailAddress( state ) {
	return get( state.jetpack.initialState, [ 'userData', 'currentUser', 'wpcomUser', 'email' ] );
}

export function getSiteRawUrl( state ) {
	return get( state.jetpack.initialState, 'rawUrl', {} );
}

export function getSiteAdminUrl( state ) {
	return get( state.jetpack.initialState, 'adminUrl', {} );
}

export function isSitePublic( state ) {
	return get( state.jetpack.initialState, [ 'connectionStatus', 'isPublic' ] );
}

export function userCanManageModules( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'manage_modules', false );
}

export function userCanManageOptions( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'manage_options', false );
}

export function userCanDisconnectSite( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'disconnect', false );
}

export function userIsMaster( state ) {
	return get( state.jetpack.initialState.userData.currentUser, 'isMaster', false );
}

export function getUserWpComLogin( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'login' ] );
}

export function getUserWpComEmail( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'email' ] );
}

export function getUserWpComAvatar( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'avatar' ] );
}

export function getUsername( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'username' ] );
}

export function userCanViewStats( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'view_stats', false );
}

export function getApiNonce( state ) {
	return get( state.jetpack.initialState, 'WP_API_nonce' );
}

export function getApiRootUrl( state ) {
	return get( state.jetpack.initialState, 'WP_API_root' );
}
