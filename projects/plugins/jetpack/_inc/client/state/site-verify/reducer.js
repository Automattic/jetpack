import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH,
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_FAIL,
	JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_SUCCESS,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST_SUCCESS,
	JETPACK_SITE_VERIFY_GOOGLE_REQUEST_FAIL,
} from 'state/action-types';

export const google = (
	state = { fetching: false, verifying: false, verified: false },
	action
) => {
	switch ( action.type ) {
		case JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH:
			return assign( {}, state, {
				fetching: true,
			} );
		case JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_FAIL:
			return assign( {}, state, {
				fetching: false,
				error: action.error,
			} );
		case JETPACK_SITE_VERIFY_GOOGLE_STATUS_FETCH_SUCCESS:
			return assign( {}, state, {
				fetching: false,
				verified: action.verified,
				isOwner: action.isOwner,
				searchConsoleUrl: action.searchConsoleUrl,
				verificationConsoleUrl: action.verificationConsoleUrl,
				token: action.token,
				error: null,
			} );
		case JETPACK_SITE_VERIFY_GOOGLE_REQUEST:
			return assign( {}, state, {
				verifying: true,
			} );
		case JETPACK_SITE_VERIFY_GOOGLE_REQUEST_SUCCESS:
			return assign( {}, state, {
				verifying: false,
				verified: action.verified,
				isOwner: action.isOwner,
				searchConsoleUrl: action.searchConsoleUrl,
				verificationConsoleUrl: action.verificationConsoleUrl,
				error: null,
			} );
		case JETPACK_SITE_VERIFY_GOOGLE_REQUEST_FAIL:
			return assign( {}, state, {
				verifying: false,
				verified: false,
				error: action.error,
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	google,
} );

/**
 * Returns true if currently requesting settings lists or false
 * otherwise.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether settings are being requested
 */
export function isFetchingGoogleSiteVerify( state ) {
	return get( state, 'jetpack.siteVerify.google.fetching', false );
}

/**
 * Returns true if currently verifying a site or false
 * otherwise.
 *
 * @param  {Object}  state Global state tree
 * @return {Boolean}       Whether settings is being verified
 */
export function isVerifyingGoogleSite( state ) {
	return get( state, 'jetpack.siteVerify.google.verifying', false );
}

export function isConnectedToGoogleSiteVerificationAPI( state ) {
	return (
		! isFetchingGoogleSiteVerify( state ) &&
		get( state, 'jetpack.siteVerify.google.error.code', null ) !== 'no_token_for_user'
	);
}

export function isSiteVerifiedWithGoogle( state ) {
	return get( state, 'jetpack.siteVerify.google.verified', false );
}

export function getGoogleSiteVerificationError( state ) {
	return get( state, 'jetpack.siteVerify.google.error', null );
}

export function getGoogleSearchConsoleUrl( state ) {
	return get( state, 'jetpack.siteVerify.google.searchConsoleUrl', null );
}

export function getGoogleVerificationConsoleUrl( state ) {
	return get( state, 'jetpack.siteVerify.google.verificationConsoleUrl', null );
}

export function isGoogleSiteVerificationOwner( state ) {
	return get( state, 'jetpack.siteVerify.google.isOwner', false );
}
