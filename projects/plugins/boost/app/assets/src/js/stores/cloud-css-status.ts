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
	pending: false,
};

// eslint-disable-next-line camelcase
const initialState = Jetpack_Boost.cloudCssStatus || resetState;

const { subscribe, update } = writable< CloudCssStatus >( initialState );

/**
 * Helper method to update Cloud CSS generation progress status.
 *
 * @param {CloudCssStatus} status Cloud CSS generation status.
 */
export function updateStatus( status: CloudCssStatus ): void {
	const { completed, updated, pending } = status;
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
