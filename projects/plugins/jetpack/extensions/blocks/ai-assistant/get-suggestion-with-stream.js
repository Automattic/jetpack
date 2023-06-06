import { fetchEventSource } from '@microsoft/fetch-event-source';
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

	source.addEventListener( 'suggestion', e => {
		debug( 'fullMessage', e );
	} );
	return source;
}

/**
 * Leaving this here to make it easier to debug the streaming API calls for now
 *
 * @param {string} question   - The query to send to the API
 * @param {number} postId     - The post where this completion is being requested, if available
 * @param {boolean} fromCache - Get a cached response. False by default.
 */
export async function askQuestion( question, postId = null, fromCache = false ) {
	const { token } = await requestToken();

	const url = new URL( 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query' );
	if ( Array.isArray( question ) ) {
		url.searchParams.append( 'messages', JSON.stringify( question ) );
	} else {
		url.searchParams.append( 'question', question );
	}
	url.searchParams.append( 'token', token );

	if ( fromCache ) {
		url.searchParams.append( 'stream_cache', 'true' );
	}

	if ( postId ) {
		url.searchParams.append( 'post_id', postId );
	}

	return new SuggestionsEventSource( url.toString() );
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

/**
 * SuggestionsEventSource is a wrapper around EvenTarget that emits
 * a 'chunk' event for each chunk of data received, and a 'done' event
 * when the stream is closed.
 * It also emits a 'suggestion' event with the full suggestion received so far
 *
 * @returns {EventSource} The event source
 * @fires suggestion - The full suggestion has been received so far
 * @fires message - A message has been received
 * @fires chunk - A chunk of data has been received
 * @fires done - The stream has been closed. No more data will be received
 * @fires error - An error has occurred
 * @fires error_network - The EventSource connection to the server returned some error
 */
export class SuggestionsEventSource extends EventTarget {
	constructor( url ) {
		super();
		this.fullMessage = '';
		this.isPromptClear = false;
		// The AbortController is used to close the fetchEventSource connection
		this.controller = new AbortController();
		this.initEventSource( url );
	}

	async initEventSource( url ) {
		const self = this;

		this.source = await fetchEventSource( url.toString(), {
			onclose() {
				debug( 'Stream closed unexpectedly' );
			},
			onerror( err ) {
				self.processErrorEvent( err );
				throw err; // rethrow to stop the operation otherwise it will retry forever
			},
			onmessage( ev ) {
				self.processEvent( ev );
			},
			async onopen( response ) {
				if ( response.ok ) {
					return;
				}
				if (
					response.status >= 400 &&
					response.status <= 500 &&
					! [ 422, 429 ].includes( response.status )
				) {
					self.processConnectionError( response );
				}

				/*
				 * error code 503
				 * service unavailable
				 */
				if ( response.status === 503 ) {
					self.dispatchEvent( new CustomEvent( 'error_service_unavailable' ) );
				}

				/*
				 * error code 429
				 * you exceeded your current quota please check your plan and billing details
				 */
				if ( response.status === 429 ) {
					self.dispatchEvent( new CustomEvent( 'error_quota_exceeded' ) );
				}

				/*
				 * error code 422
				 * request flagged by moderation system
				 */
				if ( response.status === 422 ) {
					self.dispatchEvent( new CustomEvent( 'error_moderation' ) );
				}

				throw new Error();
			},
			signal: this.controller.signal,
		} );
	}

	checkForUnclearPrompt() {
		if ( ! this.isPromptClear ) {
			/*
			 * Sometimes the first token of the message is not received,
			 * so we check only for JETPACK_AI_ERROR, ignoring:
			 * - the double underscores (italic markdown)
			 * - the doouble asterisks (bold markdown)
			 */
			const replacedMessage = this.fullMessage.replace( /__|(\*\*)/g, '' );
			if ( replacedMessage === 'JETPACK_AI_ERROR' ) {
				// The unclear prompt marker was found, so we dispatch an error event
				this.dispatchEvent( new CustomEvent( 'error_unclear_prompt' ) );
			} else if ( 'JETPACK_AI_ERROR'.startsWith( replacedMessage ) ) {
				// Partial unclear prompt marker was found, so we wait for more data and print a debug message without dispatching an event
				debug( this.fullMessage );
			} else {
				// Mark the prompt as clear
				this.isPromptClear = true;
			}
		}
	}

	close() {
		this.controller.abort();
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
			this.checkForUnclearPrompt();

			if ( this.isPromptClear ) {
				// Dispatch an event with the chunk
				this.dispatchEvent( new CustomEvent( 'chunk', { detail: chunk } ) );
				// Dispatch an event with the full message
				this.dispatchEvent( new CustomEvent( 'suggestion', { detail: this.fullMessage } ) );
			}
		}
	}

	processConnectionError( response ) {
		debug( 'Connection error' );
		debug( response );
		this.dispatchEvent( new CustomEvent( 'error_network', { detail: response } ) );
	}

	processErrorEvent( e ) {
		debug( e );

		// Dispatch a generic network error event
		this.dispatchEvent( new CustomEvent( 'error_network' ) );
	}
}
