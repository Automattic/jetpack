/**
 * External dependencies
 */
import { writable } from 'svelte/store';

/* eslint-disable camelcase */
export interface CloudCssStatus {
	created: number;
	updated: number;
	total: number;
	completed: number;
	pending: boolean;
}
/* eslint-enable camelcase */

const resetState: CloudCssStatus = {
	created: 0,
	updated: 0,
	total: 0,
	completed: 0,
	pending: true,
};

// eslint-disable-next-line camelcase
const initialState = Jetpack_Boost.cloudCssStatus || resetState;

const { subscribe, update } = writable< CloudCssStatus >( initialState );

let status;
subscribe( state => ( status = state ) );

export function getStatus(): CloudCssStatus {
	return status;
}

/**
 * Helper method to update Cloud CSS generation progress status.
 *
 * @param {CloudCssStatus} cssStatus Cloud CSS generation status.
 */
export function updateStatus( cssStatus: CloudCssStatus ): void {
	const { completed, updated, pending } = cssStatus;
	return update( state => ( {
		...state,
		completed,
		updated,
		pending,
	} ) );
}

export function resetStatus(): void {
	return update( () => resetState );
}

export const cloudCssStatus = {
	subscribe,
};
