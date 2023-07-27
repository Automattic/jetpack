/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import askQuestion, { AskQuestionOptionsArgProps } from '../../ask-question';
import {
	ERROR_MODERATION,
	ERROR_NETWORK,
	ERROR_QUOTA_EXCEEDED,
	ERROR_SERVICE_UNAVAILABLE,
	ERROR_UNCLEAR_PROMPT,
	type PromptItemProps,
	type SuggestionErrorCode,
} from '../../types';
/**
 * Types & constants
 */
import type SuggestionsEventSource from '../../suggestions-event-source';

export type SuggestionErrorProps = {
	/*
	 * A string code to refer to the error.
	 */
	code: SuggestionErrorCode;

	/*
	 * The user-friendly error message.
	 */
	message: string;

	/*
	 * The severity of the error.
	 */
	severity: 'info' | 'error';
};

type useAiSuggestionsOptions = {
	/*
	 * Request prompt.
	 */
	prompt?: PromptItemProps[];

	/*
	 * Whether to request suggestions automatically.
	 */
	autoRequest?: boolean;

	/**
	 * AskQuestion options.
	 */
	askQuestionOptions?: AskQuestionOptionsArgProps;

	/*
	 * onSuggestion callback.
	 */
	onSuggestion?: ( suggestion: string ) => void;

	/*
	 * onDone callback.
	 */
	onDone?: ( content: string ) => void;

	/*
	 * onError callback.
	 */
	onError?: ( error: SuggestionErrorProps ) => void;
};

export type RequestingStateProp = 'init' | 'requesting' | 'suggesting' | 'done' | 'error';

type useAiSuggestionsProps = {
	/*
	 * The suggestion.
	 */
	suggestion: string;

	/*
	 * The error.
	 */
	error: SuggestionErrorProps | undefined;

	/*
	 * Whether the request is in progress.
	 */
	requestingState: RequestingStateProp;

	/*
	 * The event source.
	 */
	eventSource: SuggestionsEventSource | undefined;

	/*
	 * The request handler.
	 */
	request: ( prompt: Array< PromptItemProps > ) => Promise< void >;
};

const debug = debugFactory( 'jetpack-ai-client:use-suggestion' );

/**
 * Get the error data for a given error code.
 *
 * @param {SuggestionErrorCode} errorCode - The error code.
 * @returns {SuggestionErrorProps}          The error data.
 */
function getErrorData( errorCode: SuggestionErrorCode ): SuggestionErrorProps {
	switch ( errorCode ) {
		case ERROR_QUOTA_EXCEEDED:
			return {
				code: ERROR_QUOTA_EXCEEDED,
				message: __( 'You have reached the limit of requests for this site.', 'jetpack-ai-client' ),
				severity: 'info',
			};
		case ERROR_UNCLEAR_PROMPT:
			return {
				code: ERROR_UNCLEAR_PROMPT,
				message: __( 'Your request was unclear. Mind trying again?', 'jetpack-ai-client' ),
				severity: 'info',
			};
		case ERROR_SERVICE_UNAVAILABLE:
			return {
				code: ERROR_SERVICE_UNAVAILABLE,
				message: __(
					'Jetpack AI services are currently unavailable. Sorry for the inconvenience.',
					'jetpack-ai-client'
				),
				severity: 'info',
			};
		case ERROR_MODERATION:
			return {
				code: ERROR_MODERATION,
				message: __(
					'This request has been flagged by our moderation system. Please try to rephrase it and try again.',
					'jetpack-ai-client'
				),
				severity: 'info',
			};
		case ERROR_NETWORK:
			return {
				code: ERROR_NETWORK,
				message: __(
					'It was not possible to process your request. Mind trying again?',
					'jetpack-ai-client'
				),
				severity: 'info',
			};
		default:
			return {
				code: ERROR_NETWORK,
				message: __(
					'It was not possible to process your request. Mind trying again?',
					'jetpack-ai-client'
				),
				severity: 'info',
			};
	}
}

/**
 * React custom hook to get suggestions from AI,
 * by hitting the query endpoint.
 *
 * @param {useAiSuggestionsOptions} options - The options for the hook.
 * @returns {useAiSuggestionsProps}           The props for the hook.
 */
export default function useAiSuggestions( {
	prompt,
	autoRequest = false,
	askQuestionOptions = {},
	onSuggestion,
	onDone,
	onError,
}: useAiSuggestionsOptions = {} ): useAiSuggestionsProps {
	const [ requestingState, setRequestingState ] = useState< RequestingStateProp >( 'init' );
	const [ suggestion, setSuggestion ] = useState< string >( '' );
	const [ error, setError ] = useState< SuggestionErrorProps >();

	// Store the event source in a ref, so we can handle it if needed.
	const eventSourceRef = useRef< SuggestionsEventSource | undefined >( undefined );

	/**
	 * onSuggestion function handler.
	 *
	 * @param {string} suggestion - The suggestion.
	 * @returns {void}
	 */
	const handleSuggestion = useCallback(
		( event: CustomEvent ) => {
			setSuggestion( event?.detail );
			onSuggestion?.( event?.detail );
		},
		[ onSuggestion ]
	);

	/**
	 * onDone function handler.
	 *
	 * @param {string} content - The content.
	 * @returns {void}
	 */
	const handleDone = useCallback(
		( event: CustomEvent ) => {
			onDone?.( event?.detail );
			setRequestingState( 'done' );
		},
		[ onDone ]
	);

	const handleError = useCallback(
		( errorCode: SuggestionErrorCode ) => {
			eventSourceRef?.current?.close();
			setRequestingState( 'error' );
			setError( getErrorData( errorCode ) );
			onError?.( getErrorData( errorCode ) );
		},
		[ onError ]
	);

	const handleErrorQuotaExceededError = useCallback(
		() => handleError( ERROR_QUOTA_EXCEEDED ),
		[]
	);

	const handleUnclearPromptError = useCallback( () => handleError( ERROR_UNCLEAR_PROMPT ), [] );

	const handleServiceUnavailableError = useCallback(
		() => handleError( ERROR_SERVICE_UNAVAILABLE ),
		[]
	);

	const handleModerationError = useCallback( () => handleError( ERROR_MODERATION ), [] );

	const handleNetwotkError = useCallback( () => handleError( ERROR_NETWORK ), [] );

	/**
	 * Request handler.
	 *
	 * @returns {Promise<void>} The promise.
	 */
	const request = useCallback(
		async ( promptArg: Array< PromptItemProps > ) => {
			promptArg.forEach( ( { role, content: promptContent }, i ) =>
				debug( '(%s/%s) %o\n%s', i + 1, promptArg.length, `[${ role }]`, promptContent )
			);
			// Set the request status.
			setRequestingState( 'requesting' );

			try {
				eventSourceRef.current = await askQuestion( promptArg, askQuestionOptions );

				if ( ! eventSourceRef?.current ) {
					return;
				}

				// Alias
				const eventSource = eventSourceRef.current;

				// Set the request status.
				setRequestingState( 'suggesting' );

				eventSource.addEventListener( 'suggestion', handleSuggestion );

				eventSource.addEventListener( ERROR_QUOTA_EXCEEDED, handleErrorQuotaExceededError );
				eventSource.addEventListener( ERROR_UNCLEAR_PROMPT, handleUnclearPromptError );
				eventSource.addEventListener( ERROR_SERVICE_UNAVAILABLE, handleServiceUnavailableError );
				eventSource.addEventListener( ERROR_MODERATION, handleModerationError );
				eventSource.addEventListener( ERROR_NETWORK, handleNetwotkError );

				eventSource.addEventListener( 'done', handleDone );
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( e );
			}
		},
		[
			handleDone,
			handleErrorQuotaExceededError,
			handleUnclearPromptError,
			handleServiceUnavailableError,
			handleModerationError,
			handleNetwotkError,
			handleSuggestion,
		]
	);

	// Request suggestions automatically when ready.
	useEffect( () => {
		// Check if there is a prompt to request.
		if ( ! prompt?.length ) {
			return;
		}

		// Trigger the request.
		if ( autoRequest ) {
			request( prompt );
		}

		return () => {
			if ( ! eventSourceRef?.current ) {
				return;
			}

			// Alias
			const eventSource = eventSourceRef.current;

			// Close the connection.
			eventSource.close();

			// Clean up the event listeners.
			eventSource.removeEventListener( 'suggestion', handleSuggestion );

			eventSource.removeEventListener( ERROR_QUOTA_EXCEEDED, handleErrorQuotaExceededError );
			eventSource.removeEventListener( ERROR_UNCLEAR_PROMPT, handleUnclearPromptError );
			eventSource.removeEventListener( ERROR_SERVICE_UNAVAILABLE, handleServiceUnavailableError );
			eventSource.removeEventListener( ERROR_MODERATION, handleModerationError );
			eventSource.removeEventListener( ERROR_NETWORK, handleNetwotkError );

			eventSource.removeEventListener( 'done', handleDone );
		};
	}, [
		autoRequest,
		handleDone,
		handleErrorQuotaExceededError,
		handleModerationError,
		handleServiceUnavailableError,
		handleSuggestion,
		handleUnclearPromptError,
		prompt,
		request,
	] );

	return {
		// Data
		suggestion,
		error,
		requestingState,

		// Request handler
		request,

		// SuggestionsEventSource
		eventSource: eventSourceRef.current,
	};
}
