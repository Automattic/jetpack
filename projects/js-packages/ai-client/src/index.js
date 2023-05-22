import apiFetch from '@wordpress/api-fetch';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-client' );
const debugToken = debugFactory( 'jetpack-ai-client:token' );
/**
 * Fetches images from Jetpack AI
 *
 * It's up to the consumer to catch errors
 *
 * @param {*} prompt  - The prompt to send to Jetpack AI
 * @param {*} postId - The post ID where the completion is being requested
 * @returns {Promise<Array<string>>} The images
 */
export function requestImages( prompt, postId ) {
	return apiFetch( {
		path: '/wpcom/v2/jetpack-ai/images/generations',
		method: 'POST',
		data: {
			prompt,
			post_id: postId,
		},
	} ).then( res => {
		const images = res.data.map( image => {
			return 'data:image/png;base64,' + image.b64_json;
		} );
		return images;
	} );
}

/**
 * SuggestionsEventSource is a wrapper around EventSource that emits
 * a 'chunk' event for each chunk of data received, and a 'done' event
 * when the stream is closed.
 * It also emits a 'suggestion' event with the full suggestion received so far
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventSource
 * @param {string} url - The URL to connect to
 * @param {object} options - Options to pass to EventSource
 * @returns {EventSource} The event source
 * @fires suggestion - The full suggestion has been received so far
 * @fires message - A message has been received
 * @fires chunk - A chunk of data has been received
 * @fires done - The stream has been closed. No more data will be received
 * @fires error - An error has occurred
 */
export class SuggestionsEventSource extends EventSource {
	constructor( url, options ) {
		super( url, options );
		this.fullMessage = '';
		this.addEventListener( 'message', this.processEvent );
	}

	processEvent( e ) {
		if ( e.data === '[DONE]' ) {
			// Dispatch an event with the full content
			this.dispatchEvent( new CustomEvent( 'done', { detail: this.fullMessage } ) );
			debug( 'Done. Full message: ' + this.fullMessage );
			return;
		}

		const data = JSON.parse( e.data );
		const chunk = data.choices[ 0 ].delta.content;
		if ( chunk ) {
			this.fullMessage += chunk;

			if ( this.fullMessage.startsWith( '__JETPACK_AI_ERROR__' ) ) {
				// The error is confirmed
				this.dispatchEvent( new CustomEvent( 'error_unclear_prompt' ) );
			} else if ( ! '__JETPACK_AI_ERROR__'.startsWith( this.fullMessage ) ) {
				// Confirmed to be a valid response
				// Dispatch an event with the chunk
				this.dispatchEvent( new CustomEvent( 'chunk', { detail: chunk } ) );
				// Dispatch an event with the full message
				this.dispatchEvent( new CustomEvent( 'suggestion', { detail: this.fullMessage } ) );
			}
		}
	}
}

const JWT_TOKEN_ID = 'jetpack-ai-jwt-token';
const JWT_TOKEN_EXPIRATION_TIME = 2 * 60 * 1000;

/**
 * Requests a completion from the Jetpack AI API
 *
 * @param {string} prompt - The query to send to the API
 * @param {number} postId - The post where this completion is being requested, if available
 */
export async function requestCompletion( prompt, postId = null ) {
	const { token } = await requestCompletionAuthToken();

	const url = new URL( 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query' );
	url.searchParams.append( 'question', prompt );
	url.searchParams.append( 'token', token );

	if ( postId ) {
		url.searchParams.append( 'post_id', postId );
	}

	return new SuggestionsEventSource( url.toString() );
}

/**
 * Request a token from the Jetpack site to use with the Jetpack AI streaming completion API
 *
 * @returns {Promise<{token: string, blogId: string}>} The token and the blogId
 */
export async function requestCompletionAuthToken() {
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
