import { writable } from 'svelte/store';
import api from '../api/api';
import { reloadModulesState } from './modules';

export type ConnectionStatus = {
	isConnecting: boolean;
	connected: boolean;
	error: null | string;
};

// eslint-disable-next-line camelcase
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

		partialUpdate( connection );
	} catch ( e ) {
		partialUpdate( {
			isConnecting: false,
			error: e,
		} );
	}
}

export const connection = {
	subscribe,
	initialize,
	refresh,
};
