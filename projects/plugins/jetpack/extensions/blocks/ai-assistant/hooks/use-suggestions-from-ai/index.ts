/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Types
 */
import { SuggestionsEventSource, askQuestion } from '../../lib/suggestions';
import type { PromptItemProps } from '../../lib/prompt';

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

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

	/**
	 * onSuggestion function handler.
	 *
	 * @param {string} suggestion - The suggestion.
	 * @returns {void}
	 */
	const handleSuggestion = useCallback(
		( event: CustomEvent ) => onSuggestion( event?.detail ),
		[ onSuggestion ]
	);

	/**
	 * onDone function handler.
	 *
	 * @param {string} content - The content.
	 * @returns {void}
	 */
	const handleDone = useCallback( ( event: CustomEvent ) => onDone( event?.detail ), [ onDone ] );

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

			try {
				source.current = await askQuestion( promptArg, {
					postId,
					requireUpgrade: false, // It shouldn't be part of the askQuestion API.
					fromCache: false,
				} );

				if ( onSuggestion ) {
					source?.current?.addEventListener( 'suggestion', handleSuggestion );
				}

				if ( onDone ) {
					source?.current?.addEventListener( 'done', handleDone );
				}
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.error( e );
			}
		},
		[ postId, onSuggestion, onDone, handleSuggestion, handleDone ]
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

		// Export additional props doesn't hurt.
		postId,
		postTitle,
	};
}
