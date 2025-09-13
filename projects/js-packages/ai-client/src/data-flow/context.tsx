/**
 * External dependencies
 */
import { createContext } from 'react';
/**
 * Types & Constants
 */
import SuggestionsEventSource from '../suggestions-event-source/index.ts';
import type { AskQuestionOptionsArgProps } from '../ask-question/index.ts';
import type { RequestingErrorProps } from '../hooks/use-ai-suggestions/index.ts';
import type { PromptProp, RequestingStateProp } from '../types.ts';
import type { ReactElement } from 'react';

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
	children: ReactElement;
};

/**
 * AI Data Context
 *
 * @return {AiDataContextProps} Context.
 */
export const AiDataContext = createContext< AiDataContextProps | object >( {} );

/**
 * AI Data Context Provider
 *
 * @param {AiDataContextProviderProps} props - Component props.
 * @return {ReactElement}                           Context provider.
 * @example
 * <AiDataContextProvider value={ value }>
 * 	{ children }
 * </AiDataContextProvider>
 */
export const AiDataContextProvider = ( {
	value,
	children,
}: AiDataContextProviderProps ): ReactElement => (
	<AiDataContext.Provider value={ value } children={ children } />
);
