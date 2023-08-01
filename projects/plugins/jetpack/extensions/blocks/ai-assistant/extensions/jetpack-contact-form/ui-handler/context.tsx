/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';

type AiAssistantUiContextProps = {
	isVisible: boolean;

	popoverProps?: {
		anchor: HTMLElement | null;
		offset?: number;
		placement?:
			| 'top'
			| 'top-start'
			| 'top-end'
			| 'right'
			| 'right-start'
			| 'right-end'
			| 'bottom'
			| 'bottom-start'
			| 'bottom-end'
			| 'left'
			| 'left-start'
			| 'left-end'
			| 'overlay';
	};

	show: () => void;
	hide: () => void;
	toggle: () => void;

	setPopoverProps: ( props: AiAssistantUiContextProps[ 'popoverProps' ] ) => void;
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
