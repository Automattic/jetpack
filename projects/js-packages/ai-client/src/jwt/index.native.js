/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-client:jwt' );

const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000; // 2 minutes

let cachedToken = null;

/**
 * Request a token from the Jetpack site.
 *
 * @typedef {object} RequestTokenOptions
 * @property {string} siteId Site ID.
 * @property {boolean} isJetpackSite True, if it's a Jepack site.
 * @property {number} expirationTime Token expiration time.
 *
 * @typedef {object} TokenDataProps
 * @property {string} token Token.
 * @property {string} blogId Blog ID.
 * @property {number} expire Expiration date in milliseconds elapsed since UNIX epoch.
 *
 * @param {RequestTokenOptions} options - Options
 * @returns {Promise<TokenDataProps>}     The token and the blogId
 */
export default async function requestJwt( { siteId, expirationTime } = {} ) {
	// Default values
	siteId = siteId || window.JP_CONNECTION_INITIAL_STATE?.siteSuffix;
	expirationTime = expirationTime || JWT_TOKEN_EXPIRATION_TIME;

	// Trying to pick the token from localStorage
	const token = cachedToken;
	let tokenData = null;

	if ( token ) {
		try {
			tokenData = JSON.parse( token );
		} catch ( err ) {
			debug( 'Error parsing token', err );
		}
	}

	if ( tokenData && tokenData?.expire > Date.now() ) {
		debug( 'Using cached token' );
		return tokenData;
	}

	// In native mobile, for now the AI client is only supported in WPCOM sites.
	// Hence, the token is only fetched from the WPCOM API.
	const data = await apiFetch( {
		path: '/wpcom/v2/jetpack-openai-query/jwt',
		method: 'POST',
	} );

	const newTokenData = {
		token: data.token,
		/**
		 * TODO: make sure we return id from the .com token acquisition endpoint too
		 */
		blogId: siteId,

		/**
		 * Let's expire the token in 2 minutes
		 */
		expire: Date.now() + expirationTime,
	};

	// Store the token in localStorage
	debug( 'Storing new token' );
	cachedToken = JSON.stringify( newTokenData );

	return newTokenData;
}
