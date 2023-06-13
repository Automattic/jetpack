/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant:token' );

const JWT_TOKEN_ID = 'jetpack-ai-jwt-token';
const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000;

/**
 * Request a token from the Jetpack site to use with the OpenAI API
 *
 * @returns {Promise<{token: string, blogId: string}>} The token and the blogId
 */
export async function requestToken() {
	// Trying to pick the token from localStorage
	const token = localStorage.getItem( JWT_TOKEN_ID );
	let tokenData;

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

	const apiNonce = window.JP_CONNECTION_INITIAL_STATE.apiNonce;
	const siteSuffix = window.JP_CONNECTION_INITIAL_STATE.siteSuffix;
	const isJetpackSite = ! window.wpcomFetch;
	let data;

	if ( isJetpackSite ) {
		data = await apiFetch( {
			path: '/jetpack/v4/jetpack-ai-jwt?_cacheBuster=' + Date.now(),
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': apiNonce,
			},
			method: 'POST',
		} );
	} else {
		data = await apiFetch( {
			path: '/wpcom/v2/sites/' + siteSuffix + '/jetpack-openai-query/jwt',
			method: 'POST',
		} );
	}

	const newTokenData = {
		token: data.token,
		/**
		 * TODO: make sure we return id from the .com token acquisition endpoint too
		 */
		blogId: isJetpackSite ? data.blog_id : siteSuffix,

		/**
		 * Let's expire the token in 2 minutes
		 */
		expire: Date.now() + JWT_TOKEN_EXPIRATION_TIME,
	};

	// Store the token in localStorage
	debug( 'Storing new token' );
	localStorage.setItem( JWT_TOKEN_ID, JSON.stringify( newTokenData ) );

	return newTokenData;
}
