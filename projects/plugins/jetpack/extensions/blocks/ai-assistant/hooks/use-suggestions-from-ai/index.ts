/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect, useRef } from '@wordpress/element';
/**
 * Types
 */
import { SuggestionsEventSource, askQuestion } from '../../lib/suggestions';
import type { PromptItemProps } from '../../lib/prompt';

type UseSuggestionsFromAIOptions = {
	/*
	 * The content to get suggestions for.
	 */
	content: string;

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
	request: () => Promise< void >;
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

	const readyToRequest = postId && prompt?.length;

	/**
	 * Request handler.
	 *
	 * @returns {Promise<void>} The promise.
	 */
	const request = useCallback( async () => {
		try {
			source.current = await askQuestion( prompt, {
				postId,
				requireUpgrade: false, // It shouldn't be part of the askQuestion API.
				fromCache: false,
			} );

			if ( onSuggestion ) {
				source?.current?.addEventListener( 'suggestion', ( event: CustomEvent ) => {
					onSuggestion( event?.detail );
				} );
			}

			if ( onDone ) {
				source?.current?.addEventListener( 'suggestion', ( event: CustomEvent ) => {
					onDone( event?.detail );
				} );
			}
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( e );
		}
	}, [ prompt, postId, onSuggestion, onDone ] );

	// Request suggestions automatically when ready.
	useEffect( () => {
		if ( ! readyToRequest ) {
			return;
		}

		// Trigger the request.
		request();

		// Close the connection when unmounting.
		return () => {
			if ( ! autoRequest ) {
				return;
			}

			if ( ! source?.current ) {
				return;
			}

			source.current.close();
		};
	}, [ autoRequest, readyToRequest, request ] );

	return {
		// Expose the request handler.
		request: readyToRequest ? request : undefined,

		// Expose the EventHandlerSource
		source: source.current,

		// Export additional props doesn't hurt.
		postId,
		postTitle,
	};
}
