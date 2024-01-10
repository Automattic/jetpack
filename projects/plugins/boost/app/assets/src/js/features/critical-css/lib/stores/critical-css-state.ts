import { CriticalCssErrorDetailsSchema, CriticalCssStateSchema } from './critical-css-state-types';
import type {
	CriticalCssErrorDetails,
	CriticalCssState,
	Provider,
} from './critical-css-state-types';
import { runLocalGenerator } from '../generate-critical-css';
import { useDataSync, useDataSyncAction } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import { useRegenerationReason } from './suggest-regenerate';

export function useCriticalCssState(): [ CriticalCssState, ( state: CriticalCssState ) => void ] {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'critical_css_state',
		CriticalCssStateSchema,
		{
			query: {
				refetchInterval: query => {
					return query.state.data?.status === 'pending' ? 2000 : 30000;
				},
			},
		}
	);

	if ( ! data ) {
		throw new Error( 'Critical CSS state not available' );
	}

	return [ data, mutate ];
}

function errorState( message: string ): CriticalCssState {
	return {
		providers: [],
		status: 'error',
		status_error: message,
	};
}

export function useSetProviderCss() {
	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'critical_css_state',
		action_name: 'set-provider-css',
		schema: {
			state: CriticalCssStateSchema,
			action_request: z.object( {
				key: z.string(),
				css: z.string(),
			} ),
			action_response: z.object( {
				success: z.boolean(),
				state: CriticalCssStateSchema,
			} ),
		},
		callbacks: {
			onResult: ( result, _state ): CriticalCssState => {
				if ( result.success ) {
					return result.state;
				}

				return errorState( __( 'Critical CSS state update failed', 'jetpack-boost' ) );
			},
		},
	} ).mutateAsync;
}

export function useSetProviderErrorDismissed() {
	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'critical_css_state',
		action_name: 'set-provider-error-dismissed',
		schema: {
			state: CriticalCssStateSchema,
			action_request: z.object( {
				key: z.string(),
				dismissed: z.boolean(),
			} ),
			action_response: z.object( {
				success: z.boolean(),
				state: CriticalCssStateSchema,
			} ),
		},
		callbacks: {
			onResult: ( result, _state ): CriticalCssState => {
				if ( result.success ) {
					return result.state;
				}

				return errorState( __( 'Critical CSS state update failed', 'jetpack-boost' ) );
			},
		},
	} ).mutateAsync;
}

export function useSetProviderErrors() {
	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'critical_css_state',
		action_name: 'set-provider-errors',
		schema: {
			state: CriticalCssStateSchema,
			action_request: z.object( {
				key: z.string(),
				errors: z.array( CriticalCssErrorDetailsSchema ),
			} ),
			action_response: z.object( {
				success: z.boolean(),
				state: CriticalCssStateSchema,
			} ),
		},
		callbacks: {
			onResult: ( result, _state ): CriticalCssState => {
				if ( result.success ) {
					return result.state;
				}

				return errorState( __( 'Critical CSS state update failed', 'jetpack-boost' ) );
			},
		},
	} ).mutateAsync;
}

export function useRegenerateCriticalCssAction() {
	const [ , resetReason ] = useRegenerationReason();

	return useDataSyncAction( {
		namespace: 'jetpack_boost_ds',
		key: 'critical_css_state',
		action_name: 'request-regenerate',
		schema: {
			state: CriticalCssStateSchema,
			action_request: z.void(),
			action_response: z.object( {
				success: z.boolean(),
				state: CriticalCssStateSchema,
			} ),
		},
		callbacks: {
			onResult: ( result, _state ): CriticalCssState => {
				if ( result.success ) {
					resetReason();

					return result.state;
				}

				return errorState( __( 'Critical CSS regeneration request failed', 'jetpack-boost' ) );
			},
		},
	} ).mutate;
}

export function isFatalError( cssState: CriticalCssState ) {
	if ( cssState.status === 'error' ) {
		return true;
	}

	if ( cssState.status === 'not_generated' ) {
		return false;
	}

	return ! cssState.providers.some( provider =>
		[ 'success', 'pending' ].includes( provider.status )
	);
}

/**
 * Given a set of CSS Provider states, and optionally the local generator progress through the current
 * provider, calculate the overall progress of the Critical CSS generation.
 *
 * @param {Provider[]} providers        - The set of CSS Providers
 * @param {number}     providerProgress - The progress through the current provider (optional).
 */
export function calculateCriticalCssProgress(
	providers: Provider[],
	providerProgress: number = 0
): number {
	const count = providers.length;
	const done = providers.filter( provider => provider.status !== 'pending' ).length;
	const totalProgress = 100 * ( done / count + providerProgress / count );

	return totalProgress;
}

export function useProxyNonce() {
	const [ { data: meta } ] = useDataSync(
		'jetpack_boost_ds',
		'critical_css_meta',
		z.object( {
			proxy_nonce: z.string().optional(),
		} )
	);

	if ( ! meta || ! meta.proxy_nonce ) {
		throw new Error( 'Proxy nonce not available' );
	}

	return meta?.proxy_nonce;
}

export function useLocalGenerator() {
	const [ cssState, setCssState ] = useCriticalCssState();
	const setProviderCss = useSetProviderCss();
	const setProviderErrors = useSetProviderErrors();
	const proxyNonce = useProxyNonce();

	// Track minor progress within each Provider.
	const [ providerProgress, setProviderProgress ] = useState( 0 );

	useEffect( () => {
		if ( cssState.status === 'pending' ) {
			return runLocalGenerator( cssState.providers, proxyNonce, {
				onError: ( error: Error ) => {
					setCssState( errorState( error.message ) );
				},

				setProviderCss: async ( key: string, css: string ) => {
					await setProviderCss( { key, css } );
				},

				setProviderErrors: async ( key: string, errors: CriticalCssErrorDetails[] ) => {
					await setProviderErrors( { key, errors } );
				},

				setProviderProgress,
			} );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Only run when cssState.status changes
	}, [ cssState.status ] );

	return calculateCriticalCssProgress( cssState.providers, providerProgress );
}
