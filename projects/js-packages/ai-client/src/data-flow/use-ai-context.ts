/**
 * External dependencies
 */
import { useCallback, useContext, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { ERROR_RESPONSE, RequestingErrorProps } from '../types.js';
import { AiDataContext } from './index.js';
/**
 * Types & constants
 */
import type { AiDataContextProps } from './context.js';
import type { AskQuestionOptionsArgProps } from '../ask-question/index.js';

export type UseAiContextOptions = {
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

	/*
	 * onError callback.
	 */
	onError?: ( error: RequestingErrorProps ) => void;
};

/**
 * useAiContext hook to provide access to
 * the AI Assistant data (from context),
 * and to subscribe to the request events (onDone, onSuggestion).
 *
 * @param {UseAiContextOptions} options - the hook options.
 * @returns {AiDataContextProps}          the AI Assistant data context.
 */
export default function useAiContext( {
	onDone,
	onSuggestion,
	onError,
}: UseAiContextOptions = {} ): AiDataContextProps {
	const context = useContext( AiDataContext ) as AiDataContextProps;
	const { eventSource } = context;

	const done = useCallback( ( event: CustomEvent ) => onDone?.( event?.detail ), [ onDone ] );
	const suggestion = useCallback(
		( event: CustomEvent ) => onSuggestion?.( event?.detail ),
		[ onSuggestion ]
	);
	const error = useCallback( ( event: CustomEvent ) => {
		onError?.( event?.detail );
	}, [] );

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

		if ( onError ) {
			eventSource.addEventListener( ERROR_RESPONSE, error );
		}

		return () => {
			eventSource.removeEventListener( 'done', done );
			eventSource.removeEventListener( 'suggestion', suggestion );
			eventSource.removeEventListener( ERROR_RESPONSE, error );
		};
	}, [ eventSource ] );

	return context;
}
