import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import {
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
} from 'state/action-types';

export const sendMobileLoginEmail = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
		} );
		dispatch( removeNotice( 'mobile-login-email-send' ) );
		dispatch( removeNotice( 'mobile-login-email-sent' ) );
		dispatch( removeNotice( 'mobile-login-email-error' ) );
		dispatch(
			createNotice( 'is-info', __( 'Sending login email…', 'jetpack' ), {
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
					createNotice( 'is-success', __( 'Login email sent', 'jetpack' ), {
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
					createNotice( 'is-error', __( 'Failed to send login email', 'jetpack' ), {
						id: 'mobile-login-email-error',
					} )
				);
			} );
	};
};
