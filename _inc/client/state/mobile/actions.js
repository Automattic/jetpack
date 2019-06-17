/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
} from 'state/action-types';
import { translate as __ } from 'i18n-calypso';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';

export const sendMobileLoginEmail = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
		} );
		dispatch( removeNotice( 'mobile-login-email-send' ) );
		dispatch( removeNotice( 'mobile-login-email-sent' ) );
		dispatch( removeNotice( 'mobile-login-email-error' ) );
		dispatch(
			createNotice( 'is-info', __( 'Sending login email…' ), {
				id: 'mobile-login-email-send',
			} )
		);
		return restApi
			.sendMobileLoginEmail()
			.then( data => {
				dispatch( removeNotice( 'mobile-login-email-send' ) );
				dispatch( {
					type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
				} );
				dispatch(
					createNotice( 'is-success', __( 'Login email sent' ), {
						id: 'mobile-login-email-sent',
						duration: 2000,
					} )
				);

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
					error: error.response,
				} );
				dispatch( removeNotice( 'mobile-login-email-send' ) );
				dispatch(
					createNotice( 'is-error', __( 'Failed to send login email' ), {
						id: 'mobile-login-email-error',
					} )
				);
			} );
	};
};
