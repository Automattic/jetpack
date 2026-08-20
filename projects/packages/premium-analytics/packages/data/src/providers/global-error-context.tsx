/**
 * External dependencies
 */
import { onlineManager } from '@tanstack/react-query';
import {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useSyncExternalStore,
	type ReactNode,
} from 'react';
/**
 * Internal dependencies
 */
import { globalErrorManager, type GlobalErrorType } from './global-error-manager';

interface GlobalErrorContextValue {
	globalError: GlobalErrorType;
	setGlobalError: ( error: GlobalErrorType ) => void;
	clearGlobalError: () => void;
	isGlobalError: boolean;
}

const GlobalErrorContext = createContext< GlobalErrorContextValue | null >( null );

export function GlobalErrorProvider( { children }: { children: ReactNode } ) {
	const globalError = useSyncExternalStore(
		globalErrorManager.subscribe,
		globalErrorManager.getError,
		globalErrorManager.getError
	);

	/**
	 * When offline, TanStack Query pauses queries (doesn't execute them), so
	 * QueryCache.onError never fires — offline has to be detected here instead.
	 */
	useEffect( () => {
		if ( ! onlineManager.isOnline() ) {
			globalErrorManager.setError( 'network' );
		}

		const unsubscribe = onlineManager.subscribe( isOnline => {
			if ( ! isOnline ) {
				globalErrorManager.setError( 'network' );
			} else if ( globalErrorManager.getError() === 'network' ) {
				globalErrorManager.clearError();
			}
		} );

		return unsubscribe;
	}, [] );

	const contextValue = useMemo(
		() => ( {
			globalError,
			setGlobalError: globalErrorManager.setError,
			clearGlobalError: globalErrorManager.clearError,
			isGlobalError: globalError !== null,
		} ),
		[ globalError ]
	);

	return (
		<GlobalErrorContext.Provider value={ contextValue }>{ children }</GlobalErrorContext.Provider>
	);
}

let hasWarnedAboutMissingProvider = false;

const defaultContextValue: GlobalErrorContextValue = {
	globalError: null,
	setGlobalError: () => {},
	clearGlobalError: () => {},
	isGlobalError: false,
};

/**
 * Access global error state. Returns defaults if used outside GlobalErrorProvider.
 */
export function useGlobalError(): GlobalErrorContextValue {
	const context = useContext( GlobalErrorContext );

	if ( context ) {
		return context;
	}

	if ( ! hasWarnedAboutMissingProvider ) {
		hasWarnedAboutMissingProvider = true;
		// eslint-disable-next-line no-console
		console.warn(
			'useGlobalError was called outside of GlobalErrorProvider. ' +
				'Wrap your component tree with GlobalErrorProvider.'
		);
	}

	return defaultContextValue;
}
