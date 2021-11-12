/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import { STORE_ID } from './store';

const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';
const SET_CONNECTION_STATUS_IS_FETCHING = 'SET_CONNECTION_STATUS_IS_FETCHING';
const FETCH_CONNECTION_STATUS = 'FETCH_CONNECTION_STATUS';
const SET_SITE_IS_REGISTERING = 'SET_SITE_IS_REGISTERING';
const SET_USER_IS_CONNECTING = 'SET_USER_IS_CONNECTING';
const SET_REGISTRATION_ERROR = 'SET_REGISTRATION_ERROR';
const CLEAR_REGISTRATION_ERROR = 'CLEAR_REGISTRATION_ERROR';
const REGISTER_SITE = 'REGISTER_SITE';
const SET_AUTHORIZATION_URL = 'SET_AUTHORIZATION_URL';

const connectionStatusActions = {
	setConnectionStatus: connectionStatus => {
		return { type: SET_CONNECTION_STATUS, connectionStatus };
	},
	setConnectionStatusIsFetching: isFetching => {
		return { type: SET_CONNECTION_STATUS_IS_FETCHING, isFetching };
	},
	fetchConnectionStatus: () => {
		return { type: FETCH_CONNECTION_STATUS };
	},
	setSiteIsRegistering: isRegistering => {
		return { type: SET_SITE_IS_REGISTERING, isRegistering };
	},
	setUserIsConnecting: isConnecting => {
		return { type: SET_USER_IS_CONNECTING, isConnecting };
	},
	setRegistrationError: registrationError => {
		return { type: SET_REGISTRATION_ERROR, registrationError };
	},
	clearRegistrationError: () => {
		return { type: CLEAR_REGISTRATION_ERROR };
	},
	setAuthorizationUrl: authorizationUrl => {
		return { type: SET_AUTHORIZATION_URL, authorizationUrl };
	},
	*registerSite( registrationNonce, redirectUri ) {
		yield dispatch( STORE_ID ).clearRegistrationError();
		yield dispatch( STORE_ID ).setSiteIsRegistering( true );
		yield restApi
			.registerSite( registrationNonce, redirectUri )
			.then( response => {
				dispatch( STORE_ID ).setSiteIsRegistering( false );
				dispatch( STORE_ID ).setAuthorizationUrl( response.authorizeUrl );
				dispatch( STORE_ID ).setUserIsConnecting( true );
			} )
			.catch( error => {
				dispatch( STORE_ID ).setSiteIsRegistering( false );
				dispatch( STORE_ID ).setRegistrationError( error );
			} )
			.finally( () => {
				return { type: REGISTER_SITE };
			} );
	},
};

const actions = {
	...connectionStatusActions,
};

export {
	SET_CONNECTION_STATUS,
	SET_CONNECTION_STATUS_IS_FETCHING,
	FETCH_CONNECTION_STATUS,
	SET_SITE_IS_REGISTERING,
	SET_USER_IS_CONNECTING,
	SET_REGISTRATION_ERROR,
	CLEAR_REGISTRATION_ERROR,
	REGISTER_SITE,
	SET_AUTHORIZATION_URL,
	actions as default,
};
