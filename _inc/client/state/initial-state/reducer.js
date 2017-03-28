/**
 * External dependencies
 */
import assign from 'lodash/assign';
import merge from 'lodash/merge';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import {
	JETPACK_SET_INITIAL_STATE,
	MOCK_SWITCH_USER_PERMISSIONS
} from 'state/action-types';

export const initialState = ( state = window.Initial_State, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return assign( {}, state, action.initialState );

		case MOCK_SWITCH_USER_PERMISSIONS:
			return merge( {}, state, { userData: action.initialState } );

		default:
			return state;
	}
};

/**
 * Returns bool if current version is Dev version
 * Which means -alpha, -beta, etc...
 *
 * @param  {Object}  state  Global state tree
 * @return {bool} true if dev version
 */
export function isDevVersion( state ) {
	return !! state.jetpack.initialState.isDevVersion;
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

export function userIsSubscriber( state ) {
	return ! get( state.jetpack.initialState.userData.currentUser.permissions, 'edit_posts', false );
}

export function userCanPublish( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'publish_posts', false );
}

export function userCanManageModules( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'manage_modules', false );
}

export function userCanManageOptions( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'manage_options', false );
}

/**
 * Return true if user can edit posts, usually admins, editors, authors and contributors.
 *
 * @param {Object} state Global state tree
 *
 * @return {bool} Whether user can edit posts.
 */
export function userCanEditPosts( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'edit_posts', false );
}

/**
 * Return true if user can manage plugins, which means being able to install, activate, update and delete plugins.
 *
 * @param {Object} state Global state tree
 *
 * @return {bool} Whether user can manage plugins.
 */
export function userCanManagePlugins( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'manage_plugins', false );
}

export function userCanDisconnectSite( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'disconnect', false );
}

export function userIsMaster( state ) {
	return get( state.jetpack.initialState.userData.currentUser, 'isMaster', false );
}

export function getUserWpComLogin( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'login' ], '' );
}

export function getUserWpComEmail( state ) {
	return get( state.jetpack.initialState.userData.currentUser, [ 'wpcomUser', 'email' ], '' );
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

/**
 * Returns the site icon as an image URL.
 *
 * @param {object} state Global state tree
 *
 * @return string
 */
export function getSiteIcon( state ) {
	return get( state.jetpack.initialState.siteData, [ 'icon' ] );
}

/**
 * Check whether the site is accessible by search engines or not. It's true by default in an initial WP installation.
 *
 * @param {object} state Global state tree
 *
 * @return {boolean} False if site is set to discourage search engines from indexing it. True otherwise.
 */
export function isSiteVisibleToSearchEngines( state ) {
	return get( state.jetpack.initialState.siteData, [ 'siteVisibleToSearchEngines' ], true );
}

export function getApiNonce( state ) {
	return get( state.jetpack.initialState, 'WP_API_nonce' );
}

export function getApiRootUrl( state ) {
	return get( state.jetpack.initialState, 'WP_API_root' );
}

export function getTracksUserData( state ) {
	return get( state.jetpack.initialState, 'tracksUserData' );
}

export function getCurrentIp( state ) {
	return get( state.jetpack.initialState, 'currentIp' );
}

/**
 * Returns a permalink to the last published entry of 'post' type.
 *
 * @param {Object} state Global state tree
 *
 * @return {String} URL to last published post.
 */
export function getLastPostUrl( state ) {
	return get( state.jetpack.initialState, 'lastPostUrl' );
}

/**
 * Check if promotions like banners are visible or hidden.
 *
 * @param {object} state Global state tree
 *
 * @return {boolean} True if promotions are active, false otherwise.
 */
export function arePromotionsActive( state ) {
	return get( state.jetpack.initialState.siteData, 'showPromotions', true );
}

/**
 * Check that theme supports a certain feature
 *
 * @param {Object} state   Global state tree.
 * @param {string} feature Feature to check if current theme supports. Can be 'infinite-scroll'.
 *
 * @return {boolean} URL to last published post.
 */
export function currentThemeSupports( state, feature ) {
	return get( state.jetpack.initialState.themeData, [ 'support', feature ], false );
}
