/* eslint-disable no-console */
import { derived, get, writable } from 'svelte/store';
// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod';
import api from '../api/api';
import { requestCloudCss, retryCloudCss } from '../utils/cloud-css';
import generateCriticalCss from '../utils/generate-critical-css';
import {
	CriticalCssIssue,
	criticalCssDS,
	CriticalCssStatusSchema,
	Provider,
} from './critical-css-status-ds';
import { JSONObject } from './data-sync-client';
import { modules } from './modules';

export type CriticalCssStatus = z.infer< typeof CriticalCssStatusSchema >;

const resetState = {
	retried_show_stopper: false,
	status: 'not_generated',
	issues: [],
};

// @REFACTORING: Make this a read-only export.
export const criticalCssState = criticalCssDS.store;

export const localCriticalCSSProgress = writable< undefined | number >( undefined );

export const criticalCssProgress = derived(
	[ criticalCssState, localCriticalCSSProgress ],
	( [ $criticalCssState, $localProgress ] ) => {
		if ( $criticalCssState.status === 'generated' ) {
			return 100;
		}

		if ( $criticalCssState.status === 'not_generated' ) {
			return 0;
		}

		const totalCount = $criticalCssState.providers.length;
		const doneCount = $criticalCssState.providers.filter(
			provider => provider.status !== 'pending'
		).length;

		// `localProgress` provides a percentage 0-100 for each step for the Local critical CSS Generation
		// Convert that to a percentage of the total progress.
		let percent = Math.round( ( doneCount / totalCount ) * 100 );
		if (
			$localProgress !== undefined &&
			$localProgress > 0 &&
			$localProgress < 1 &&
			doneCount < totalCount &&
			doneCount > 0
		) {
			const percentPerStep = 100 / totalCount;
			percent += $localProgress * percentPerStep;
		}

		return percent;
	}
);

/**
 * Derived datastore: Returns whether to show an error.
 * Show an error if in error state, or if a success has 0 results.
 */
export const showError = derived( criticalCssState, $criticalCssState => {
	if ( $criticalCssState.status === 'generated' ) {
		return (
			$criticalCssState.providers.filter( ( provider: Provider ) => provider.status === 'error' )
				.length > 0
		);
	}

	return $criticalCssState.status === 'error';
} );

export const isGenerating = derived(
	[ criticalCssState, modules ],
	( [ $criticalCssState, $modules ] ) => {
		const statusIsRequesting = $criticalCssState.status === 'pending';
		const criticalCssIsEnabled = $modules[ 'critical-css' ] && $modules[ 'critical-css' ].enabled;
		const cloudCssIsEnabled = $modules[ 'cloud-css' ] && $modules[ 'cloud-css' ].enabled;

		return statusIsRequesting && ( criticalCssIsEnabled || cloudCssIsEnabled );
	}
);

/**
 * Start generating Critical CSS.
 *
 * @param {boolean} reset              True if existing results should be thrown away before starting.
 * @param {boolean} isShowstopperRetry True if this request is kicking off a retry after a showstopper error.
 */
type GenerationResponse = {
	// @REFACTORING: Implement error handling. Or see @REFACTOR below
	status: 'success';
	data: CriticalCssStatus;
};
export async function requestLocalCriticalCss(
	reset: boolean,
	isShowstopperRetry: boolean
): Promise< CriticalCssStatus | false > {
	if ( reset ) {
		// @REFACTOR: Use the WP JS Stores API instead and ensure that the CSS has indeed been reset.
		const result = await api.post< GenerationResponse >( '/critical-css/start' );
		if ( result.status !== 'success' ) {
			throw new Error( JSON.stringify( result ) );
		}
		const data = result.data as Partial< CriticalCssStatus >;
		const newState: CriticalCssStatus = {
			...resetState,
			created: Date.now(),
			updated: Date.now(),
			status: 'pending',
			viewports: data.viewports,
			generation_nonce: data.generation_nonce,
			proxy_nonce: data.proxy_nonce,
			callback_passthrough: data.callback_passthrough,
			providers: data.providers.map( provider => ( {
				...provider,
				status: 'pending',
			} ) ),
		};
		criticalCssState.set( newState );
	} else {
		criticalCssState.update( state => ( {
			...state,
			retried_show_stopper: isShowstopperRetry,
		} ) );
	}

	return get( criticalCssState );
}

export function stopTheShow(): void {
	return criticalCssState.update( state => ( {
		...state,
		show_stopper: true,
		status: 'error',
	} ) );
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

export default function setProviderIssue( providerKey: string, issue: CriticalCssIssue ): void {
	criticalCssState.update( state => {
		let providerIndex = -1;
		if ( ! state.issues ) {
			providerIndex = state.issues.findIndex( el => el.provider_name === providerKey );
		}
		if ( providerIndex !== -1 ) {
			const existingIssue = state.issues[ providerIndex ];
			const updatedIssue = { ...existingIssue, ...issue };
			state.issues.splice( providerIndex, 1, updatedIssue );
		} else {
			state.issues.push( issue );
		}
		return state;
	} );
}

export function storeGenerateError( error: Error ): void {
	criticalCssState.update( $criticalCssState => ( {
		...$criticalCssState,
		status: 'error',
		status_error: error,
	} ) );
}

export function setRequesting(): void {
	console.log( 'setRequesting' );
	return criticalCssState.update( state => ( {
		...state,
		...resetState,
		status: 'pending',
		issues: [],
	} ) );
}

export function resetCloudRetryStatus(): void {
	console.log( 'resetCloudRetryStatus' );
	return criticalCssState.update( state => ( {
		...state,
		...resetState,
		status: 'pending',
		retried_show_stopper: true,
	} ) );
}

export function setError(): void {
	return criticalCssState.update( state => ( {
		...state,
		status: 'error',
	} ) );
}

export function updateIssues( issues: CriticalCssIssue[] ): void {
	return criticalCssState.update( state => ( {
		...state,
		issues: [ ...issues ],
	} ) );
}

export function generationComplete(): void {
	return criticalCssState.update( state => ( {
		...state,
		status: 'generated',
	} ) );
}

export function updateProvider( providerKey: string, data: Partial< Provider > ): void {
	return criticalCssState.update( $state => {
		const providerIndex = $state.providers.findIndex( provider => provider.key === providerKey );

		$state.providers[ providerIndex ] = {
			...$state.providers[ providerIndex ],
			...data,
		};

		return $state;
	} );
}

export const criticalCssStatus = {
	subscribe: criticalCssState.subscribe,
};

export const refreshCriticalCssStatus = async () => {
	const state = await criticalCssDS.endpoint.GET();
	criticalCssState.override( state );
	return state;
};

export const regenerateCriticalCss = async () => {
	console.log( 'Regenerating CSS' );
	const $showError = get( showError );
	const $modules = get( modules );
	const $isCloudCssEnabled = $modules[ 'cloud-css' ]?.enabled || false;

	// SECTION:
	// CLOUD CSS
	if ( $isCloudCssEnabled ) {
		if ( $showError ) {
			console.log( 'retryCloudCss' );
			await retryCloudCss();
		} else {
			console.log( 'requestCloudCss' );
			await requestCloudCss();
		}
		return;
	}

	if ( $showError ) {
		console.log( 'retryCriticalCss' );
		await generateCriticalCss( true, true );
	} else {
		console.log( 'requestCriticalCss' );
		await generateCriticalCss( true, false );
	}

	// SECTION:
	// Critical CSS: Activated
	// generateCriticalCss( false, false )

	// SECTION:
	// CLOUD MODULE: Activated
	// onMount: pollCloudCssStatus
	// onActivate: requestCloudCss
};

window.store = criticalCssState;
window.storeUpdate = ( data: Partial< CriticalCssStatus > ) => {
	criticalCssState.update( state => ( {
		...state,
		...data,
	} ) );
};
