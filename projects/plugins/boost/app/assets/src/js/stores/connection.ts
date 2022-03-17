/**
 * External dependencies
 */
import { writable } from 'svelte/store';

/**
 * Internal dependencies
 */
import api from '../api/api';

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
		partialUpdate( await api.post( '/connection' ) );
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
