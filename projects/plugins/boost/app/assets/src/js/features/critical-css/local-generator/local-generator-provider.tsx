import { createContext, useContext, useEffect, useState } from 'react';
import {
	calculateCriticalCssProgress,
	criticalCssErrorState,
	useCriticalCssState,
	useProxyNonce,
	useSetProviderCss,
	useSetProviderErrors,
} from '../lib/stores/critical-css-state';
import { runLocalGenerator } from '../lib/generate-critical-css';

type LocalGeneratorContext = {
	abortController?: AbortController;
	setAbortController: ( controller: AbortController | undefined ) => void;

	providerProgress?: number;
	setProviderProgress: ( progress: number ) => void;
};

export const LocalCriticalCssGeneratorContext = createContext< LocalGeneratorContext | null >(
	null
);

export default function LocalCriticalCssGeneratorProvider( props: { children: React.ReactNode } ) {
	const [ abortController, setAbortController ] = useState< AbortController | undefined >(
		undefined
	);
	const [ providerProgress, setProviderProgress ] = useState< number | undefined >( undefined );

	const value = {
		abortController,
		setAbortController,
		providerProgress,
		setProviderProgress,
	};

	return (
		<LocalCriticalCssGeneratorContext.Provider value={ value }>
			{ props.children }
		</LocalCriticalCssGeneratorContext.Provider>
	);
}

function useLocalCriticalCssGeneratorContext() {
	const status = useContext( LocalCriticalCssGeneratorContext );

	if ( ! status ) {
		throw new Error( 'Local critical CSS generator status not available' );
	}

	return status;
}

/**
 * For consumers: Get an overview of the local critical CSS generator status. Is it running or not?
 */
export function useLocalCriticalCssGeneratorStatus() {
	const status = useLocalCriticalCssGeneratorContext();

	return {
		isRunning: !! status.abortController,
	};
}

/**
 * For Critical CSS UI: Actually run the local generator.
 */
export function useLocalCriticalCssGenerator() {
	// Local Generator status context.
	const { abortController, setAbortController, providerProgress, setProviderProgress } =
		useLocalCriticalCssGeneratorContext();

	// Critical CSS state and actions.
	const [ cssState, setCssState ] = useCriticalCssState();
	const setProviderCss = useSetProviderCss();
	const setProviderErrors = useSetProviderErrors();

	// Proxy nonce - reqiured config for the generator.
	const proxyNonce = useProxyNonce();

	// If autorun is on, start the generator when the status is pending.
	useEffect(
		() => {
			if ( cssState.status === 'pending' && ! abortController ) {
				setAbortController(
					runLocalGenerator( cssState.providers, proxyNonce, {
						onError: ( error: Error ) => setCssState( criticalCssErrorState( error.message ) ),
						onFinished: () => setAbortController( undefined ),
						setProviderCss,
						setProviderErrors,
						setProviderProgress,
					} )
				);
			}

			return () => {
				if ( abortController ) {
					abortController.abort();
					setAbortController( undefined );
				}
			};
		},

		// eslint-disable-next-line react-hooks/exhaustive-deps -- Only run when status changes.
		[ cssState.status ]
	);

	const isRunning = !! abortController;
	const progress =
		( isRunning && calculateCriticalCssProgress( cssState.providers, providerProgress ) ) ||
		undefined;

	return { isRunning, progress };
}
