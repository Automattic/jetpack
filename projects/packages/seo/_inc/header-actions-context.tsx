/* eslint-disable jsdoc/require-returns, jsdoc/require-param, jsdoc/escape-inline-tags */

import { createContext, useCallback, useContext, useState } from 'react';
import type { FC, ReactNode } from 'react';

interface HeaderActionsContextValue {
	actions: ReactNode;
	setActions: ( actions: ReactNode ) => void;
}

const HeaderActionsContext = createContext< HeaderActionsContextValue >( {
	actions: null,
	setActions: () => {},
} );

/**
 * Provider owned by Shell. Lets routed screens inject buttons into the
 * AdminPage header's `actions` slot without Shell knowing about them ahead
 * of time. Mirrors the Slot/Fill pattern @wordpress/components uses for the
 * plugin editor sidebars, but implemented as React context for simplicity.
 */
export const HeaderActionsProvider: FC< { children: ReactNode } > = ( { children } ) => {
	const [ actions, setActions ] = useState< ReactNode >( null );
	return (
		<HeaderActionsContext.Provider value={ { actions, setActions } }>
			{ children }
		</HeaderActionsContext.Provider>
	);
};

/**
 * Read the actions Shell should render in AdminPage's header.
 */
export const useHeaderActions = (): ReactNode => useContext( HeaderActionsContext ).actions;

/**
 * Register a render function for the header actions slot. Pass `null` (or
 * omit this hook) to clear the slot. Accepts a stable setter function — if
 * you call `setHeaderActions` with a ReactNode that changes identity each
 * render, wrap in `useMemo` to avoid churn.
 */
export const useSetHeaderActions = (): ( ( actions: ReactNode ) => void ) => {
	const { setActions } = useContext( HeaderActionsContext );
	return useCallback( ( next: ReactNode ) => setActions( next ), [ setActions ] );
};
