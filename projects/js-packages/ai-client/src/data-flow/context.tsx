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

export type AiAssistantDataContextProps = {
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

type AiAssistantDataContextProviderProps = {
	/*
	 * Open the AI Assistant
	 */
	value: AiAssistantDataContextProps;

	/*
	 * Children
	 */
	children: React.ReactNode;
};

/**
 * Ai Assistant Context
 *
 * @returns {AiAssistantDataContextProps} Context.
 */
export const AiAssistantDataContext = createContext( {} as AiAssistantDataContextProps );

/**
 * Ai Assistant Context Provider
 *
 * @param {AiAssistantDataContextProviderProps} props - Component props.
 * @returns {React.ReactNode}                           Context provider.
 * @example
 * <AiAssistantDataContextProvider value={ value }>
 * 	{ children }
 * </AiAssistantDataContextProvider>
 */
export const AiAssistantDataContextProvider = ( {
	value,
	children,
}: AiAssistantDataContextProviderProps ): React.ReactNode => (
	<AiAssistantDataContext.Provider value={ value } children={ children } />
);
