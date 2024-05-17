/**
 * External dependencies
 */
import React, { createContext } from 'react';
/**
 * Types & Constants
 */
import SuggestionsEventSource from '../suggestions-event-source/index.js';
import type { AskQuestionOptionsArgProps } from '../ask-question/index.js';
import type { RequestingErrorProps } from '../hooks/use-ai-suggestions/index.js';
import type { PromptProp } from '../types.js';
import type { RequestingStateProp } from '../types.js';

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
export const AiDataContext = createContext< AiDataContextProps | object >( {} );

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
