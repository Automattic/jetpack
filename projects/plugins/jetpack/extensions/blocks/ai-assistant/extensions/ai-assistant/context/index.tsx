/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';
/**
 * Types
 */
import type { RequestingStateProp } from '../../../hooks/use-suggestions-from-ai';
import type { PromptItemProps } from '../../../lib/prompt';

type AiAssistantContextProps = {
	// Dialog visibility
	isAssistantShown: boolean;
	showAssistant: () => void;
	hideAssistant: () => void;
	toggleAssistant: () => void;

	isAssistantMenuShown: boolean;
	hideAssistantMenu: () => void;

	promptValue: string;
	setPromptValue: ( value: string ) => void;

	// Request actions and state
	requestingState: RequestingStateProp;
	requestSuggestion: ( prompts: Array< PromptItemProps > ) => void;
};

type AiAssistantContextProviderProps = {
	/*
	 * Open the AI Assistant
	 */
	value: AiAssistantContextProps;

	/*
	 * Children
	 */
	children: React.ReactNode;
};

/**
 * Ai Assistant Context
 */
export const AiAssistantContext = createContext( {} as AiAssistantContextProps );

export const AiAssistantContextProvider = ( {
	value,
	children,
}: AiAssistantContextProviderProps ) => (
	<AiAssistantContext.Provider value={ value } children={ children } />
);
