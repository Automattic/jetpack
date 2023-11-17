/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';

export type AiAssistantUiContextProps = {
	inputValue: string;

	isVisible: boolean;

	isFixed: boolean;

	assistantAnchor: HTMLElement | null;
	setAnchor: ( anchor: HTMLElement | null ) => void;

	setInputValue: ( value: string ) => void;

	show: () => void;
	hide: () => void;
	toggle: () => void;

	setAssistantFixed: ( isFixed: boolean ) => void;
};

type AiAssistantUiContextProviderProps = {
	/*
	 * Open the AI Assistant
	 */
	value: AiAssistantUiContextProps;

	/*
	 * Children
	 */
	children: React.ReactNode;
};

/**
 * Ai Assistant Context
 */
export const AiAssistantUiContext = createContext( {} as AiAssistantUiContextProps );

export const AiAssistantUiContextProvider = ( {
	value,
	children,
}: AiAssistantUiContextProviderProps ) => (
	<AiAssistantUiContext.Provider value={ value } children={ children } />
);
