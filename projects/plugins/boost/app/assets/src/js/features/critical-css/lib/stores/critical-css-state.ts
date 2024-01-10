/* eslint-disable no-console */
import { derived, get } from 'svelte/store';
// eslint-disable-next-line import/no-extraneous-dependencies
import api from '$lib/api/api';
import { CriticalCssErrorDetailsSchema, CriticalCssStateSchema } from './critical-css-state-types';
import { jetpack_boost_ds, JSONObject } from '$lib/stores/data-sync-client';
import { modulesState } from '$lib/stores/modules';
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
				console.log( { s: result.state } );
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
					return result.state;
				}

				return errorState( __( 'Critical CSS regeneration request failed', 'jetpack-boost' ) );
			},
		},
	} ).mutate;
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

export function useLocalGenerator() {
	const [ cssState, setCssState ] = useCriticalCssState();
	const setProviderCss = useSetProviderCss();
	const setProviderErrors = useSetProviderErrors();

	// Track minor progress within each Provider.
	const [ providerProgress, setProviderProgress ] = useState( 0 );

	useEffect( () => {
		if ( cssState.status === 'pending' ) {
			return runLocalGenerator( cssState.providers, {
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

/**
 * Old stuff to get rid of.
 */

const stateClient = jetpack_boost_ds.createAsyncStore(
	'critical_css_state',
	CriticalCssStateSchema
);
const cssStateStore = stateClient.store;

export const criticalCssState = {
	subscribe: cssStateStore.subscribe,
	refresh: async () => {
		const status = await stateClient.endpoint.GET();
		const storeStatus = get( cssStateStore );

		// This is a temporary fix.
		// Compare status and storeStatus by serializing and update store if they differ.
		// This is to avoid unnecessary updates to the store, which can cause rerenders.
		if ( JSON.stringify( status ) !== JSON.stringify( storeStatus ) ) {
			// .override will set the store values without triggering
			// an update back to the server.
			cssStateStore.override( status );
		}
	},
};

export const criticalCssStateCreated = get( criticalCssState ).created ?? 0;

export const replaceCssState = ( value: CriticalCssState ) => {
	cssStateStore.update( oldValue => {
		return { ...oldValue, ...value };
	} );
};

/**
 * Derived datastore: Returns whether to show an error.
 * Show an error if in error state, or if a success has 0 results.
 */
export const showError = derived( cssStateStore, $criticalCssState => {
	if ( $criticalCssState.status === 'generated' ) {
		return (
			$criticalCssState.providers.filter( ( provider: Provider ) => provider.status === 'error' )
				.length > 0
		);
	}

	return $criticalCssState.status === 'error';
} );

/**
 * Fatal error when no providers are successful.
 */
export const isFatalError = derived(
	[ cssStateStore, showError ],
	( [ $criticalCssState, $showError ] ) => {
		if ( ! $showError ) {
			return false;
		}
		return ! $criticalCssState.providers.some( provider => provider.status === 'success' );
	}
);

export const isGenerating = derived(
	[ cssStateStore, modulesState ],
	( [ $criticalCssState, $modulesState ] ) => {
		const statusIsRequesting = $criticalCssState.status === 'pending';

		return (
			statusIsRequesting &&
			( $modulesState.cloud_css.active || $modulesState.critical_css.available )
		);
	}
);

type GenerationResponse = {
	status: 'success';
	data: CriticalCssState;
};
export async function generateCriticalCssRequest(): Promise< CriticalCssState | false > {
	// @REFACTOR: Use the WP JS Stores API instead and ensure that the CSS has indeed been reset.
	const result = await api.post< GenerationResponse >( '/critical-css/start' );
	if ( result.status !== 'success' ) {
		throw new Error( JSON.stringify( result ) );
	}
	return result.data as Partial< CriticalCssState >;
}

export function criticalCssFatalError(): void {
	replaceCssState( { status: 'error' } );
}

type CriticalCssInsertResponse = {
	status: 'success' | 'error' | 'module-unavailable';
	code: string;
};
export async function saveCriticalCssChunk(
	providerKey: string,
	css: string,
	passthrough: JSONObject
): Promise< boolean > {
	const response = await api.post< CriticalCssInsertResponse >(
		`/critical-css/${ providerKey }/insert`,
		{
			data: css,
			passthrough,
		}
	);

	if ( response.status === 'module-unavailable' ) {
		return false;
	}

	if ( response.status !== 'success' ) {
		throw new Error(
			response.code ||
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				( response as any ).message ||
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				( response as any ).error ||
				JSON.stringify( response )
		);
	}

	return true;
}

export function storeGenerateError( error: Error ): void {
	replaceCssState( {
		status: 'error',
		status_error: error,
	} );
}
