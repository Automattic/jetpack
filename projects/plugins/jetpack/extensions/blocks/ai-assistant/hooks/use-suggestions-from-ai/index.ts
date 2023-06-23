/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Types
 */
import { PromptItemProps, delimiter } from '../../lib/prompt';
import { SuggestionsEventSource, askQuestion } from '../../lib/suggestions';

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

export type SuggestionError = {
	/*
	 * A string code to refer to the error.
	 */
	code: string;

	/*
	 * The user-friendly error message.
	 */
	message: string;

	/*
	 * The type of the error.
	 */
	status: 'info' | 'error';
};

type UseSuggestionsFromAIOptions = {
	/*
	 * Request prompt.
	 */
	prompt: Array< PromptItemProps >;

	/*
	 * Whether to request suggestions automatically.
	 */
	autoRequest?: boolean;

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
	onError?: ( error: SuggestionError ) => void;
};

export type RequestingStateProp = 'init' | 'requesting' | 'suggesting' | 'done' | 'error';

type useSuggestionsFromAIProps = {
	/*
	 * The post ID.
	 */
	postId: number;

	/*
	 * The post title.
	 */
	postTitle: string;

	/*
	 * Whether the request is in progress.
	 */
	requestingState: RequestingStateProp;

	/*
	 * The event source.
	 */
	source: SuggestionsEventSource | undefined;

	/*
	 * The request handler.
	 */
	request: ( prompt: Array< PromptItemProps > ) => Promise< void >;
};

/**
 * React custom hook to get suggestions from AI,
 * by hitting the query endpoint.
 *
 * @param {UseSuggestionsFromAIOptions} options - The options for the hook.
 * @returns {useSuggestionsFromAIProps}           The props for the hook.
 */
export default function useSuggestionsFromAI( {
	prompt,
	autoRequest = true,
	onSuggestion,
	onDone,
	onError,
}: UseSuggestionsFromAIOptions ): useSuggestionsFromAIProps {
	const [ requestingState, setRequestingState ] = useState< RequestingStateProp >( 'init' );
	// Collect data
	const { postId, postTitle } = useSelect( select => {
		return {
			postId: select( editorStore ).getCurrentPostId(),
			postTitle: select( editorStore ).getEditedPostAttribute( 'title' ),
		};
	}, [] );

	// Store the event source in a ref, so we can handle it if needed.
	const source = useRef< SuggestionsEventSource | undefined >( undefined );

	/**
	 * onSuggestion function handler.
	 *
	 * @param {string} suggestion - The suggestion.
	 * @returns {void}
	 */
	const handleSuggestion = useCallback(
		( event: CustomEvent ) => {
			/*
			 * Remove the delimiter string from the suggestion,
			 * only at the beginning and end of the string.
			 */
			const delimiterRegEx = new RegExp( `^${ delimiter }|${ delimiter }$`, 'g' );
			onSuggestion( event?.detail?.replace( delimiterRegEx, '' ) );
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
			/*
			 * Remove the delimiter string from the suggestion,
			 * only at the beginning and end of the string.
			 */
			const delimiterRegEx = new RegExp( `^${ delimiter }|${ delimiter }$`, 'g' );
			onDone( event?.detail?.replace( delimiterRegEx, '' ) );
			setRequestingState( 'done' );
		},
		[ onDone ]
	);

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
				source.current = await askQuestion( promptArg, {
					postId,
					requireUpgrade: false, // It shouldn't be part of the askQuestion API.
					fromCache: false,
				} );

				// Set the request status.
				setRequestingState( 'suggesting' );

				if ( onSuggestion ) {
					source?.current?.addEventListener( 'suggestion', handleSuggestion );
				}

				source?.current?.addEventListener( 'error_quota_exceeded', () => {
					source?.current?.close();
					setRequestingState( 'error' );
					onError?.( {
						code: 'error_quota_exceeded',
						message: __( 'You have reached the limit of requests for this site.', 'jetpack' ),
						status: 'info',
					} );
				} );

				source?.current?.addEventListener( 'error_unclear_prompt', () => {
					source?.current?.close();
					setRequestingState( 'error' );
					onError?.( {
						code: 'error_unclear_prompt',
						message: __( 'Your request was unclear. Mind trying again?', 'jetpack' ),
						status: 'info',
					} );
				} );

				source?.current?.addEventListener( 'error_service_unavailable', () => {
					source?.current?.close();
					setRequestingState( 'error' );
					onError?.( {
						code: 'error_service_unavailable',
						message: __(
							'Jetpack AI services are currently unavailable. Sorry for the inconvenience.',
							'jetpack'
						),
						status: 'info',
					} );
				} );

				source?.current?.addEventListener( 'error_moderation', () => {
					source?.current?.close();
					setRequestingState( 'error' );
					onError?.( {
						code: 'error_moderation',
						message: __(
							'This request has been flagged by our moderation system. Please try to rephrase it and try again.',
							'jetpack'
						),
						status: 'info',
					} );
				} );

				source?.current?.addEventListener( 'error_network', () => {
					source?.current?.close();
					setRequestingState( 'error' );
					onError?.( {
						code: 'error_network',
						message: __(
							'It was not possible to process your request. Mind trying again?',
							'jetpack'
						),
						status: 'info',
					} );
				} );

				source?.current?.addEventListener( 'done', handleDone );
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( e );
			}
		},
		[ postId, onSuggestion, onError, handleSuggestion, handleDone ]
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

		// Close the connection when unmounting.
		return () => {
			if ( ! autoRequest ) {
				return;
			}

			if ( ! source?.current ) {
				return;
			}

			// Close the connection.
			source.current.close();

			// Clean up the event listeners.
			source?.current?.removeEventListener( 'suggestion', handleSuggestion );
			source?.current?.removeEventListener( 'done', handleDone );
		};
	}, [ autoRequest, handleDone, handleSuggestion, prompt, request ] );

	return {
		// Expose the request handler.
		request,

		// Expose the EventHandlerSource
		source: source.current,

		// Process statuses
		requestingState,

		// Export additional props doesn't hurt.
		postId,
		postTitle,
	};
}
