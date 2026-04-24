/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { createContext, useContext, useMemo } from '@wordpress/element';
import { useFileBrowserState } from './use-file-browser-state';
import type { FileBrowserStateActions } from '../../../data/types';

interface NoticeHandlers {
	showError: ( message: string ) => void;
	showSuccess: ( message: string ) => void;
}

interface FileBrowserContextValue {
	fileBrowserState: FileBrowserStateActions;
	locale: string;
	notices?: NoticeHandlers;
}

const FileBrowserContext = createContext< FileBrowserContextValue | null >( null );

export const useFileBrowserContext = () => {
	const context = useContext( FileBrowserContext );
	if ( ! context ) {
		throw new Error( 'useFileBrowserContext must be used within FileBrowserProvider' );
	}
	return context;
};

interface FileBrowserProviderProps {
	children: React.ReactNode;
	locale: string;
	notices?: NoticeHandlers;
}

/**
 *
 * @param root0
 * @param root0.children
 * @param root0.locale
 * @param root0.notices
 */
export function FileBrowserProvider( { children, locale, notices }: FileBrowserProviderProps ) {
	const fileBrowserState = useFileBrowserState();

	// Memoize the context value so we don't hand every consumer a fresh
	// object each render. Without this, every FileBrowserNode below us
	// re-renders on every parent re-render — which among other things
	// resets the loading <Spinner>'s CSS animation to t=0 continuously
	// (looks static to the user) and re-paints every chevron SVG.
	const value = useMemo(
		() => ( { fileBrowserState, locale, notices } ),
		[ fileBrowserState, locale, notices ]
	);

	return <FileBrowserContext.Provider value={ value }>{ children }</FileBrowserContext.Provider>;
}
