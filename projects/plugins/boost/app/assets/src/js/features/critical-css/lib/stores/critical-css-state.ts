/* eslint-disable no-console */
import { derived, get, writable } from 'svelte/store';
// eslint-disable-next-line import/no-extraneous-dependencies
import api from '$lib/api/api';
import { startPollingCloudStatus } from '../cloud-css';
import { CriticalCssStateSchema } from './critical-css-state-types';
import { jetpack_boost_ds, JSONObject } from '$lib/stores/data-sync-client';
import { suggestRegenerateDS } from './suggest-regenerate';
import { modulesState } from '$lib/stores/modules';
import type { CriticalCssState, Provider } from './critical-css-state-types';
import generateCriticalCss from '../generate-critical-css';

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

export const regenerateCriticalCss = async () => {
	// Clear regeneration suggestions
	suggestRegenerateDS.store.set( null );

	// Immediately set the status to pending to disable the regenerate button
	replaceCssState( { status: 'pending' } );

	// This will clear the CSS from the database
	// And return fresh nonce, provider and viewport data.
	const freshState = await generateCriticalCssRequest();
	if ( ! freshState ) {
		// @REFACTORING - Handle error. Currently this dies silently.
		return false;
	}

	// We received a fresh state from the server,
	// it's already saved there,
	// This will update the store without triggering a save back to the server.
	cssStateStore.override( freshState );

	const isCloudCssEnabled = get( modulesState ).cloud_css?.active || false;

	if ( isCloudCssEnabled ) {
		startPollingCloudStatus();
	} else {
		await continueGeneratingLocalCriticalCss( freshState );
	}
};

/**
 * Call generateCriticalCss if it hasn't been called before this app execution
 * (browser pageload), to verify if Critical CSS needs to be generated.
 *
 * @param state
 */
export async function continueGeneratingLocalCriticalCss( state: CriticalCssState ) {
	if ( state.status === 'generated' ) {
		return;
	}
	const generatingSucceeded = await generateCriticalCss( state );
	const status = generatingSucceeded ? 'generated' : 'error';
	replaceCssState( { status } );
}

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
