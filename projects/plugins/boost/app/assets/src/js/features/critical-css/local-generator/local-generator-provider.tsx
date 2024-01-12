import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import {
	calculateCriticalCssProgress,
	criticalCssErrorState,
	useCriticalCssState,
	useProxyNonce,
	useSetProviderCssAction,
	useSetProviderErrorsAction,
	useRegenerateCriticalCssAction,
} from '../lib/stores/critical-css-state';
import { runLocalGenerator } from '../lib/generate-critical-css';
import { CriticalCssErrorDetails } from '../lib/stores/critical-css-state-types';

type LocalGeneratorContext = {
	abortController?: AbortController;
	setAbortController: ( controller: AbortController | undefined ) => void;

	providerProgress: number;
	setProviderProgress: ( progress: number ) => void;
};

type ProviderProps = {
	children: ReactNode;
};

const CssGeneratorContext = createContext< LocalGeneratorContext | null >( null );

/**
 * Local Critical CSS Context Provider component - provides context for any descendants that want to
 * either initiate the local Critical CSS generator, or check its status.
 *
 * @param {ProviderProps} props - Component props.
 */
export default function LocalCriticalCssGeneratorProvider( { children }: ProviderProps ) {
	const [ abortController, setAbortController ] = useState< AbortController | undefined >(
		undefined
	);
	const [ providerProgress, setProviderProgress ] = useState< number >( 0 );

	const value = {
		abortController,
		setAbortController,
		providerProgress,
		setProviderProgress,
	};

	return <CssGeneratorContext.Provider value={ value }>{ children }</CssGeneratorContext.Provider>;
}

/**
 * Internal helper function: Use the raw Critical CSS Generator context, and verify it's inside a provider.
 */
function useLocalCriticalCssGeneratorContext() {
	const status = useContext( CssGeneratorContext );

	if ( ! status ) {
		throw new Error( 'Local critical CSS generator status not available' );
	}

	return status;
}

/**
 * For status consumers: Get an overview of the local critical CSS generator status. Is it running or not?
 */
export function useLocalCriticalCssGeneratorStatus() {
	const status = useLocalCriticalCssGeneratorContext();

	return {
		isRunning: !! status.abortController,
	};
}

/**
 * For Critical CSS UI: Actually run the local generator and return its status.
 */
export function useLocalCriticalCssGenerator() {
	// Local Generator status context.
	const { abortController, setAbortController, providerProgress, setProviderProgress } =
		useLocalCriticalCssGeneratorContext();

	// Critical CSS state and actions.
	const [ cssState, setCssState ] = useCriticalCssState();
	const setProviderCssAction = useSetProviderCssAction();
	const setProviderErrorsAction = useSetProviderErrorsAction();
	const generateCriticalCssAction = useRegenerateCriticalCssAction();

	// Proxy nonce - reqiured config for the generator.
	const proxyNonce = useProxyNonce();

	useEffect(
		() => {
			if ( cssState.status === 'pending' && ! abortController ) {
				// Start the local generator if the css state is pending.
				setAbortController(
					runLocalGenerator( cssState.providers, proxyNonce, {
						onError: ( error: Error ) => setCssState( criticalCssErrorState( error.message ) ),
						onFinished: () => setAbortController( undefined ),
						setProviderCss: ( key: string, css: string ) =>
							setProviderCssAction.mutateAsync( { key, css } ),
						setProviderErrors: ( key: string, errors: CriticalCssErrorDetails[] ) =>
							setProviderErrorsAction.mutateAsync( { key, errors } ),
						setProviderProgress,
					} )
				);
			} else if ( cssState.status === 'not_generated' ) {
				// If there is no css generated, request that the generator start.
				generateCriticalCssAction.mutate();
			}

			return () => {
				if ( abortController ) {
					abortController.abort();
					setAbortController( undefined );
				}
			};
		},

		// Only run this Effect when the Critical CSS status actually changes (e.g. from generated to pending).
		// This effect triggers an actual process that is costly to start and stop, so we don't want to start/stop it
		// every time an object ref like `cssState` is changed for a trivial reason.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ cssState.status ]
	);

	const isRunning = !! abortController;
	const progress =
		( isRunning && calculateCriticalCssProgress( cssState.providers, providerProgress ) ) || 0;

	return { isRunning, progress };
}
