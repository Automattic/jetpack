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
import maskContent from '$lib/utils/mask-content';

type CriticalCssContextValues = {
	isGenerating: boolean;
	setGenerating: ( generating: boolean ) => void;

	providerProgress: number;
	setProviderProgress: ( progress: number ) => void;

	// Whether we've retried generating critical CSS after an error.
	hasRetriedAfterError: boolean;
	setHasRetriedAfterError: ( hasRetried: boolean ) => void;
};

type ProviderProps = {
	children: ReactNode;
};

const CriticalCssContext = createContext< CriticalCssContextValues | null >( null );

/**
 * Local Critical CSS Context Provider component - provides context for any descendants that want to
 * either initiate the local Critical CSS generator, or check its status.
 *
 * @param {ProviderProps} props - Component props.
 */
export default function CriticalCssProvider( { children }: ProviderProps ) {
	const [ isGenerating, setGenerating ] = useState< boolean >( false );
	const [ providerProgress, setProviderProgress ] = useState< number >( 0 );
	const [ hasRetriedAfterError, setHasRetriedAfterError ] = useState< boolean >( false );

	const value = {
		// Local Generator status.
		isGenerating,
		setGenerating,
		providerProgress,
		setProviderProgress,

		// Whether we've retried generating critical CSS after an error.
		hasRetriedAfterError,
		setHasRetriedAfterError,
	};

	return <CriticalCssContext.Provider value={ value }>{ children }</CriticalCssContext.Provider>;
}

/**
 * Internal helper function: Use the raw Critical CSS Generator context, and verify it's inside a provider.
 */
function useCriticalCssContext() {
	const status = useContext( CriticalCssContext );

	if ( ! status ) {
		throw new Error( 'Critical CSS status not available' );
	}

	return status;
}

/**
 * For status consumers: Get an overview of the local critical CSS generator status. Is it running or not?
 */
export function useLocalCriticalCssGeneratorStatus() {
	const { isGenerating, providerProgress } = useCriticalCssContext();

	return { isGenerating, providerProgress };
}

/** The retried state of critical CSS. */
export function useCriticalCssRetriedAfterErrorState() {
	const { hasRetriedAfterError: hasRetried, setHasRetriedAfterError: setHasRetried } =
		useCriticalCssContext();

	return [ hasRetried, setHasRetried ] as const;
}

/**
 * For Critical CSS UI: Actually run the local generator and return its status.
 */
export function useLocalCriticalCssGenerator() {
	// Local Generator status context.
	const { isGenerating, setGenerating, providerProgress, setProviderProgress } =
		useCriticalCssContext();

	// Critical CSS state and actions.
	const [ cssState, setCssState ] = useCriticalCssState();
	const setProviderCssAction = useSetProviderCssAction();
	const setProviderErrorsAction = useSetProviderErrorsAction();
	const generateCriticalCssAction = useRegenerateCriticalCssAction();

	// Proxy nonce - reqiured config for the generator.
	const proxyNonce = useProxyNonce();

	useEffect(
		() => {
			if ( cssState.status === 'pending' && cssState.providers.length > 0 ) {
				let abortController: AbortController | undefined;

				setGenerating( true );
				abortController = runLocalGenerator( cssState.providers, proxyNonce, {
					onError: ( error: Error ) => setCssState( criticalCssErrorState( error.message ) ),

					onFinished: () => {
						setGenerating( false );
						abortController = undefined;
					},

					setProviderCss: ( key: string, css: string ) => {
						return setProviderCssAction.mutateAsync( { key, css: maskContent( css ) } );
					},

					setProviderErrors: ( key: string, errors: CriticalCssErrorDetails[] ) =>
						setProviderErrorsAction.mutateAsync( { key, errors } ),

					setProviderProgress,
				} );

				return () => abortController && abortController.abort();
			} else if ( cssState.status === 'not_generated' ) {
				// If there is no css generated, request that the generator start.
				generateCriticalCssAction.mutate();
			}
		},

		// Only run this Effect when the Critical CSS status actually changes (e.g. from generated to pending).
		// This effect triggers an actual process that is costly to start and stop, so we don't want to start/stop it
		// every time an object ref like `cssState` is changed for a trivial reason.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ cssState.status, cssState.providers.length ]
	);

	const progress =
		( isGenerating && calculateCriticalCssProgress( cssState.providers, providerProgress ) ) || 0;

	return { isGenerating, progress };
}
