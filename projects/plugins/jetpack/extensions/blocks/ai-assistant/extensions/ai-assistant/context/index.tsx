/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';

type AiAssistantContextProps = {
	// Dialog visibility
	isAssistantShown: boolean;
	showAssistant: () => void;
	hideAssistant: () => void;
	toggleAssistant: () => void;

	isAssistantMenuShown: boolean;
	hideAssistantMenu: () => void;
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
