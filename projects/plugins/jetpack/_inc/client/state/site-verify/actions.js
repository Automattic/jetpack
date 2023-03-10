import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';
import { createNotice } from 'components/global-notices/state/notices/actions';
import {
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH,
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_FAIL,
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_SUCCESS,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST_SUCCESS,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST_FAIL,
} from 'state/action-types';

export const checkVerifyStatusGoogle = ( keyringId = null ) => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH,
		} );
		return restApi
			.fetchVerifySiteGoogleStatus( keyringId )
			.then( data => {
				if ( data.errors && data.errors.length > 0 ) {
					const errorCode = Object.keys( data.errors )[ 0 ];
					const errorMessage = data.errors[ errorCode ];
					dispatch( {
						type: JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_FAIL,
						error: {
							code: errorCode,
							message: errorMessage,
						},
					} );
					return data;
				}

				dispatch( {
					type: JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_SUCCESS,
					verified: data.verified,
					token: data.token,
					isOwner: data.is_owner,
					searchConsoleUrl: data.google_search_console_url,
					verificationConsoleUrl: data.google_verification_console_url,
				} );

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_FAIL,
					error: error.response,
				} );
			} );
	};
};

export const verifySiteGoogle = keyringId => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SITE_VERIFY_GOOGLE_REQUEST,
		} );
		return restApi
			.verifySiteGoogle( keyringId )
			.then( data => {
				if ( data.errors && data.errors.length > 0 ) {
					const errorCode = Object.keys( data.errors )[ 0 ];
					const errorMessage = data.errors[ errorCode ];
					dispatch( {
						type: JETPACK_SITE_VERIFY_GOOGLE_REQUEST_FAIL,
						error: {
							code: errorCode,
							message: errorMessage,
						},
					} );
					return data;
				}

				dispatch( {
					verified: data.verified,
					isOwner: data.is_owner,
					searchConsoleUrl: data.google_search_console_url,
					verificationConsoleUrl: data.google_verification_console_url,
					type: JETPACK_SITE_VERIFY_GOOGLE_REQUEST_SUCCESS,
				} );

				if ( data.verified ) {
					dispatch(
						createNotice( 'is-success', __( 'Site is verified', 'jetpack' ), {
							id: 'verify-site-google-verified',
							duration: 2000,
						} )
					);
				}

				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SITE_VERIFY_GOOGLE_REQUEST_FAIL,
					error: error.response,
				} );
			} );
	};
};
