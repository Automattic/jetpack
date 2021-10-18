/**
 * External dependencies
 */
import { assign, get, merge } from 'lodash';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { JETPACK_SET_INITIAL_STATE, MOCK_SWITCH_USER_PERMISSIONS } from 'state/action-types';
import { isCurrentUserLinked } from 'state/connection';
import { getPlanDuration } from 'state/plans/reducer';

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
 * Return an upgrade URL
 *
 * @param {object} state - Global state tree
 * @param {string} source - Context where this URL is clicked.
 * @param {string} userId - Current user id.
 * @param {boolean} planDuration - Add plan duration to the URL.
 * @returns {string} Upgrade URL with source, site, and affiliate code added.
 */
export const getUpgradeUrl = ( state, source, userId = '', planDuration = false ) => {
	const uid = userId || getUserId( state );
	const purchaseToken = getPurchaseToken( state );

	if ( planDuration && 'monthly' === getPlanDuration( state ) ) {
		source += '-monthly';
	}

	const redirectArgs = {
		site: getSiteRawUrl( state ),
	};

	if ( uid ) {
		redirectArgs.u = uid;
	}

	redirectArgs.query = '';

	if ( ! isCurrentUserLinked( state ) ) {
		redirectArgs.query += 'unlinked=1&';
	}

	if ( purchaseToken ) {
		redirectArgs.query += `purchasetoken=${ purchaseToken }`;
	}

	return getRedirectUrl( source, redirectArgs );
};

/**
 * Gets the current wp-admin user id
 *
 * @param {object} state - Global state tree
 * @returns {int} The user id in wp-admin
 */
export function getUserId( state ) {
	return get( state.jetpack.initialState.userData.currentUser, 'id', '' );
}

/**
 * Returns a purchase token that is used for Jetpack logged out visitor checkout.
 *
 * @param {object} state - Global state tree
 * @returns {string|boolean} purchase token or false if not the connection owner.
 */
export function getPurchaseToken( state ) {
	return get( state.jetpack.initialState, 'purchaseToken' );
}

/**
 * @param state
 */
export function getSiteRawUrl( state ) {
	return get( state.jetpack.initialState, 'rawUrl', {} );
}

/**
 * @param state
 */
export function getSiteAdminUrl( state ) {
	return get( state.jetpack.initialState, 'adminUrl', {} );
}

/**
 * Check if promotions like banners are visible or hidden.
 *
 * @param {object} state - Global state tree
 * @returns {boolean} True if promotions are active, false otherwise.
 */
export function arePromotionsActive( state ) {
	return get( state.jetpack.initialState.siteData, 'showPromotions', true );
}

/**
 * @param state
 */
export function getCurrentIp( state ) {
	return get( state.jetpack.initialState, 'currentIp' );
}

/**
 * @param state
 */
export function getSiteRoles( state ) {
	return get( state.jetpack.initialState.stats, 'roles', {} );
}

/**
 * @param state
 */
export function getAdminEmailAddress( state ) {
	return get( state.jetpack.initialState, [ 'userData', 'currentUser', 'wpcomUser', 'email' ] );
}

/**
 * @param state
 */
export function userCanManageModules( state ) {
	return get(
		state.jetpack.initialState.userData.currentUser.permissions,
		'manage_modules',
		false
	);
}

/**
 * @param state
 */
export function isSitePublic( state ) {
	return get( state.jetpack.initialState, [ 'connectionStatus', 'isPublic' ] );
}

/**
 * @param state
 */
export function getApiNonce( state ) {
	return get( state.jetpack.initialState, 'WP_API_nonce' );
}

/**
 * @param state
 */
export function getApiRootUrl( state ) {
	return get( state.jetpack.initialState, 'WP_API_root' );
}

/**
 * Returns a string of the current Jetpack version defined
 * by JETPACK__VERSION
 *
 * @param  {object}  state -  Global state tree
 * @returns {string}         Version number. Empty string if the data is not yet available.
 */
export function getCurrentVersion( state ) {
	return get( state.jetpack.initialState, 'currentVersion', '' );
}

/**
 * Return true if user can edit posts, usually admins, editors, authors and contributors.
 *
 * @param {object} state - Global state tree
 * @returns {bool} Whether user can edit posts.
 */
export function userCanEditPosts( state ) {
	return get( state.jetpack.initialState.userData.currentUser.permissions, 'edit_posts', false );
}

/**
 * @param state
 */
export function getTracksUserData( state ) {
	return get( state.jetpack.initialState, 'tracksUserData' );
}

/**
 * Check if the user is on Safari browser.
 *
 * @param {object} state   - Global state tree.
 * @returns {boolean} True the user is on Safari browser.
 */
export function isSafari( state ) {
	return !! state.jetpack.initialState.isSafari;
}

/**
 * Check if the `JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME` constant is true.
 *
 * @param {object} state   - Global state tree.
 * @returns {boolean} True, the `JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME` constant is true.
 */
export function doNotUseConnectionIframe( state ) {
	return !! state.jetpack.initialState.doNotUseConnectionIframe;
}
