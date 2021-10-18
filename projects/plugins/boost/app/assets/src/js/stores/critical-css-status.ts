/**
 * External dependencies
 */
import api from '../api/api';
import { derived, writable } from 'svelte/store';

/**
 * Internal dependencies
 */
import type { JSONObject } from '../utils/json-types';
import type { ProviderKeyUrls, ProvidersSuccessRatio } from '../utils/generate-critical-css';
import type { Viewport } from '../utils/types';

export type CriticalCssErrorDetails = {
	message: string;
	type: string;
	meta: JSONObject;
};

/* eslint-disable camelcase */
export interface CriticalCssStatus {
	generating: boolean;
	progress: number;
	retried_show_stopper: boolean;
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
	percent_complete?: number;
	viewports?: Viewport[];
}
/* eslint-enable camelcase */

const success = 'success';
const fail = 'fail';

const initialState = Jetpack_Boost.criticalCssStatus || {
	generating: false,
	progress: 0,
	status: 'not_generated',
	retried_show_stopper: false,
};

const { subscribe, update } = writable< CriticalCssStatus >( initialState );

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
	[ success, fail ].includes( state.status )
);

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

	if ( response.status !== success ) {
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
 * @param {boolean} generating True if generation process is running.
 * @param {number}  progress   Progress expressed as a %.
 */
export function updateGenerateStatus( generating: boolean, progress: number ): void {
	return update( state => ( {
		...state,
		generating,
		progress,
		status: generating ? 'requesting' : state.status,
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

export const criticalCssStatus = {
	subscribe,
};
