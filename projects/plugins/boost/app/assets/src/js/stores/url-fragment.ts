/**
 * External dependencies
 */
import { writable } from 'svelte/store';

/**
 * Present URL #fragment as a store, allowing for simple navigation behaviour.
 */
const { subscribe, set } = writable( window.location.hash );

// Catch URL changes and update state to match.
window.addEventListener( 'hashchange', () => {
	set( window.location.hash );
} );

/**
 * Navigate to the specified URL fragment.
 *
 * @param {string} fragment URL fragment to navigate to.
 */
export function navigateTo( fragment = '' ): void {
	window.location.hash = fragment;
}

export default {
	subscribe,
};
