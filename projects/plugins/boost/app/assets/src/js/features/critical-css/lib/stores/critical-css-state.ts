import { derived, get, writable } from 'svelte/store';
import api from '$lib/api/api';
import { CriticalCssStateSchema } from './critical-css-state-types';
import { jetpack_boost_ds, JSONObject } from '$lib/stores/data-sync-client';
import { suggestRegenerateDS } from './suggest-regenerate';
import { modulesState } from '$lib/stores/modules';
import type { CriticalCssState, Provider } from './critical-css-state-types';
import { startLocalGenerator } from '../generate-critical-css';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { useEffect, useState } from 'react';

type RegenerateAction = { type: 'regenerate' };
type ProviderSuccess = { type: 'provider-success'; key: string; css: string };
type ProviderError = { type: 'provider-error'; key: string; errors: string[] };
type GenerateFinished = { type: 'finished' };
type GenerateError = { type: 'error'; error: Error };
type CriticalCssAction =
	| RegenerateAction
	| ProviderSuccess
	| ProviderError
	| GenerateFinished
	| GenerateError;

type GenerationResponse = {
	status: 'success';
	data: CriticalCssState;
};

export function useCriticalCssState( isCloud: boolean ) {
	const [ generatorRunning, setGeneratorRunning ] = useState( false );
	const [ autoStarted, setAutoStarted ] = useState( false );

	const [ { data: cssState }, { mutate, mutateAsync } ] = useDataSync(
		'jetpack_boost_ds',
		'critical_css_state',
		CriticalCssStateSchema,
		{
			query: {
				refetchInterval: s => ( isCloud && s.state.status === 'pending' ? 2000 : false ),
			},

			mutation: {
				mutationFn: async ( action: CriticalCssAction ): Promise< CriticalCssState > => {
					console.trace( action );

					switch ( action.type ) {
						case 'regenerate':
							return await sendRegenerateRequest();

						default:
							throw new Error( 'Invalid action type' );
					}
				},
			},
		}
	);

	function runGenerator() {
		setGeneratorRunning( true );

		return startLocalGenerator( {
			targets: cssState!.providers.filter( provider => provider.status === 'pending' ) as any,

			onProviderSuccess: async ( key, css ) => {
				await mutateAsync( { type: 'provider-success', key, css } );
			},

			onProviderError: async ( key, errors ) => {
				await mutateAsync( { type: 'provider-error', key, errors } );
			},

			onSuccess: async () => {
				setGeneratorRunning( false );
				await mutateAsync( { type: 'finished' } );
			},

			onError: async error => {
				setGeneratorRunning( false );
				await mutateAsync( { type: 'error', error } );
			},
		} );
	}

	// One time only - if we are in a pending state when this component mounts, start the generator.
	useEffect( () => {
		if (
			! autoStarted &&
			cssState?.status === 'pending' &&
			! isCloud &&
			cssState?.providers.length > 0
		) {
			setAutoStarted( true );
			return runGenerator();
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps -- only ever update on status change.
	}, [] );

	async function requestRegenerate() {
		// @TODO: Move me to React, too.
		suggestRegenerateDS.store.set( null );

		await mutate( { type: 'regenerate' } );
	}

	if ( ! cssState ) {
		throw new Error( 'Critical CSS state not available' );
	}

	return {
		cssState,
		requestRegenerate,
		generatorRunning,
	};
}

async function sendRegenerateRequest() {
	const result = await api.post< GenerationResponse >( '/critical-css/regenerate' );
	if ( result.status !== 'success' ) {
		throw new Error( JSON.stringify( result ) );
	}

	console.log( result.data );
	return result.data as CriticalCssState;
}

/* Old stuff */

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

export const replaceCssState = ( value: CriticalCssState ) => {
	cssStateStore.update( oldValue => {
		return { ...oldValue, ...value };
	} );
};

/**
 * Derived datastore: Returns whether to show an error.
 * Show an error if in error state, or if a success has 0 results.
 */
const showError = derived( cssStateStore, $criticalCssState => {
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

export function criticalCssFatalError(): void {}

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

export function storeGenerateError( error: Error ): void {}

export function updateProvider( providerKey: string, data: Partial< Provider > ): void {
	return cssStateStore.update( $state => {
		const providerIndex = $state.providers.findIndex( provider => provider.key === providerKey );

		$state.providers[ providerIndex ] = {
			...$state.providers[ providerIndex ],
			...data,
		};

		return $state;
	} );
}

export const refreshCriticalCssState = async () => {
	const state = await stateClient.endpoint.GET();
	cssStateStore.override( state );
	return state;
};

export const regenerateCriticalCss = async () => {};

/**
 * Call generateCriticalCss if it hasn't been called before this app execution
 * (browser pageload), to verify if Critical CSS needs to be generated.
 *
 * @param state
 */
export async function continueGeneratingLocalCriticalCss( state: CriticalCssState ) {}

export const localCriticalCSSProgress = writable< undefined | number >( undefined );

export const criticalCssProgress = derived(
	[ cssStateStore, localCriticalCSSProgress ],
	( [ $criticalCssState, $localProgress ] ) => {
		if ( $criticalCssState.status === 'generated' ) {
			return 100;
		}

		if ( $criticalCssState.status === 'not_generated' ) {
			return 0;
		}

		const totalCount = Math.max( 1, $criticalCssState.providers.length );
		const doneCount = $criticalCssState.providers.filter(
			provider => provider.status !== 'pending'
		).length;
		const percentDone = ( doneCount / totalCount ) * 100;

		const percentPerStep = 100 / totalCount;
		const currentStep = $localProgress || 0;

		const combinedProgress = percentDone + percentPerStep * currentStep;

		return Math.round( combinedProgress );
	}
);
