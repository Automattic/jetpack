/**
 * External dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import askQuestion from '../../ask-question/index.js';
import {
	ERROR_CONTEXT_TOO_LARGE,
	ERROR_MODERATION,
	ERROR_NETWORK,
	ERROR_QUOTA_EXCEEDED,
	ERROR_SERVICE_UNAVAILABLE,
	ERROR_UNCLEAR_PROMPT,
	ERROR_RESPONSE,
} from '../../types.js';
/**
 * Types & constants
 */
import type { AskQuestionOptionsArgProps } from '../../ask-question/index.js';
import type SuggestionsEventSource from '../../suggestions-event-source/index.js';
import type { PromptProp, SuggestionErrorCode } from '../../types.js';
import type { RequestingStateProp } from '../../types.js';

export type RequestingErrorProps = {
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
	prompt?: PromptProp;

	/*
	 * Whether to request suggestions automatically.
	 */
	autoRequest?: boolean;

	/**
	 * AskQuestion options.
	 */
	askQuestionOptions?: AskQuestionOptionsArgProps;

	/*
	 * Initial requesting state.
	 */
	initialRequestingState?: RequestingStateProp;

	/*
	 * onSuggestion callback.
	 */
	onSuggestion?: ( suggestion: string ) => void;

	/*
	 * onDone callback.
	 */
	onDone?: ( content: string ) => void;

	/*
	 * onStop callback.
	 */
	onStop?: () => void;

	/*
	 * onError callback.
	 */
	onError?: ( error: RequestingErrorProps ) => void;

	/*
	 * Error callback common for all errors.
	 */
	onAllErrors?: ( error: RequestingErrorProps ) => void;
};

type useAiSuggestionsProps = {
	/*
	 * The suggestion.
	 */
	suggestion: string;

	/*
	 * The error.
	 */
	error: RequestingErrorProps | undefined;

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
	request: ( prompt: PromptProp, options?: AskQuestionOptionsArgProps ) => Promise< void >;

	/*
	 * Reset the request state.
	 */
	reset: () => void;

	/*
	 * The handler to stop a suggestion.
	 */
	stopSuggestion: () => void;

	/*
	 * The handler to handle the quota exceeded error.
	 */
	handleErrorQuotaExceededError: () => void;
};

/**
 * Get the error data for a given error code.
 *
 * @param {SuggestionErrorCode} errorCode - The error code.
 * @returns {RequestingErrorProps}          The error data.
 */
export function getErrorData( errorCode: SuggestionErrorCode ): RequestingErrorProps {
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
		case ERROR_CONTEXT_TOO_LARGE:
			return {
				code: ERROR_CONTEXT_TOO_LARGE,
				message: __(
					'The content is too large to be processed all at once. Please try to shorten it or divide it into smaller parts.',
					'jetpack-ai-client'
				),
				severity: 'info',
			};
		case ERROR_NETWORK:
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
	initialRequestingState = 'init',
	onSuggestion,
	onDone,
	onStop,
	onError,
	onAllErrors,
}: useAiSuggestionsOptions = {} ): useAiSuggestionsProps {
	const [ requestingState, setRequestingState ] =
		useState< RequestingStateProp >( initialRequestingState );
	const [ suggestion, setSuggestion ] = useState< string >( '' );
	const [ error, setError ] = useState< RequestingErrorProps >();

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
			closeEventSource();
			onDone?.( event?.detail );
			setRequestingState( 'done' );
		},
		[ onDone ]
	);

	const handleAnyError = useCallback(
		( event: CustomEvent ) => {
			onAllErrors?.( event?.detail );
		},
		[ onAllErrors ]
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

	const handleNetworkError = useCallback( () => handleError( ERROR_NETWORK ), [] );

	/**
	 * Request handler.
	 *
	 * @param {PromptProp} promptArg               - The messages array of the prompt.
	 * @param {AskQuestionOptionsArgProps} options - The options for the askQuestion request. Uses the hook's askQuestionOptions by default.
	 * @returns {Promise<void>} The promise.
	 */
	const request = useCallback(
		async (
			promptArg: PromptProp,
			options: AskQuestionOptionsArgProps = { ...askQuestionOptions }
		) => {
			// Clear any error.
			setError( undefined );

			// Set the request status.
			setRequestingState( 'requesting' );

			eventSourceRef.current = await askQuestion( promptArg, options );

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
			eventSource.addEventListener( ERROR_NETWORK, handleNetworkError );
			eventSource.addEventListener( ERROR_RESPONSE, handleAnyError );

			eventSource.addEventListener( 'done', handleDone );
		},
		[
			handleDone,
			handleErrorQuotaExceededError,
			handleUnclearPromptError,
			handleServiceUnavailableError,
			handleModerationError,
			handleNetworkError,
			handleSuggestion,
		]
	);

	/**
	 * Reset the request state.
	 *
	 * @returns {void}
	 */
	const reset = useCallback( () => {
		setRequestingState( 'init' );
		setSuggestion( '' );
		setError( undefined );
	}, [] );

	/**
	 * Close the event source connection.
	 *
	 * @returns {void}
	 */
	const closeEventSource = useCallback( () => {
		if ( ! eventSourceRef?.current ) {
			return;
		}

		// Alias
		const eventSource = eventSourceRef?.current;

		// Close the connection.
		eventSource.close();

		// Clean up the event listeners.
		eventSource.removeEventListener( 'suggestion', handleSuggestion );

		eventSource.removeEventListener( ERROR_QUOTA_EXCEEDED, handleErrorQuotaExceededError );
		eventSource.removeEventListener( ERROR_UNCLEAR_PROMPT, handleUnclearPromptError );
		eventSource.removeEventListener( ERROR_SERVICE_UNAVAILABLE, handleServiceUnavailableError );
		eventSource.removeEventListener( ERROR_MODERATION, handleModerationError );
		eventSource.removeEventListener( ERROR_NETWORK, handleNetworkError );

		eventSource.removeEventListener( 'done', handleDone );
	}, [
		eventSourceRef,
		handleSuggestion,
		handleErrorQuotaExceededError,
		handleUnclearPromptError,
		handleServiceUnavailableError,
		handleModerationError,
		handleNetworkError,
		handleDone,
	] );

	/**
	 * Stop suggestion handler.
	 *
	 * @returns {void}
	 */
	const stopSuggestion = useCallback( () => {
		closeEventSource();
		onStop?.();
		setRequestingState( 'done' );
	}, [ onStop ] );

	// Request suggestions automatically when ready.
	useEffect( () => {
		// Check if there is a prompt to request.
		if ( ! prompt?.length ) {
			return;
		}

		// Trigger the request.
		if ( autoRequest ) {
			request( prompt, askQuestionOptions );
		}

		return () => {
			// Stop the suggestion if the component unmounts.
			stopSuggestion();
		};
	}, [ autoRequest, prompt, request, stopSuggestion ] );

	return {
		// Data
		suggestion,
		error,
		requestingState,

		// Requests handlers
		request,
		stopSuggestion,
		reset,

		// Error handlers
		handleErrorQuotaExceededError,

		// SuggestionsEventSource
		eventSource: eventSourceRef.current,
	};
}
