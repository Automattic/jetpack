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
const FETCH_AUTHORIZATION_URL = 'FETCH_AUTHORIZATION_URL';

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

/**
 * Connect site with wp.com user
 *
 * @param {object} Object - contains from and redirectFunc
 * @param {string} Object.from - Value that represents the redirect origin
 * @param {Function} Object.redirectFunc - A function to handle the redirect, defaults to location.assign
 * @yields {object} Action object that will be yielded
 */
function* connectUser( { from, redirectFunc } = {} ) {
	yield setUserIsConnecting( true );
	yield { type: CONNECT_USER, from, redirectFunc };
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
		yield setSiteIsRegistering( false );
		yield setConnectionStatus( { isRegistered: true } );
		yield setAuthorizationUrl( response.authorizeUrl );
		return Promise.resolve( response );
	} catch ( error ) {
		yield setSiteIsRegistering( false );
		yield setRegistrationError( error );
		return Promise.reject( error );
	}
}

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
	actions as default,
};
