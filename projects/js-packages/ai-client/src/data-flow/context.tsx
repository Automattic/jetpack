/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';
import React from 'react';
/**
 * Types & Constants
 */
import SuggestionsEventSource from '../suggestions-event-source';
import type { AskQuestionOptionsArgProps } from '../ask-question';
import type { RequestingErrorProps } from '../hooks/use-ai-suggestions';
import type { PromptProp } from '../types';
import type { RequestingStateProp } from '../types';

export type AiDataContextProps = {
	/*
	 * Suggestion value
	 */
	suggestion: string;

	/*
	 * Suggestion error
	 */
	requestingError: RequestingErrorProps;

	/*
	 * Requesting state
	 */
	requestingState: RequestingStateProp;

	/*
	 * Request suggestion function
	 */
	requestSuggestion: ( prompt: PromptProp, options?: AskQuestionOptionsArgProps ) => void;

	/*
	 * Stop suggestion function
	 */
	stopSuggestion: () => void;

	/*
	 * The Suggestions Event Source instance
	 */
	eventSource: SuggestionsEventSource | null;
};

type AiDataContextProviderProps = {
	/*
	 * Data to provide to the context
	 */
	value: AiDataContextProps;

	/*
	 * Children
	 */
	children: React.ReactElement;
};

/**
 * AI Data Context
 *
 * @returns {AiDataContextProps} Context.
 */
export const AiDataContext = createContext( {} as AiDataContextProps );

/**
 * AI Data Context Provider
 *
 * @param {AiDataContextProviderProps} props - Component props.
 * @returns {React.ReactElement}                           Context provider.
 * @example
 * <AiDataContextProvider value={ value }>
 * 	{ children }
 * </AiDataContextProvider>
 */
export const AiDataContextProvider = ( {
	value,
	children,
}: AiDataContextProviderProps ): React.ReactElement => (
	<AiDataContext.Provider value={ value } children={ children } />
);
