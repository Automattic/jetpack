import apiFetch from '@wordpress/api-fetch';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant' );
const debugToken = debugFactory( 'jetpack-ai-assistant:token' );

const JWT_TOKEN_ID = 'jetpack-ai-jwt-token';
const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000;
/**
 *
 * askJetpack exists just for debugging purposes
 *
 * @param {string} question - The query to send to the API
 * @returns {string} The event source
 */
export async function askJetpack( question ) {
	let fullMessage;
	let source;
	try {
		source = await askQuestion( question );
	} catch ( err ) {
		debug( 'Error', err );
		return source;
	}
	source.addEventListener( 'error', err => {
		debug( 'Error', err );
	} );

	source.addEventListener( 'message', e => {
		if ( e.data === '[DONE]' ) {
			source.close();
			debug( 'Done. Full message: ' + fullMessage );
			return;
		}

		const data = JSON.parse( e.data );
		const chunk = data.choices[ 0 ].delta.content;
		if ( chunk ) {
			fullMessage += chunk;
			debug( chunk );
		}
	} );
	return source;
}

/**
 * Leaving this here to make it easier to debug the streaming API calls for now
 *
 * @param {string} question - The query to send to the API
 * @param {number} postId - The post where this completion is being requested, if available
 */
export async function askQuestion( question, postId = null ) {
	const { token } = await requestToken();

	const url = new URL( 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query' );
	url.searchParams.append( 'question', question );
	url.searchParams.append( 'token', token );

	if ( postId ) {
		url.searchParams.append( 'post_id', postId );
	}

	const source = new EventSource( url.toString() );
	return source;
}

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
			debugToken( 'Error parsing token', err );
		}
	}

	if ( tokenData && tokenData?.expire > Date.now() ) {
		debugToken( 'Using cached token' );
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
	debugToken( 'Storing new token' );
	localStorage.setItem( JWT_TOKEN_ID, JSON.stringify( newTokenData ) );

	return newTokenData;
}
