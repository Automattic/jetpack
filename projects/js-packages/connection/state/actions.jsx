import restApi from '@automattic/jetpack-api';

const SET_CONNECTION_STATUS = 'SET_CONNECTION_STATUS';
const SET_CONNECTION_STATUS_IS_FETCHING = 'SET_CONNECTION_STATUS_IS_FETCHING';
const FETCH_CONNECTION_STATUS = 'FETCH_CONNECTION_STATUS';
const SET_SITE_IS_REGISTERING = 'SET_SITE_IS_REGISTERING';
const SET_USER_IS_CONNECTING = 'SET_USER_IS_CONNECTING';
const SET_REGISTRATION_ERROR = 'SET_REGISTRATION_ERROR';
const CLEAR_REGISTRATION_ERROR = 'CLEAR_REGISTRATION_ERROR';
const REGISTER_SITE = 'REGISTER_SITE';
const SET_AUTHORIZATION_URL = 'SET_AUTHORIZATION_URL';
const CONNECT_USER = 'CONNECT_USER';
const DISCONNECT_USER_SUCCESS = 'DISCONNECT_USER_SUCCESS';
const FETCH_AUTHORIZATION_URL = 'FETCH_AUTHORIZATION_URL';
const SET_CONNECTED_PLUGINS = 'SET_CONNECTED_PLUGINS';
const REFRESH_CONNECTED_PLUGINS = 'REFRESH_CONNECTED_PLUGINS';
const SET_CONNECTION_ERRORS = 'SET_CONNECTION_ERRORS';

const setConnectionStatus = connectionStatus => {
	return { type: SET_CONNECTION_STATUS, connectionStatus };
};

const setConnectionStatusIsFetching = isFetching => {
	return { type: SET_CONNECTION_STATUS_IS_FETCHING, isFetching };
};

const fetchConnectionStatus = () => {
	return { type: FETCH_CONNECTION_STATUS };
};

const setSiteIsRegistering = isRegistering => {
	return { type: SET_SITE_IS_REGISTERING, isRegistering };
};

const setUserIsConnecting = isConnecting => {
	return { type: SET_USER_IS_CONNECTING, isConnecting };
};

const disconnectUserSuccess = () => {
	return { type: DISCONNECT_USER_SUCCESS };
};

const setRegistrationError = registrationError => {
	return { type: SET_REGISTRATION_ERROR, registrationError };
};

const clearRegistrationError = () => {
	return { type: CLEAR_REGISTRATION_ERROR };
};

const setAuthorizationUrl = authorizationUrl => {
	return { type: SET_AUTHORIZATION_URL, authorizationUrl };
};

const fetchAuthorizationUrl = redirectUri => {
	return { type: FETCH_AUTHORIZATION_URL, redirectUri };
};

const setConnectedPlugins = connectedPlugins => {
	return { type: SET_CONNECTED_PLUGINS, connectedPlugins };
};

const setConnectionErrors = connectionErrors => {
	return { type: SET_CONNECTION_ERRORS, connectionErrors };
};

/**
 * Connect site with wp.com user
 *
 * @param {object} Object - contains from and redirectFunc
 * @param {string} Object.from - Value that represents the redirect origin
 * @param {Function} Object.redirectFunc - A function to handle the redirect, defaults to location.assign
 * @param {string} [Object.redirectUri] - A URI that the user will be redirected to
 * @yields {object} Action object that will be yielded
 */
function* connectUser( { from, redirectFunc, redirectUri } = {} ) {
	yield setUserIsConnecting( true );
	yield { type: CONNECT_USER, from, redirectFunc, redirectUri };
}

/**
 *
 * Register an site into jetpack
 *
 * @param {object} Object - contains registrationNonce and redirectUri
 * @param {string} Object.registrationNonce - Registration nonce
 * @param {string} Object.redirectUri - URI that user will be redirected
 * @yields {object} Action object that will be yielded
 * @returns {Promise} Resolved or rejected value of registerSite
 */
function* registerSite( { registrationNonce, redirectUri } ) {
	yield clearRegistrationError();
	yield setSiteIsRegistering( true );

	try {
		const response = yield { type: REGISTER_SITE, registrationNonce, redirectUri };
		yield setConnectionStatus( { isRegistered: true } );
		yield setAuthorizationUrl( response.authorizeUrl );
		yield setSiteIsRegistering( false );
		return Promise.resolve( response );
	} catch ( error ) {
		yield setRegistrationError( error );
		yield setSiteIsRegistering( false );
		return Promise.reject( error );
	}
}

/**
 * Side effect action which will fetch a new list of connectedPlugins from the server
 *
 * @returns {Promise} - Promise which resolves when the product status is activated.
 */
const refreshConnectedPlugins = () => async ( { dispatch } ) => {
	return await new Promise( resolve => {
		return restApi.fetchConnectedPlugins().then( data => {
			dispatch( setConnectedPlugins( data ) );
			resolve( data );
		} );
	} );
};

const actions = {
	setConnectionStatus,
	setConnectionStatusIsFetching,
	fetchConnectionStatus,
	fetchAuthorizationUrl,
	setSiteIsRegistering,
	setUserIsConnecting,
	setRegistrationError,
	clearRegistrationError,
	setAuthorizationUrl,
	registerSite,
	connectUser,
	disconnectUserSuccess,
	setConnectedPlugins,
	refreshConnectedPlugins,
	setConnectionErrors,
};

export {
	SET_CONNECTION_STATUS,
	SET_CONNECTION_STATUS_IS_FETCHING,
	FETCH_CONNECTION_STATUS,
	FETCH_AUTHORIZATION_URL,
	SET_SITE_IS_REGISTERING,
	SET_USER_IS_CONNECTING,
	SET_REGISTRATION_ERROR,
	CLEAR_REGISTRATION_ERROR,
	REGISTER_SITE,
	SET_AUTHORIZATION_URL,
	CONNECT_USER,
	DISCONNECT_USER_SUCCESS,
	SET_CONNECTED_PLUGINS,
	REFRESH_CONNECTED_PLUGINS,
	SET_CONNECTION_ERRORS,
	actions as default,
};
