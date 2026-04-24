/* eslint-disable jsdoc/require-description, jsdoc/require-param-description, jsdoc/require-returns */

import { createContext, useContext } from '@wordpress/element';
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

	return (
		<FileBrowserContext.Provider value={ { fileBrowserState, locale, notices } }>
			{ children }
		</FileBrowserContext.Provider>
	);
}
