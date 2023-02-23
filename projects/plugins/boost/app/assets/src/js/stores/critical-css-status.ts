import { derived, get } from 'svelte/store';
// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod';
import api from '../api/api';
import {
	CriticalCssIssue,
	criticalCSSState,
	CriticalCssStatusSchema,
} from './critical-css-status-ds';
import { modules } from './modules';
import type { JSONObject } from '../utils/json-types';

export type CriticalCssStatus = z.infer< typeof CriticalCssStatusSchema >;

const SUCCESS = 'success';
const FAIL = 'fail';
const REQUESTING = 'requesting';

const resetState = {
	progress: 0,
	success_count: 0,
	retried_show_stopper: false,
	status: 'not_generated',
	issues: [],
};

const store = criticalCSSState.store;
// @REFACTORING
window.store = store;
const { subscribe, update, set } = store;

export function getStatus() {
	return get( store );
}

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
	state =>
		state.status === 'error' ||
		state.success_count === undefined ||
		( state.status === 'success' && state.success_count === 0 )
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

	return get( store );
}

export function increaseSuccessCount( count: number ): void {
	update( state => ( {
		...state,
		success_count: state.success_count + count,
	} ) );
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
	if ( reset ) {
		// @REFACTOR: Use the WP JS Stores API instead and ensure that the CSS has indeed been reset.
		const result = await api.post( '/critical-css/start' );
		if ( result.status !== SUCCESS ) {
			throw new Error( JSON.stringify( result ) );
		}
		const data = result.data as Partial< CriticalCssStatus >;
		const newState = {
			...resetState,
			created: Date.now(),
			update: Date.now(),
			status: REQUESTING,
			viewports: data.viewports,
			generation_nonce: data.generation_nonce,
			proxy_nonce: data.proxy_nonce,
			callback_passthrough: data.callback_passthrough,
			sources: data.sources,
		};
		set( newState );
	} else {
		update( state => ( {
			...state,
			retried_show_stopper: isShowstopperRetry,
		} ) );
	}

	return get( store );
}

export function stopTheShow(): void {
	return update( state => ( {
		...state,
		show_stopper: true,
		status: 'error',
	} ) );
}

export async function sendGenerationResult(
	providerKey: string,
	endpoint: 'insert',
	body: JSONObject
): Promise< CriticalCssStatus | false > {
	const result = callCriticalCssEndpoint(
		'post',
		`/critical-css/${ providerKey }/${ endpoint }`,
		body
	);
	increaseSuccessCount( 1 );
	return result;
}

export default function setProviderIssue( providerKey: string, issue: CriticalCssIssue ): void {
	update( state => {
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

export function updateIssues( issues: CriticalCssIssue[] ): void {
	return update( state => ( {
		...state,
		issues: [ ...issues ],
	} ) );
}

export const criticalCssStatus = {
	subscribe,
};
