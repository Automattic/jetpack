/**
 * External dependencies
 */
import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { getErrorData } from '../hooks/use-ai-suggestions';
import requestJwt from '../jwt';
/*
 * Types & constants
 */
import {
	ERROR_MODERATION,
	ERROR_NETWORK,
	ERROR_QUOTA_EXCEEDED,
	ERROR_RESPONSE,
	ERROR_SERVICE_UNAVAILABLE,
	ERROR_UNCLEAR_PROMPT,
} from '../types';
import type { PromptMessagesProp, PromptProp, SuggestionErrorCode } from '../types';

type SuggestionsEventSourceConstructorArgs = {
	url?: string;
	question: PromptProp;
	token?: string;
	options?: {
		postId?: number;
		feature?: 'ai-assistant-experimental' | string | undefined;
		fromCache?: boolean;
		functions?: Array< object >;
	};
};

type FunctionCallProps = {
	name?: string;
	arguments?: string;
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
	fullFunctionCall: FunctionCallProps;
	isPromptClear: boolean;
	controller: AbortController;

	constructor( data: SuggestionsEventSourceConstructorArgs ) {
		super();
		this.fullMessage = '';
		this.fullFunctionCall = {
			name: '',
			arguments: '',
		};
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
		// If the token is not provided, try to get one
		if ( ! token ) {
			try {
				debug( 'Token was not provided, requesting one...' );
				token = ( await requestJwt() ).token;
			} catch ( err ) {
				this.processErrorEvent( err );

				return;
			}
		}

		const bodyData: {
			post_id?: number;
			messages?: PromptMessagesProp;
			question?: PromptProp;
			feature?: string;
			functions?: Array< object >;
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

		// Propagate the functions option
		if ( options?.functions?.length ) {
			debug( 'Functions: %o', options.functions );
			bodyData.functions = options.functions;
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

				let errorCode: SuggestionErrorCode;

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
					errorCode = ERROR_SERVICE_UNAVAILABLE;
					this.dispatchEvent( new CustomEvent( ERROR_SERVICE_UNAVAILABLE ) );
				}

				/*
				 * error code 429
				 * you exceeded your current quota please check your plan and billing details
				 */
				if ( response.status === 429 ) {
					errorCode = ERROR_QUOTA_EXCEEDED;
					this.dispatchEvent( new CustomEvent( ERROR_QUOTA_EXCEEDED ) );
				}

				/*
				 * error code 422
				 * request flagged by moderation system
				 */
				if ( response.status === 422 ) {
					errorCode = ERROR_MODERATION;
					this.dispatchEvent( new CustomEvent( ERROR_MODERATION ) );
				}

				// Always dispatch a global ERROR_RESPONSE event
				this.dispatchEvent(
					new CustomEvent( ERROR_RESPONSE, {
						detail: getErrorData( errorCode ),
					} )
				);

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
			this.dispatchEvent(
				new CustomEvent( ERROR_RESPONSE, {
					detail: getErrorData( ERROR_UNCLEAR_PROMPT ),
				} )
			);
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
			if ( this.fullMessage.length ) {
				// Dispatch an event with the full content
				this.dispatchEvent( new CustomEvent( 'done', { detail: this.fullMessage } ) );
				debug( 'Done: %o', this.fullMessage );
				return;
			}

			if ( this.fullFunctionCall.name.length ) {
				this.dispatchEvent( new CustomEvent( 'function_done', { detail: this.fullFunctionCall } ) );
				debug( 'Done: %o', this.fullFunctionCall );
				return;
			}
		}

		let data;
		try {
			data = JSON.parse( e.data );
		} catch ( err ) {
			debug( 'Error parsing JSON', e, err );
			return;
		}
		const { delta } = data?.choices?.[ 0 ] ?? { delta: { content: null, function_call: null } };
		const chunk = delta.content;
		const functionCallChunk = delta.function_call;

		if ( chunk ) {
			this.fullMessage += chunk;
			this.checkForUnclearPrompt();

			if ( this.isPromptClear ) {
				// Dispatch an event with the chunk
				this.dispatchEvent( new CustomEvent( 'chunk', { detail: chunk } ) );
				// Dispatch an event with the full message
				debug( 'suggestion: %o', this.fullMessage );
				this.dispatchEvent( new CustomEvent( 'suggestion', { detail: this.fullMessage } ) );
			}
		}

		if ( functionCallChunk ) {
			if ( functionCallChunk.name != null ) {
				this.fullFunctionCall.name += functionCallChunk.name;
			}

			if ( functionCallChunk.arguments != null ) {
				this.fullFunctionCall.arguments += functionCallChunk.arguments;
			}

			// Dispatch an event with the function call
			this.dispatchEvent(
				new CustomEvent( 'functionCallChunk', { detail: this.fullFunctionCall } )
			);
		}
	}

	processConnectionError( response ) {
		debug( 'Connection error: %o', response );
		this.dispatchEvent( new CustomEvent( ERROR_NETWORK, { detail: response } ) );
		this.dispatchEvent(
			new CustomEvent( ERROR_RESPONSE, {
				detail: getErrorData( ERROR_NETWORK ),
			} )
		);
	}

	processErrorEvent( e ) {
		debug( 'onerror: %o', e );

		// Dispatch a generic network error event
		this.dispatchEvent( new CustomEvent( ERROR_NETWORK, { detail: e } ) );
		this.dispatchEvent(
			new CustomEvent( ERROR_RESPONSE, {
				detail: getErrorData( ERROR_NETWORK ),
			} )
		);
	}
}
