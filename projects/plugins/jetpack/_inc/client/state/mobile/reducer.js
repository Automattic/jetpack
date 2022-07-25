import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
} from 'state/action-types';

export const mobile = (
	state = { sendingLoginEmail: false, loginEmailSent: false, error: null },
	action
) => {
	switch ( action.type ) {
		case JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL:
			return assign( {}, state, {
				sendingLoginEmail: true,
			} );
		case JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS:
			return assign( {}, state, {
				sendingLoginEmail: false,
				loginEmailSent: true,
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
 * Returns true if currently trying to send a login email
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether email is being sent
 */
export function isSendingMobileLoginEmail( state ) {
	return get( state, 'jetpack.mobile.sendingLoginEmail', false );
}

/**
 * Returns true if a login email has been sent in the current state of the application.
 *
 * @param {Object}  state Global state tree.
 * @return {Boolean}      Whether email has been sent.
 */
export function hasSentMobileLoginEmail( state ) {
	return get( state, 'jetpack.mobile.loginEmailSent', false );
}

/**
 * Returns an error object for the last magic login link or null.
 *
 * @param {Object}  state Global state tree.
 * @return {Object|null}  The error object if there is one.
 */
export function getMobileLoginEmailError( state ) {
	return get( state, 'jetpack.mobile.error', null );
}
