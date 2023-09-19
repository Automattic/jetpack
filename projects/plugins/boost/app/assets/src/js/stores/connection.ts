import { tick } from 'svelte';
import { get, writable } from 'svelte/store';
import api from '../api/api';
import config from './config';
import { regenerateCriticalCss } from './critical-css-state';
import { modulesState, reloadModulesState } from './modules';

export type ConnectionStatus = {
	connected: boolean;
	userConnected: boolean;
	error: null | Error;
};

const initialState = Jetpack_Boost.connection;
const { subscribe, update } = writable< ConnectionStatus >( initialState );

function partialUpdate( data: Partial< ConnectionStatus > ) {
	update( store => {
		return { ...store, ...data };
	} );
}

/**
 * Get the URL to upgrade boost.
 *
 * Ideally this function should not exist and
 * `getRedirectUrl( 'boost-plugin-upgrade-default', { site: config.site.domain, query, anchor: 'purchased' } )`
 * should be used instead. However, the redirect changes the redirect URL in a broken manner.
 */
export function getUpgradeURL() {
	const siteSuffix = get( config ).site.domain;
	const product = 'jetpack_boost_yearly';

	const redirectUrl = new URL( window.location.href );
	redirectUrl.hash = '#/purchase-successful';

	const checkoutProductUrl = new URL(
		`https://wordpress.com/checkout/${ siteSuffix }/${ product }`
	);

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', redirectUrl.toString() );

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', siteSuffix );

	// If not connected, add unlinked=1 to query string to tell wpcom to connect the site.
	if ( ! isUserConnected() ) {
		checkoutProductUrl.searchParams.set( 'unlinked', '1' );
	}

	return checkoutProductUrl.toString();
}

/**
 * Run all the tasks to be performed upon connection completion.
 */
async function onConnectionComplete(): Promise< void > {
	await config.refresh();

	// Request fresh Cloud CSS if cloud_css is enabled
	if ( get( modulesState ).cloud_css?.active ) {
		await regenerateCriticalCss();
	}
}

/**
 * Returns true if the current user is connected to WordPress.com via Jetpack.
 *
 * @return {boolean} True if connected.
 */
export function isUserConnected(): boolean {
	return get( connection ).userConnected;
}

export async function initializeConnection(): Promise< void > {
	try {
		const connection = await api.post( '/connection' );

		// As a part of connecting (before marking the connection as ready)
		// refresh the modules state to fetch the latest.
		// Ideally, we should replace this with a more general server-state update thing.
		// 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻
		if ( connection.connected ) {
			await reloadModulesState();
		}
		// 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺

		await onConnectionComplete();
		partialUpdate( connection );
	} catch ( e ) {
		partialUpdate( {
			error: e,
		} );
	} finally {
		// Wait for the next tick to ensure that the connection status is updated.
		await tick();
	}
}

export const connection = {
	subscribe,
};
