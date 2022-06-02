import { derived, writable } from 'svelte/store';
import api from '../api/api';
import { modules } from './modules';
import type { ProviderKeyUrls, ProvidersSuccessRatio } from '../utils/generate-critical-css';
import type { JSONObject } from '../utils/json-types';
import type { Viewport } from '../utils/types';

export type CriticalCssErrorDetails = {
	message: string;
	type: string;
	meta: JSONObject;
};

/* eslint-disable camelcase */
export interface CriticalCssStatus {
	progress: number;
	retried_show_stopper?: boolean;
	callback_passthrough?: JSONObject;
	generation_nonce?: string;
	proxy_nonce?: string;
	pending_provider_keys?: ProviderKeyUrls;
	provider_success_ratio?: ProvidersSuccessRatio;
	status: string;
	core_providers?: string[];
	core_providers_status?: string;
	status_error?: Error | string;
	providers_errors?: {
		[ providerKey: string ]: {
			[ url: string ]: CriticalCssErrorDetails;
		};
	};
	provider_key_labels?: { [ name: string ]: string };
	success_count?: number;
	created?: number;
	viewports?: Viewport[];
}
/* eslint-enable camelcase */

const SUCCESS = 'success';
const FAIL = 'fail';
const REQUESTING = 'requesting';

const resetState = {
	progress: 0,
	success_count: 0,
	retried_show_stopper: false,
	status: 'not_generated',
};

// eslint-disable-next-line camelcase
const initialState = Jetpack_Boost.criticalCssStatus || resetState;

const store = writable< CriticalCssStatus >( initialState );
const { subscribe, update } = store;

let status;
subscribe( state => ( status = state ) );

export function getStatus() {
	return status;
}

/**
 * Derived datastore: contains the number of provider keys which failed in the
 * latest Critical CSS generation run.
 */
export const failedProviderKeyCount = derived( { subscribe }, state =>
	state.providers_errors ? Object.keys( state.providers_errors ).length : 0
);

/**
 * Derived datastore: Returns true if the Critical CSS status indicates the process
 * is complete - i.e.: is success or fail.
 */
export const isFinished = derived( { subscribe }, state =>
	[ SUCCESS, FAIL ].includes( state.status )
);

/**
 * Derived datastore: Returns whether to show an error.
 * Show an error if in error state, or if a success has 0 results.
 */
export const showError = derived(
	{ subscribe },
	state => state.status === 'error' || ( state.status === 'success' && state.success_count === 0 )
);

export const isGenerating = derived( [ store, modules ], ( [ $store, $modules ] ) => {
	const statusIsRequesting = REQUESTING === $store.status;
	const criticalCssIsEnabled = $modules[ 'critical-css' ] && $modules[ 'critical-css' ].enabled;
	const cloudCssIsEnabled = $modules[ 'cloud-css' ] && $modules[ 'cloud-css' ].enabled;

	return statusIsRequesting && ( criticalCssIsEnabled || cloudCssIsEnabled );
} );

type CriticalCssApiResponse = {
	status: string;
	code?: string;
	// eslint-disable-next-line camelcase
	status_update?: CriticalCssStatus;
};

/**
 * Call a Critical CSS endpoint which may return a status update, returning the
 * status update (and updating the status accordingly).
 *
 * @param {'post' | 'get'}         method HTTP method to use.
 * @param {string}                 url    endpoint to call
 * @param {JSONObject | undefined} body   optional body to include in request.
 * @return {Promise< CriticalCssStatus | false >} Critical CSS status, or false if module not enabled.
 */
async function callCriticalCssEndpoint(
	method: 'post' | 'get',
	url: string,
	body?: JSONObject
): Promise< CriticalCssStatus | false > {
	const response = await api[ method ]< CriticalCssApiResponse >( url, body );
	if ( response.status === 'module-unavailable' ) {
		return false;
	}

	if ( response.status !== SUCCESS ) {
		throw new Error(
			response.code ||
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				( response as any ).message ||
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				( response as any ).error ||
				JSON.stringify( response )
		);
	}

	update( state => ( {
		...state,
		...response.status_update,
	} ) );

	return response.status_update;
}

/**
 * Helper method to update Critical CSS generation progress status.
 *
 * @param {CriticalCssStatus} cssStatus Critical CSS generation status.
 */
export function updateGenerateStatus( cssStatus: CriticalCssStatus ): void {
	return update( state => ( {
		...state,
		...cssStatus,
	} ) );
}

/**
 * Send a request to the server requesting that Critical CSS gets regenerated.
 *
 * @param {boolean} reset              True if existing results should be thrown away before starting.
 * @param {boolean} isShowstopperRetry True if this request is kicking off a retry after a showstopper error.
 */
export async function requestGeneration(
	reset: boolean,
	isShowstopperRetry: boolean
): Promise< CriticalCssStatus | false > {
	update( state => ( {
		...state,
		retried_show_stopper: isShowstopperRetry,
	} ) );

	return callCriticalCssEndpoint( 'post', '/critical-css/request-generate', {
		reset,
	} );
}

export async function sendGenerationResult(
	providerKey: string,
	endpoint: string,
	body: JSONObject
): Promise< CriticalCssStatus | false > {
	return callCriticalCssEndpoint( 'post', `/critical-css/${ providerKey }/${ endpoint }`, body );
}

export function storeGenerateError( error: Error ): void {
	update( oldState => ( {
		...oldState,
		status: 'error',
		status_error: error,
	} ) );
}

export function resetCloudStatus(): void {
	return update( state => ( {
		...state,
		...resetState,
		status: REQUESTING,
	} ) );
}

export function resetCloudRetryStatus(): void {
	return update( state => ( {
		...state,
		...resetState,
		status: REQUESTING,
		retried_show_stopper: true,
	} ) );
}

export function setError(): void {
	return update( state => ( {
		...state,
		status: 'error',
	} ) );
}

export const criticalCssStatus = {
	subscribe,
};
