/**
 * Internal dependencies
 */
import {
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH,
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_FAIL,
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_SUCCESS,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST_SUCCESS,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST_FAIL,
} from 'state/action-types';

import restApi from 'rest-api';
import { translate as __ } from 'i18n-calypso';
import { createNotice } from 'components/global-notices/state/notices/actions';

export const checkVerifyStatusGoogle = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH
		} );
		return restApi.fetchVerifySiteGoogleStatus().then( data => {
			dispatch( {
				type: JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_SUCCESS,
				verified: data.verified,
				token: data.token,
				google_search_console_url: data.google_search_console_url,
				google_verification_console_url: data.google_verification_console_url,
			} );

			return data;
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_FAIL,
				error: error.response,
			} );

			return error.response;
		} );
	};
};

export const verifySiteGoogle = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SITE_VERIFY_GOOGLE_REQUEST
		} );
		return restApi.verifySiteGoogle().then( data => {
			dispatch( {
				verified: data.verified,
				google_search_console_url: data.google_search_console_url,
				google_verification_console_url: data.google_verification_console_url,
				type: JETPACK_SITE_VERIFY_GOOGLE_REQUEST_SUCCESS,
			} );

			if ( data.verified ) {
				dispatch( createNotice( 'is-success', __( 'Site is verified' ), { id: 'verify-site-google-verified', duration: 2000 } ) );
			}

			return data;
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SITE_VERIFY_GOOGLE_REQUEST_FAIL,
				error: error.response,
			} );

			return error.response;
		} );
	};
};

