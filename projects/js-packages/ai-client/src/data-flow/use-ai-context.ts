/**
 * External dependencies
 */
import { useCallback, useContext, useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { AiDataContext } from '.';
/**
 * Types & constants
 */
import type { AiDataContextProps } from './context';
import type { AskQuestionOptionsArgProps } from '../ask-question';

type useAiContextOptions = {
	/*
	 * Ask question options.
	 */
	askQuestionOptions?: AskQuestionOptionsArgProps;

	/*
	 * onDone callback.
	 */
	onDone?: ( content: string ) => void;

	/*
	 * onSuggestion callback.
	 */
	onSuggestion?: ( suggestion: string ) => void;
};

/**
 * useAiContext hook to provide access to
 * the AI Assistant data (from context),
 * and to subscribe to the request events (onDone, onSuggestion).
 *
 * @param {useAiContextOptions} options - the hook options.
 * @returns {AiDataContextProps}          the AI Assistant data context.
 */
export default function useAiContext( {
	onDone,
	onSuggestion,
}: useAiContextOptions = {} ): AiDataContextProps {
	const context = useContext( AiDataContext );
	const { eventSource } = context;

	const done = useCallback( ( event: CustomEvent ) => onDone?.( event?.detail ), [ onDone ] );
	const suggestion = useCallback(
		( event: CustomEvent ) => onSuggestion?.( event?.detail ),
		[ onSuggestion ]
	);

	useEffect( () => {
		if ( ! eventSource ) {
			return;
		}

		if ( onDone ) {
			eventSource.addEventListener( 'done', done );
		}

		if ( onSuggestion ) {
			eventSource.addEventListener( 'suggestion', suggestion );
		}

		return () => {
			eventSource.removeEventListener( 'done', done );
			eventSource.removeEventListener( 'suggestion', suggestion );
		};
	}, [ eventSource ] );

	return context;
}
