/**
 * External dependencies
 */
import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';
import debugFactory from 'debug';
/*
 * Types & constants
 */
import {
	ERROR_MODERATION,
	ERROR_NETWORK,
	ERROR_QUOTA_EXCEEDED,
	ERROR_SERVICE_UNAVAILABLE,
	ERROR_UNCLEAR_PROMPT,
} from '../types';
import type { PromptMessagesProp, PromptProp } from '../types';

type SuggestionsEventSourceConstructorArgs = {
	url?: string;
	question: PromptProp;
	token: string;
	options?: {
		postId?: number;
		feature?: 'ai-assistant-experimental' | string | undefined;
		fromCache?: boolean;
	};
};

const debug = debugFactory( 'jetpack-ai-client:suggestions-event-source' );

/**
 * SuggestionsEventSource is a wrapper around EvenTarget that emits
 * a 'chunk' event for each chunk of data received, and a 'done' event
 * when the stream is closed.
 * It also emits a 'suggestion' event with the full suggestion received so far
 *
 * @returns {EventSource} The event source
 * @fires suggestion                - The full suggestion has been received so far
 * @fires message                   - A message has been received
 * @fires chunk                     - A chunk of data has been received
 * @fires done                      - The stream has been closed. No more data will be received
 * @fires error                     - An error has occurred
 * @fires error_network             - The EventSource connection to the server returned some error
 * @fires error_service_unavailable - The server returned a 503 error
 * @fires error_quota_exceeded      - The server returned a 429 error
 * @fires error_moderation          - The server returned a 422 error
 * @fires error_unclear_prompt      - The server returned a message starting with JETPACK_AI_ERROR
 */
export default class SuggestionsEventSource extends EventTarget {
	fullMessage: string;
	isPromptClear: boolean;
	controller: AbortController;

	constructor( data: SuggestionsEventSourceConstructorArgs ) {
		super();
		this.fullMessage = '';
		this.isPromptClear = false;

		// The AbortController is used to close the fetchEventSource connection
		this.controller = new AbortController();

		this.initEventSource( data );
	}

	async initEventSource( {
		url,
		question,
		token,
		options = {},
	}: SuggestionsEventSourceConstructorArgs ) {
		const bodyData: {
			post_id?: number;
			messages?: PromptMessagesProp;
			question?: PromptProp;
			feature?: string;
		} = {};

		// Populate body data with post id
		if ( options?.postId ) {
			bodyData.post_id = options.postId;
		}

		// If the url is not provided, we use the default one
		if ( ! url ) {
			const urlHandler = new URL( 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query' );

			// Support response from cache option
			if ( options?.fromCache ) {
				urlHandler.searchParams.append( 'stream_cache', 'true' );
			}

			url = urlHandler.toString();
			debug( 'URL not provided, using default: %o', url );
		}

		// question can be a string or an array of PromptMessagesProp
		if ( Array.isArray( question ) ) {
			bodyData.messages = question;
		} else {
			bodyData.question = question;
		}

		// Propagate the feature option
		if ( options?.feature?.length ) {
			debug( 'Feature: %o', options.feature );
			bodyData.feature = options.feature;
		}

		await fetchEventSource( url, {
			openWhenHidden: true,
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
				Authorization: 'Bearer ' + token,
			},
			body: JSON.stringify( bodyData ),

			onclose: () => {
				debug( 'Stream closed' );
			},

			onerror: err => {
				this.processErrorEvent( err );
				throw err; // rethrow to stop the operation otherwise it will retry forever
			},

			onmessage: ev => {
				this.processEvent( ev );
			},

			onopen: async response => {
				if ( response.ok ) {
					return;
				}
				if (
					response.status >= 400 &&
					response.status <= 500 &&
					! [ 422, 429 ].includes( response.status )
				) {
					this.processConnectionError( response );
				}

				/*
				 * error code 503
				 * service unavailable
				 */
				if ( response.status === 503 ) {
					this.dispatchEvent( new CustomEvent( ERROR_SERVICE_UNAVAILABLE ) );
				}

				/*
				 * error code 429
				 * you exceeded your current quota please check your plan and billing details
				 */
				if ( response.status === 429 ) {
					this.dispatchEvent( new CustomEvent( ERROR_QUOTA_EXCEEDED ) );
				}

				/*
				 * error code 422
				 * request flagged by moderation system
				 */
				if ( response.status === 422 ) {
					this.dispatchEvent( new CustomEvent( ERROR_MODERATION ) );
				}

				throw new Error();
			},

			signal: this.controller.signal,
		} );
	}

	checkForUnclearPrompt() {
		if ( this.isPromptClear ) {
			return;
		}

		/*
		 * Sometimes the first token of the message is not received,
		 * so we check only for JETPACK_AI_ERROR, ignoring:
		 * - the double underscores (italic markdown)
		 * - the double asterisks (bold markdown)
		 */
		const replacedMessage = this.fullMessage.replace( /__|(\*\*)/g, '' );
		if ( replacedMessage.startsWith( 'JETPACK_AI_ERROR' ) ) {
			// The unclear prompt marker was found, so we dispatch an error event
			this.dispatchEvent( new CustomEvent( ERROR_UNCLEAR_PROMPT ) );
		} else if ( 'JETPACK_AI_ERROR'.startsWith( replacedMessage ) ) {
			// Partial unclear prompt marker was found, so we wait for more data and print a debug message without dispatching an event
			debug( this.fullMessage );
		} else {
			// Mark the prompt as clear
			this.isPromptClear = true;
		}
	}

	close() {
		this.controller.abort();
	}

	processEvent( e: EventSourceMessage ) {
		if ( e.data === '[DONE]' ) {
			// Dispatch an event with the full content
			this.dispatchEvent( new CustomEvent( 'done', { detail: this.fullMessage } ) );
			debug( 'Done: %o', this.fullMessage );
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
		debug( 'Connection error: %o', response );
		this.dispatchEvent( new CustomEvent( ERROR_NETWORK, { detail: response } ) );
	}

	processErrorEvent( e ) {
		debug( 'onerror: %o', e );

		// Dispatch a generic network error event
		this.dispatchEvent( new CustomEvent( ERROR_NETWORK, { detail: e } ) );
	}
}
