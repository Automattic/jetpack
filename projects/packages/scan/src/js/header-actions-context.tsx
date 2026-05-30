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

export const HeaderActionsProvider: FC< { children: ReactNode } > = ( { children } ) => {
	const [ actions, setActions ] = useState< ReactNode >( null );
	return (
		<HeaderActionsContext.Provider value={ { actions, setActions } }>
			{ children }
		</HeaderActionsContext.Provider>
	);
};

export const useHeaderActions = (): ReactNode => useContext( HeaderActionsContext ).actions;

export const useSetHeaderActions = (): ( ( actions: ReactNode ) => void ) => {
	const { setActions } = useContext( HeaderActionsContext );
	return useCallback( ( next: ReactNode ) => setActions( next ), [ setActions ] );
};
