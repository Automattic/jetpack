/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH,
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL,
	JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
	JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
} from 'state/action-types';
import { translate as __ } from 'i18n-calypso';
import { createNotice } from 'components/global-notices/state/notices/actions';

export const checkIsMobileUser = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH,
		} );
		return restApi
			.fetchIsMobileUser()
			.then( data => {
				if ( data.errors && data.errors.length > 0 ) {
					const errorCode = Object.keys( data.errors )[ 0 ];
					const errorMessage = data.errors[ errorCode ];
					dispatch( {
						type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL,
						error: {
							code: errorCode,
							message: errorMessage,
						},
					} );
					return data;
				}

				dispatch( {
					type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_SUCCESS,
					isMobileUser: data, // TODO: indicate android, iOS, etc? Maybe not useful
				} );

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MOBILE_LOGIN_IS_MOBILE_USER_FETCH_FAIL,
					error: error.response,
				} );

				dispatch(
					createNotice(
						'is-error',
						__( 'Failed to check mobile user status: %(error)', {
							args: {
								error: error.response.message,
							},
						} ),
						{ id: 'mobile-check-is-user' }
					)
				);
			} );
	};
};

export const sendMobileLoginEmail = keyringId => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL,
		} );
		return restApi
			.sendMobileLoginEmail( keyringId )
			.then( data => {
				if ( data.errors && data.errors.length > 0 ) {
					const errorCode = Object.keys( data.errors )[ 0 ];
					const errorMessage = data.errors[ errorCode ];
					dispatch( {
						type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_FAIL,
						error: {
							code: errorCode,
							message: errorMessage,
						},
					} );
					return data;
				}

				dispatch( {
					type: JETPACK_MOBILE_LOGIN_SEND_LOGIN_EMAIL_SUCCESS,
				} );

				dispatch(
					createNotice( 'is-success', __( 'Login email sent' ), {
						id: 'mobile-sent-login-email',
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

				dispatch(
					createNotice(
						'is-error',
						__( 'Failed to send login email: %(error)', {
							args: {
								error: error.response.message,
							},
						} ),
						{ id: 'mobile-check-is-user' }
					)
				);
			} );
	};
};
