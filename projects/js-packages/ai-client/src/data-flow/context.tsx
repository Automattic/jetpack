/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';
import React from 'react';
/**
 * Types & Constants
 */
import SuggestionsEventSource from '../suggestions-event-source';
import type { RequestingStateProp, RequestingErrorProps } from '../hooks/use-ai-suggestions';
import type { PromptProp } from '../types';

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
	requestSuggestion: ( prompt: PromptProp ) => void;

	/*
	 * The Suggestions Event Source instance
	 */
	eventSource: SuggestionsEventSource | null;
};

type AiDataContextProviderProps = {
	/*
	 * Open the AI Assistant
	 */
	value: AiDataContextProps;

	/*
	 * Children
	 */
	children: React.ReactNode;
};

/**
 * Ai Assistant Context
 *
 * @returns {AiDataContextProps} Context.
 */
export const AiDataContext = createContext( {} as AiDataContextProps );

/**
 * Ai Assistant Context Provider
 *
 * @param {AiDataContextProviderProps} props - Component props.
 * @returns {React.ReactNode}                           Context provider.
 * @example
 * <AiDataContextProvider value={ value }>
 * 	{ children }
 * </AiDataContextProvider>
 */
export const AiDataContextProvider = ( {
	value,
	children,
}: AiDataContextProviderProps ): React.ReactNode => (
	<AiDataContext.Provider value={ value } children={ children } />
);
