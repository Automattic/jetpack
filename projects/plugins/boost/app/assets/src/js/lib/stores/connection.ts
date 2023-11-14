import { writable } from 'svelte/store';
import api from '../api/api';
import { reloadModulesState } from './modules';

export type ConnectionStatus = {
	connected: boolean;
	userConnected: boolean;
	wpcomBlogId: number;
};

const initialState = Jetpack_Boost.connection;
const connectionStatus = writable< ConnectionStatus >( initialState );

/**
 * Get the URL to upgrade boost.
 *
 * Ideally this function should not exist and
 * `getRedirectUrl( 'boost-plugin-upgrade-default', { site: config.site.domain, query, anchor: 'purchased' } )`
 * should be used instead. However, the redirect changes the redirect URL in a broken manner.
 *
 * @param domain
 * @param isUserConnected
 */
export function getUpgradeURL( domain: string, isUserConnected = false ) {
	const product = 'jetpack_boost_yearly';

	const redirectUrl = new URL( window.location.href );
	redirectUrl.hash = '#/purchase-successful';

	const checkoutProductUrl = new URL( `https://wordpress.com/checkout/${ domain }/${ product }` );

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', redirectUrl.toString() );

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', domain );

	// If not connected, add unlinked=1 to query string to tell wpcom to connect the site.
	if ( ! isUserConnected ) {
		checkoutProductUrl.searchParams.set( 'unlinked', '1' );
	}

	return checkoutProductUrl.toString();
}

export async function initializeConnection(): Promise< void > {
	const connection = ( await api.post( '/connection' ) ) as ConnectionStatus;

	// As a part of connecting (before marking the connection as ready)
	// refresh the modules state to fetch the latest.
	// Ideally, we should replace this with a more general server-state update thing.
	// 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻 🔻
	if ( connection.connected ) {
		await reloadModulesState();
	}
	// 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺 🔺

	connectionStatus.update( store => {
		return { ...store, ...connection };
	} );
}

// Export only the readable store.
export const connection = {
	subscribe: connectionStatus.subscribe,
};
