/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import assign from 'lodash/assign';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import {
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH,
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL,
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
} from 'state/action-types';

export const mobile = (
	state = { fetchingIsMobileUser: false, sendingLoginEmail: false, loginEmailSent: false },
	action
) => {
	switch ( action.type ) {
		case JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH:
			return assign( {}, state, {
				fetchingIsMobileUser: true,
			} );
		case JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL:
			return assign( {}, state, {
				fetchingIsMobileUser: false,
				error: action.error,
			} );
		case JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_SUCCESS:
			return assign( {}, state, {
				fetchingIsMobileUser: false,
				isMobileUser: action.isMobileUser,
				error: null,
			} );
		case JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL:
			return assign( {}, state, {
				sendingLoginEmail: true,
			} );
		case JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS:
			return assign( {}, state, {
				sendingLoginEmail: false,
				loginEmailSent: action.loginEmailSent,
				error: null,
			} );
		case JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL:
			return assign( {}, state, {
				sendingLoginEmail: false,
				loginEmailSent: false,
				error: action.error,
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	mobile,
} );

/**
 * Returns true if currently requesting whether the user is a mobile app user
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether mobile user status is being checked
 */
export function isFetchingIsMobileUser( state ) {
	return get( state, 'jetpack.mobile.fetchingIsMobileUser', false );
}

/**
 * Returns true if the user is a mobile app user
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether the user is using mobile apps
 */
export function isMobileUser( state ) {
	return get( state, 'jetpack.mobile.isMobileUser', false );
}

/**
 * Returns true if currently trying to send a login email
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether email is being sent
 */
export function isSendingMobileLoginEmail( state ) {
	return get( state, 'jetpack.mobile.sendingLoginEmail', false );
}

export function sentMobileLoginEmail( state ) {
	return get( state, 'jetpack.mobile.loginEmailSent', false );
}

export function getMobileLoginEmailError( state ) {
	return get( state, 'jetpack.mobile.error', null );
}
