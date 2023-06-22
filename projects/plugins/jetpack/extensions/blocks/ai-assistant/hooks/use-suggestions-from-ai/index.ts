/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Types
 */
import { SuggestionsEventSource, askQuestion } from '../../lib/suggestions';
import type { PromptItemProps } from '../../lib/prompt';

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

type SourceCallback = ( event: CustomEvent ) => void;

type PromptMessages = Array< PromptItemProps >;

type PromptArg = PromptMessages[] | PromptMessages;

type ExtraArgs =
	| {
			[ key: string ]: object | string | number | boolean;
			index?: number;
	  }
	| undefined;

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
	onSuggestion?: ( suggestion: string, extraArgs?: ExtraArgs ) => void;

	/*
	 * onDone callback.
	 */
	onDone?: ( content: string, extraArgs?: ExtraArgs ) => void;

	/*
	 * onError callback.
	 */
	onError?: ( error: SuggestionError ) => void;
};

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
	 * The event source.
	 */
	source: SuggestionsEventSource | undefined;

	/*
	 * The request handler.
	 */
	request: ( prompt: PromptArg, extraArgs?: ExtraArgs ) => Promise< void >;
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
	// Collect data
	const { postId, postTitle } = useSelect( select => {
		return {
			postId: select( editorStore ).getCurrentPostId(),
			postTitle: select( editorStore ).getEditedPostAttribute( 'title' ),
		};
	}, [] );

	// Store the event source in a ref, so we can handle it if needed.
	const source = useRef< SuggestionsEventSource | undefined >( undefined );

	// Store callback fn
	const handleSuggestion = useRef< SourceCallback | undefined >( undefined );
	const handleDone = useRef< SourceCallback | undefined >( undefined );

	/**
	 * Request handler.
	 *
	 * @returns {Promise<void>} The promise.
	 */
	const request = useCallback(
		async ( promptArg: PromptArg, extraArgs?: ExtraArgs ) => {
			const currentIndex = extraArgs?.index ?? 0;
			const isMultiple = Array.isArray( promptArg[ 0 ] );
			const hasNext = isMultiple && promptArg?.[ currentIndex + 1 ] !== undefined;
			const nextExtraArgs = { ...( extraArgs || {} ), index: currentIndex + 1 };
			const currentPrompt = (
				isMultiple ? promptArg[ currentIndex ] : promptArg
			) as PromptMessages;

			const log = ( messages: PromptMessages ) => {
				messages.forEach( ( { role, content: promptContent }, i ) =>
					debug( '(%s/%s) %o\n%s', i + 1, promptArg.length, `[${ role }]`, promptContent )
				);
			};

			try {
				log( currentPrompt );

				source.current = await askQuestion( currentPrompt, {
					postId,
					requireUpgrade: false, // It shouldn't be part of the askQuestion API.
					fromCache: false,
				} );

				handleSuggestion.current = ( event: CustomEvent ) =>
					onSuggestion?.( event?.detail, extraArgs );

				source?.current?.addEventListener( 'suggestion', handleSuggestion.current );

				handleDone.current = ( event: CustomEvent ) => {
					onDone?.( event?.detail, extraArgs );
					if ( hasNext ) {
						request( promptArg, nextExtraArgs );
					}
				};

				source?.current?.addEventListener( 'done', handleDone.current );

				if ( onError ) {
					source?.current?.addEventListener( 'error_quota_exceeded', () => {
						source?.current?.close();
						onError( {
							code: 'error_quota_exceeded',
							message: __( 'You have reached the limit of requests for this site.', 'jetpack' ),
							status: 'info',
						} );
					} );

					source?.current?.addEventListener( 'error_unclear_prompt', () => {
						source?.current?.close();
						onError( {
							code: 'error_unclear_prompt',
							message: __( 'Your request was unclear. Mind trying again?', 'jetpack' ),
							status: 'info',
						} );
					} );

					source?.current?.addEventListener( 'error_service_unavailable', () => {
						source?.current?.close();
						onError( {
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
						onError( {
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
						onError( {
							code: 'error_network',
							message: __(
								'It was not possible to process your request. Mind trying again?',
								'jetpack'
							),
							status: 'info',
						} );
					} );
				}
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( e );
			}
		},
		[ postId, onSuggestion, onDone, onError, handleSuggestion, handleDone ]
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
			source?.current?.removeEventListener( 'suggestion', handleSuggestion.current );
			source?.current?.removeEventListener( 'done', handleDone.current );
		};
	}, [ autoRequest, handleDone, handleSuggestion, prompt, request ] );

	return {
		// Expose the request handler.
		request,

		// Expose the EventHandlerSource
		source: source.current,

		// Export additional props doesn't hurt.
		postId,
		postTitle,
	};
}
