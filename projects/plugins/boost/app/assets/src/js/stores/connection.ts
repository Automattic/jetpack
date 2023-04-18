import { tick } from 'svelte';
import { get, writable } from 'svelte/store';
import api from '../api/api';
import { onConnectionComplete } from '../utils/connection';
import { reloadModulesState } from './modules';

export type ConnectionStatus = {
	isConnecting: boolean;
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

async function refresh(): Promise< void > {
	partialUpdate( await api.get( '/connection' ) );
}

/**
 * Returns true if the current user is connected to WordPress.com via Jetpack.
 *
 * @return {boolean} True if connected.
 */
export function isUserConnected(): boolean {
	return get( connection ).userConnected;
}

async function initialize(): Promise< void > {
	partialUpdate( { isConnecting: true } );
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
			isConnecting: false,
			error: e,
		} );
	} finally {
		// Wait for the next tick to ensure that the connection status is updated.
		await tick();
	}
}

export const connection = {
	subscribe,
	initialize,
	refresh,
};
