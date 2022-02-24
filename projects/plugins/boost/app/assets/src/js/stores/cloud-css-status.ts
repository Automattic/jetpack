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

// eslint-disable-next-line camelcase
const initialState = Jetpack_Boost.cloudCssStatus || {
	created: 0,
	updated: 0,
	total: 0,
	completed: 0,
	pending: false,
};

const { subscribe, update } = writable< CloudCssStatus >( initialState );

/**
 * Helper method to update Cloud CSS generation progress status.
 *
 * @param {number}  completed Completed provider keys.
 * @param {number}  updated   Updated timestamp.
 * @param {boolean} pending   Cloud CSS generation pending status.
 */
export function updateGenerateStatus( completed: number, updated: number, pending: boolean ): void {
	return update( state => ( {
		...state,
		completed,
		updated,
		pending,
	} ) );
}

export const cloudCssStatus = {
	subscribe,
};
